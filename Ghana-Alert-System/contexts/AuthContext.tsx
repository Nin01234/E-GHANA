import React, { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadFaceImage, uploadNationalIdImage } from '@/lib/mediaUpload';

export type NationalIdType = 'ghana_card' | 'nhis' | 'driving_license' | 'voter_id' | 'passport';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  nationalIdType: string;
  nationalIdNumber: string;
  nationalIdImageUrl: string | null;
  faceImageUrl: string | null;
  isVerified: boolean;
  language: string;
  createdAt: string;
}

export interface RegisterData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  nationalIdType: NationalIdType;
  nationalIdNumber: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData, nationalIdImageUri?: string, faceImageUri?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser & { faceImageUri?: string; nationalIdImageUri?: string }>) => Promise<void>;
  verifyFace: (faceUri: string) => Promise<{ verified: boolean; confidence: number; message: string }>;
  resetPassword: (email: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const initialized = useRef(false);

  React.useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      refreshUser();
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        setUser(null);
        setIsGuest(false);
        return;
      }

      const authUser = sessionData.session.user;
      const { data: rows, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .limit(1);

      if (error || !rows || rows.length === 0) {
        setUser(null);
        return;
      }

      const row = rows[0] as any;
      const mapped: AuthUser = {
        id: row.id,
        fullName: row.fullName,
        email: row.email ?? null,
        phone: row.phone,
        nationalIdType: row.nationalIdType,
        nationalIdNumber: row.nationalIdNumber,
        nationalIdImageUrl: row.nationalIdImageUrl ?? null,
        faceImageUrl: row.faceImageUrl ?? null,
        isVerified: !!row.isVerified,
        language: row.language ?? 'en',
        createdAt: row.createdAt ?? new Date().toISOString(),
      };

      setUser(mapped);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      throw new Error('Invalid email or password');
    }

    const { data: rows, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .limit(1);

    if (profileError || !rows || rows.length === 0) {
      throw new Error('User profile not found');
    }

    const row = rows[0] as any;
    const mapped: AuthUser = {
      id: row.id,
      fullName: row.fullName,
      email: row.email ?? null,
      phone: row.phone,
      nationalIdType: row.nationalIdType,
      nationalIdNumber: row.nationalIdNumber,
      nationalIdImageUrl: row.nationalIdImageUrl ?? null,
      faceImageUrl: row.faceImageUrl ?? null,
      isVerified: !!row.isVerified,
      language: row.language ?? 'en',
      createdAt: row.createdAt ?? new Date().toISOString(),
    };

    setUser(mapped);
  }, []);

  const register = useCallback(async (formData: RegisterData, nationalIdImageUri?: string, faceImageUri?: string) => {
    if (!formData.email) {
      throw new Error('Email is required');
    }

    // Face biometric is required during signup only
    if (!faceImageUri) {
      throw new Error('Face verification is required for registration. Please take a selfie.');
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (signUpError || !signUpData.user) {
      throw new Error(signUpError?.message || 'Registration failed');
    }

    const { data: existingByPhone, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', formData.phone)
      .limit(1);

    if (existingError) {
      throw new Error(existingError.message);
    }
    if (existingByPhone && existingByPhone.length > 0) {
      throw new Error('Phone number already registered');
    }

    const userId = signUpData.user.id;

    // Upload face biometric (required during signup)
    const faceImageUrl = await uploadFaceImage(faceImageUri, userId);

    // Upload national ID image if provided
    let nationalIdImageUrl: string | null = null;
    if (nationalIdImageUri) {
      nationalIdImageUrl = await uploadNationalIdImage(nationalIdImageUri, userId);
    }

    const nowIso = new Date().toISOString();

    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        nationalIdType: formData.nationalIdType,
        nationalIdNumber: formData.nationalIdNumber,
        nationalIdImageUrl,
        faceImageUrl,
        isVerified: true,
        language: 'en',
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .select('*')
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message || 'Failed to create user profile');
    }

    const mapped: AuthUser = {
      id: inserted.id,
      fullName: inserted.fullName,
      email: inserted.email ?? null,
      phone: inserted.phone,
      nationalIdType: inserted.nationalIdType,
      nationalIdNumber: inserted.nationalIdNumber,
      nationalIdImageUrl: inserted.nationalIdImageUrl ?? null,
      faceImageUrl: inserted.faceImageUrl ?? null,
      isVerified: !!inserted.isVerified,
      language: inserted.language ?? 'en',
      createdAt: inserted.createdAt ?? new Date().toISOString(),
    };

    setUser(mapped);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsGuest(false);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<AuthUser & { faceImageUri?: string; nationalIdImageUri?: string }>) => {
    if (!user) return;

    const patch: Record<string, any> = {};
    if (updates.fullName) patch.fullName = updates.fullName;
    if (updates.email !== undefined) patch.email = updates.email;
    if (updates.language) patch.language = updates.language;

    if (updates.faceImageUri) {
      patch.faceImageUrl = await uploadFaceImage(updates.faceImageUri, user.id);
      patch.isVerified = true;
    }
    if (updates.nationalIdImageUri) {
      patch.nationalIdImageUrl = await uploadNationalIdImage(updates.nationalIdImageUri, user.id);
    }

    patch.updatedAt = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('users')
      .update(patch)
      .eq('id', user.id)
      .select('*')
      .single();

    if (error || !updated) {
      throw new Error(error?.message || 'Profile update failed');
    }

    const mapped: AuthUser = {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email ?? null,
      phone: updated.phone,
      nationalIdType: updated.nationalIdType,
      nationalIdNumber: updated.nationalIdNumber,
      nationalIdImageUrl: updated.nationalIdImageUrl ?? null,
      faceImageUrl: updated.faceImageUrl ?? null,
      isVerified: !!updated.isVerified,
      language: updated.language ?? 'en',
      createdAt: updated.createdAt ?? new Date().toISOString(),
    };

    setUser(mapped);
  }, [user]);

  const verifyFace = useCallback(async (faceUri: string): Promise<{ verified: boolean; confidence: number; message: string }> => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Upload face image to Supabase Storage
    const faceImageUrl = await uploadFaceImage(faceUri, user.id);

    const { data: updated, error } = await supabase
      .from('users')
      .update({
        faceImageUrl,
        isVerified: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('*')
      .single();

    if (error || !updated) {
      throw new Error(error?.message || 'Face verification failed');
    }

    setUser((prev) =>
      prev
        ? {
            ...prev,
            faceImageUrl: updated.faceImageUrl ?? prev.faceImageUrl,
            isVerified: true,
          }
        : prev,
    );

    return { verified: true, confidence: 100, message: 'Face verified successfully' };
  }, [user]);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user || isGuest,
    isGuest,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    verifyFace,
    resetPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        throw new Error(error.message || 'Failed to send reset email');
      }
    },
    loginAsGuest: async () => {
      setUser(null);
      setIsGuest(true);
    },
  }), [user, isLoading, isGuest, login, register, logout, refreshUser, updateProfile, verifyFace]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
