import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const NATIONAL_ID_TYPES = [
  'ghana_card',
  'nhis',
  'driving_license',
  'voter_id',
  'passport',
] as const;

export type NationalIdType = typeof NATIONAL_ID_TYPES[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").unique(),
  phone: text("phone").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  nationalIdType: text("national_id_type").notNull(),
  nationalIdNumber: text("national_id_number").notNull(),
  nationalIdImageUrl: text("national_id_image_url"),
  faceImageUrl: text("face_image_url"),
  isVerified: boolean("is_verified").default(false),
  language: text("language").default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  accuracyMeters: integer("accuracy_meters"),
  gpsProvider: text("gps_provider"),
  address: text("address"),
  status: text("status").default("submitted"),
  priorityScore: integer("priority_score").default(3),
  isAnonymous: boolean("is_anonymous").default(true),
  panicMode: text("panic_mode"),
  mediaUrls: text("media_urls").array(),
  timeline: jsonb("timeline").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  nationalIdType: z.enum(NATIONAL_ID_TYPES, { errorMap: () => ({ message: "Invalid ID type" }) }),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  fullName: z.string().min(2, "Full name required"),
});

export const loginSchema = z.object({
  phone: z.string().min(10),
  password: z.string().min(1),
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
