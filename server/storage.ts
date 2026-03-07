import { db } from "./db";
import {
  pilgrims,
  emergencies,
  alerts,
  chatMessages,
  type Pilgrim,
  type InsertPilgrim,
  type Emergency,
  type InsertEmergency,
  type Alert,
  type InsertAlert,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { eq, or, isNull } from "drizzle-orm";

export interface IStorage {
  // Pilgrims
  getPilgrims(opts?: { limit?: number; offset?: number }): Promise<Pilgrim[]>;
  getPilgrim(id: number): Promise<Pilgrim | undefined>;
  createPilgrim(pilgrim: InsertPilgrim): Promise<Pilgrim>;
  updatePilgrimLocation(id: number, lat: number, lng: number): Promise<Pilgrim>;

  // Emergencies
  getEmergencies(): Promise<Emergency[]>;
  createEmergency(emergency: InsertEmergency): Promise<Emergency>;
  resolveEmergency(id: number): Promise<Emergency>;

  // Alerts
  getAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;

  // Chat
  getChatMessages(pilgrimId?: number): Promise<ChatMessage[]>;
  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // Pilgrims
  async getPilgrims(opts?: { limit?: number; offset?: number }): Promise<Pilgrim[]> {
    const limit = opts?.limit ?? 100;
    const offset = opts?.offset ?? 0;
    return await db.select().from(pilgrims).limit(limit).offset(offset);
  }

  async getPilgrim(id: number): Promise<Pilgrim | undefined> {
    const [pilgrim] = await db.select().from(pilgrims).where(eq(pilgrims.id, id));
    return pilgrim;
  }

  async createPilgrim(pilgrim: InsertPilgrim): Promise<Pilgrim> {
    const [newPilgrim] = await db.insert(pilgrims).values(pilgrim).returning();
    return newPilgrim;
  }

  async updatePilgrimLocation(id: number, lat: number, lng: number): Promise<Pilgrim> {
    const [updated] = await db.update(pilgrims)
      .set({ locationLat: lat, locationLng: lng, lastUpdated: new Date() })
      .where(eq(pilgrims.id, id))
      .returning();
    return updated;
  }

  // Emergencies
  async getEmergencies(): Promise<Emergency[]> {
    return await db.select().from(emergencies);
  }

  async createEmergency(emergency: InsertEmergency): Promise<Emergency> {
    const [newEmergency] = await db.insert(emergencies).values(emergency).returning();
    if (emergency.pilgrimId) {
      await db.update(pilgrims)
        .set({ emergencyStatus: true })
        .where(eq(pilgrims.id, emergency.pilgrimId));
    }
    return newEmergency;
  }

  async resolveEmergency(id: number): Promise<Emergency> {
    const [resolved] = await db.update(emergencies)
      .set({ status: "Resolved" })
      .where(eq(emergencies.id, id))
      .returning();

    if (!resolved) throw new Error(`Emergency with id ${id} not found`);

    if (resolved.pilgrimId) {
      const activeEmergencies = await db.select()
        .from(emergencies)
        .where(eq(emergencies.pilgrimId, resolved.pilgrimId));

      if (!activeEmergencies.some(e => e.status === "Active")) {
        await db.update(pilgrims)
          .set({ emergencyStatus: false })
          .where(eq(pilgrims.id, resolved.pilgrimId));
      }
    }
    return resolved;
  }

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts);
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  // Chat
  async getChatMessages(pilgrimId?: number): Promise<ChatMessage[]> {
    if (pilgrimId !== undefined) {
      // For a specific pilgrim: return messages addressed to them + broadcast messages (null pilgrimId)
      return await db.select().from(chatMessages).where(
        or(eq(chatMessages.pilgrimId, pilgrimId), isNull(chatMessages.pilgrimId))
      );
    }
    // Supervisor: return all messages
    return await db.select().from(chatMessages);
  }

  async createChatMessage(msg: InsertChatMessage): Promise<ChatMessage> {
    const [newMsg] = await db.insert(chatMessages).values(msg).returning();
    return newMsg;
  }
}

export const storage = new DatabaseStorage();
