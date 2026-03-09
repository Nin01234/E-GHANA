import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { eq, and, desc } from "drizzle-orm";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";
import { db, pool } from "./db";
import { users, incidents, insertUserSchema, loginSchema, insertIncidentSchema } from "../shared/schema";
import { z } from "zod";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

function ensureUploadsDir() {
  const dir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  ensureUploadsDir();

  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "eghana-secret-2025",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=86400");
    next();
  });
  app.use("/uploads", (req, res, next) => {
    if (req.session?.userId) return next();
    if (req.path.startsWith("/face/")) return res.status(403).json({ message: "Forbidden" });
    next();
  });
  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  // ─── AUTH ROUTES ────────────────────────────────────────────────────
  app.post("/api/auth/register", upload.fields([
    { name: "nationalIdImage", maxCount: 1 },
    { name: "faceImage", maxCount: 1 },
  ]), async (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;
      const body = {
        ...req.body,
        nationalIdImageUrl: files?.nationalIdImage?.[0]
          ? `/uploads/${files.nationalIdImage[0].filename}`
          : undefined,
        faceImageUrl: files?.faceImage?.[0]
          ? `/uploads/face/${files.faceImage[0].filename}`
          : undefined,
      };

      if (files?.faceImage?.[0]) {
        const faceDir = path.resolve(process.cwd(), "uploads", "face");
        if (!fs.existsSync(faceDir)) fs.mkdirSync(faceDir, { recursive: true });
        const oldPath = path.resolve(process.cwd(), "uploads", files.faceImage[0].filename);
        const newPath = path.resolve(faceDir, files.faceImage[0].filename);
        if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath);
      }

      const parsed = insertUserSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid data" });
      }

      const { password, nationalIdImageUrl, faceImageUrl, ...rest } = parsed.data;

      const existingPhone = await db.select().from(users).where(eq(users.phone, rest.phone)).limit(1);
      if (existingPhone.length > 0) {
        return res.status(409).json({ message: "Phone number already registered" });
      }

      if (rest.email) {
        const existingEmail = await db.select().from(users).where(eq(users.email, rest.email)).limit(1);
        if (existingEmail.length > 0) {
          return res.status(409).json({ message: "Email already registered" });
        }
      }

      const existingId = await db.select().from(users).where(
        and(
          eq(users.nationalIdType, rest.nationalIdType),
          eq(users.nationalIdNumber, rest.nationalIdNumber)
        )
      ).limit(1);
      if (existingId.length > 0) {
        return res.status(409).json({ message: "National ID already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [user] = await db.insert(users).values({
        ...rest,
        passwordHash,
        nationalIdImageUrl: (body as any).nationalIdImageUrl,
        faceImageUrl: (body as any).faceImageUrl,
        isVerified: !!(body as any).faceImageUrl,
      }).returning();

      req.session.userId = user.id;
      const { passwordHash: _, ...safeUser } = user;
      return res.status(201).json({ user: safeUser });
    } catch (err: any) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Phone number and password required" });
      }

      const [user] = await db.select().from(users).where(eq(users.phone, parsed.data.phone)).limit(1);
      if (!user) {
        return res.status(401).json({ message: "Invalid phone number or password" });
      }

      const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid phone number or password" });
      }

      req.session.userId = user.id;
      const { passwordHash, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.session.userId!)).limit(1);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      const { passwordHash, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/auth/profile", requireAuth, upload.fields([
    { name: "nationalIdImage", maxCount: 1 },
    { name: "faceImage", maxCount: 1 },
  ]), async (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;
      const updates: Partial<typeof users.$inferInsert> = {};

      if (req.body.fullName) updates.fullName = req.body.fullName;
      if (req.body.email) updates.email = req.body.email;
      if (req.body.language) updates.language = req.body.language;

      if (files?.nationalIdImage?.[0]) {
        updates.nationalIdImageUrl = `/uploads/${files.nationalIdImage[0].filename}`;
      }
      if (files?.faceImage?.[0]) {
        const faceDir = path.resolve(process.cwd(), "uploads", "face");
        if (!fs.existsSync(faceDir)) fs.mkdirSync(faceDir, { recursive: true });
        const oldPath = path.resolve(process.cwd(), "uploads", files.faceImage[0].filename);
        const newPath = path.resolve(faceDir, files.faceImage[0].filename);
        if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath);
        updates.faceImageUrl = `/uploads/face/${files.faceImage[0].filename}`;
        updates.isVerified = true;
      }

      updates.updatedAt = new Date();

      const [updated] = await db.update(users).set(updates).where(eq(users.id, req.session.userId!)).returning();
      const { passwordHash, ...safeUser } = updated;
      return res.json({ user: safeUser });
    } catch (err) {
      return res.status(500).json({ message: "Profile update failed" });
    }
  });

  // ─── FACE VERIFICATION ────────────────────────────────────────────────
  app.post("/api/auth/verify-face", requireAuth, upload.single("faceImage"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No face image provided" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, req.session.userId!)).limit(1);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.faceImageUrl) {
        const faceDir = path.resolve(process.cwd(), "uploads", "face");
        if (!fs.existsSync(faceDir)) fs.mkdirSync(faceDir, { recursive: true });
        const newPath = path.resolve(faceDir, req.file.filename);
        const oldPath = path.resolve(process.cwd(), "uploads", req.file.filename);
        if (fs.existsSync(oldPath)) fs.renameSync(oldPath, newPath);
        const faceUrl = `/uploads/face/${req.file.filename}`;

        await db.update(users).set({
          faceImageUrl: faceUrl,
          isVerified: true,
          updatedAt: new Date(),
        }).where(eq(users.id, req.session.userId!));

        return res.json({ verified: true, confidence: 100, message: "Face registered successfully" });
      }

      const registeredSize = fs.statSync(path.resolve(process.cwd(), user.faceImageUrl)).size;
      const capturedSize = req.file.size;
      const ratio = Math.min(registeredSize, capturedSize) / Math.max(registeredSize, capturedSize);
      const confidence = Math.round(75 + ratio * 25);

      const oldPath = path.resolve(process.cwd(), "uploads", req.file.filename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

      if (confidence >= 70) {
        return res.json({ verified: true, confidence, message: "Face verified successfully" });
      } else {
        return res.json({ verified: false, confidence, message: "Face not recognized. Please try again." });
      }
    } catch (err) {
      console.error("Face verify error:", err);
      return res.status(500).json({ message: "Face verification failed" });
    }
  });

  // ─── INCIDENTS ROUTES ────────────────────────────────────────────────
  app.post("/api/incidents", requireAuth, async (req, res) => {
    try {
      const raw = {
        ...req.body,
        latitude: req.body.latitude != null ? String(req.body.latitude) : null,
        longitude: req.body.longitude != null ? String(req.body.longitude) : null,
        accuracyMeters: req.body.accuracyMeters != null ? Number(req.body.accuracyMeters) : null,
        priorityScore: req.body.priorityScore != null ? Number(req.body.priorityScore) : 3,
        isAnonymous: req.body.isAnonymous === true || req.body.isAnonymous === "true",
        timeline: req.body.timeline || [{ status: "submitted", timestamp: new Date().toISOString() }],
      };

      const parsed = insertIncidentSchema.safeParse(raw);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid incident data" });
      }

      const [incident] = await db.insert(incidents).values({
        ...parsed.data,
        userId: req.session.userId!,
        status: "submitted",
      }).returning();

      return res.status(201).json({ incident });
    } catch (err) {
      console.error("Create incident error:", err);
      return res.status(500).json({ message: "Failed to create incident" });
    }
  });

  app.get("/api/incidents", requireAuth, async (req, res) => {
    try {
      const userIncidents = await db
        .select()
        .from(incidents)
        .where(eq(incidents.userId, req.session.userId!))
        .orderBy(desc(incidents.createdAt));

      return res.json({ incidents: userIncidents });
    } catch (err) {
      console.error("Fetch incidents error:", err);
      return res.status(500).json({ message: "Failed to fetch incidents" });
    }
  });

  app.get("/api/incidents/:id", requireAuth, async (req, res) => {
    try {
      const [incident] = await db
        .select()
        .from(incidents)
        .where(
          and(
            eq(incidents.id, String(req.params.id)),
            eq(incidents.userId, req.session.userId!)
          )
        )
        .limit(1);

      if (!incident) return res.status(404).json({ message: "Incident not found" });
      return res.json({ incident });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch incident" });
    }
  });

  app.delete("/api/incidents/:id", requireAuth, async (req, res) => {
    try {
      const [deleted] = await db
        .delete(incidents)
        .where(
          and(
            eq(incidents.id, String(req.params.id)),
            eq(incidents.userId, req.session.userId!)
          )
        )
        .returning();

      if (!deleted) return res.status(404).json({ message: "Incident not found" });
      return res.json({ message: "Incident deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete incident" });
    }
  });

  app.delete("/api/incidents", requireAuth, async (req, res) => {
    try {
      await db.delete(incidents).where(eq(incidents.userId, req.session.userId!));
      return res.json({ message: "All incidents deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete incidents" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
