import { pgTable, text, serial, timestamp, doublePrecision, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const pilgrims = pgTable("pilgrims", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nationality: text("nationality").notNull(),
  passportNumber: text("passport_number").notNull().unique(),
  phone: text("phone").notNull(),
  campaignGroup: text("campaign_group"),
  permitStatus: text("permit_status").notNull(), // 'Valid', 'Expired', 'Pending'
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  emergencyStatus: boolean("emergency_status").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
  // Health & wallet fields
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  medicalConditions: text("medical_conditions"),
  emergencyContact: text("emergency_contact"),
  healthStatus: text("health_status").default("Good"), // 'Good', 'Stable', 'NeedsAttention'
});

export const emergencies = pgTable("emergencies", {
  id: serial("id").primaryKey(),
  pilgrimId: integer("pilgrim_id").references(() => pilgrims.id),
  type: text("type").notNull(), // 'Medical', 'Lost', 'Security'
  status: text("status").notNull().default("Active"), // 'Active', 'Resolved'
  locationLat: doublePrecision("location_lat").notNull(),
  locationLng: doublePrecision("location_lng").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'Unauthorized', 'Crowd Density', 'Weather'
  message: text("message").notNull(),
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  status: text("status").notNull().default("Active"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  pilgrimId: integer("pilgrim_id"), // null = broadcast to all pilgrims
  senderRole: text("sender_role").notNull(), // 'supervisor' | 'pilgrim'
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const hajjNotes = pgTable("hajj_notes", {
  id: serial("id").primaryKey(),
  pilgrimId: integer("pilgrim_id").references(() => pilgrims.id),
  stageKey: text("stage_key").notNull(),
  note: text("note").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPilgrimSchema = createInsertSchema(pilgrims).omit({ id: true, lastUpdated: true });
export const insertEmergencySchema = createInsertSchema(emergencies).omit({ id: true, timestamp: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, timestamp: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, timestamp: true });

// Types
export type Pilgrim = typeof pilgrims.$inferSelect;
export type InsertPilgrim = z.infer<typeof insertPilgrimSchema>;

export type Emergency = typeof emergencies.$inferSelect;
export type InsertEmergency = z.infer<typeof insertEmergencySchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type HajjNote = typeof hajjNotes.$inferSelect;
