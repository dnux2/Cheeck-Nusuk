import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Pilgrims
  app.get(api.pilgrims.list.path, async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const pilgrims = await storage.getPilgrims({ limit, offset });
    res.json(pilgrims);
  });

  app.get(api.pilgrims.get.path, async (req, res) => {
    const pilgrim = await storage.getPilgrim(Number(req.params.id));
    if (!pilgrim) {
      return res.status(404).json({ message: "Pilgrim not found" });
    }
    res.json(pilgrim);
  });

  app.post(api.pilgrims.create.path, async (req, res) => {
    try {
      const input = api.pilgrims.create.input.parse(req.body);
      const pilgrim = await storage.createPilgrim(input);
      res.status(201).json(pilgrim);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.patch(api.pilgrims.updateLocation.path, async (req, res) => {
    try {
      const input = api.pilgrims.updateLocation.input.parse(req.body);
      const pilgrim = await storage.updatePilgrimLocation(
        Number(req.params.id),
        input.locationLat,
        input.locationLng
      );
      res.json(pilgrim);
    } catch (err) {
      return res.status(400).json({ message: "Invalid input" });
    }
  });

  app.patch("/api/pilgrims/:id/health", async (req, res) => {
    try {
      const healthSchema = z.object({
        bloodType: z.string().optional(),
        allergies: z.string().optional(),
        medicalConditions: z.string().optional(),
        emergencyContact: z.string().optional(),
        healthStatus: z.enum(["Good", "Stable", "NeedsAttention"]).optional(),
      });
      const input = healthSchema.parse(req.body);
      const pilgrim = await storage.updatePilgrimHealth(Number(req.params.id), input);
      res.json(pilgrim);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(404).json({ message: "Pilgrim not found" });
    }
  });

  // Hajj Notes
  app.get("/api/pilgrims/:id/hajj-notes", async (req, res) => {
    const notes = await storage.getHajjNotes(Number(req.params.id));
    res.json(notes);
  });

  app.patch("/api/pilgrims/:id/hajj-notes/:stageKey", async (req, res) => {
    try {
      const schema = z.object({ note: z.string() });
      const { note } = schema.parse(req.body);
      const result = await storage.upsertHajjNote(Number(req.params.id), req.params.stageKey, note);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to save note" });
    }
  });

  // Emergencies
  app.get(api.emergencies.list.path, async (req, res) => {
    const emergencies = await storage.getEmergencies();
    res.json(emergencies);
  });

  app.post(api.emergencies.create.path, async (req, res) => {
    try {
      const input = api.emergencies.create.input.parse(req.body);
      const emergency = await storage.createEmergency(input);
      res.status(201).json(emergency);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.patch(api.emergencies.resolve.path, async (req, res) => {
    try {
      const resolved = await storage.resolveEmergency(Number(req.params.id));
      res.json(resolved);
    } catch (err) {
      res.status(404).json({ message: "Emergency not found" });
    }
  });

  // Alerts
  app.get(api.alerts.list.path, async (req, res) => {
    const alerts = await storage.getAlerts();
    res.json(alerts);
  });

  app.post(api.alerts.create.path, async (req, res) => {
    try {
      const input = api.alerts.create.input.parse(req.body);
      const alert = await storage.createAlert(input);
      res.status(201).json(alert);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // AI Translator
  app.post(api.ai.translate.path, async (req, res) => {
    try {
      const { text, targetLanguage } = api.ai.translate.input.parse(req.body);

      if (!text.trim()) {
        return res.status(400).json({ message: "Text cannot be empty" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `You are a helpful translator for the Hajj & Umrah pilgrimage platform. Translate the following text into ${targetLanguage}. Return ONLY the translated text, without any additional explanations.` },
          { role: "user", content: text }
        ],
      });

      const translatedText = response.choices[0]?.message?.content || "Translation failed";
      res.json({ translatedText });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Internal server error during translation" });
    }
  });

  // Chat Messages
  app.get("/api/chat/messages", async (req, res) => {
    const pilgrimId = req.query.pilgrimId ? Number(req.query.pilgrimId) : undefined;
    const messages = await storage.getChatMessages(pilgrimId);
    res.json(messages);
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const input = insertChatMessageSchema.parse(req.body);
      const msg = await storage.createChatMessage(input);
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Seed data function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingPilgrims = await storage.getPilgrims({ limit: 100 });
  if (existingPilgrims.length < 50) {
    const seedPilgrims = [
      // Egyptian
      { name: "Ahmed Ali", nationality: "Egyptian", passportNumber: "A12345678", phone: "+201001234567", campaignGroup: "Al-Tawheed Group", permitStatus: "Valid", locationLat: 21.4225, locationLng: 39.8262, emergencyStatus: false },
      { name: "Mohammed Khaled", nationality: "Egyptian", passportNumber: "A23456789", phone: "+201002345678", campaignGroup: "Al-Nour Group", permitStatus: "Valid", locationLat: 21.4231, locationLng: 39.8248, emergencyStatus: false },
      { name: "Omar Hassan", nationality: "Egyptian", passportNumber: "A34567890", phone: "+201003456789", campaignGroup: "Al-Tawheed Group", permitStatus: "Expired", locationLat: 21.4218, locationLng: 39.8275, emergencyStatus: false },
      { name: "Layla Mostafa", nationality: "Egyptian", passportNumber: "A45678901", phone: "+201004567890", campaignGroup: "Cairo Hajj Office", permitStatus: "Valid", locationLat: 21.4240, locationLng: 39.8255, emergencyStatus: false },
      { name: "Ibrahim Youssef", nationality: "Egyptian", passportNumber: "A56789012", phone: "+201005678901", campaignGroup: "Al-Nour Group", permitStatus: "Pending", locationLat: 21.4215, locationLng: 39.8290, emergencyStatus: false },
      // Indonesian
      { name: "Muhammad Rahman", nationality: "Indonesian", passportNumber: "B98765432", phone: "+6281234567890", campaignGroup: "Hajj Travel Indo", permitStatus: "Valid", locationLat: 21.4230, locationLng: 39.8250, emergencyStatus: true },
      { name: "Siti Rahma", nationality: "Indonesian", passportNumber: "B12345678", phone: "+6281345678901", campaignGroup: "Hajj Travel Indo", permitStatus: "Valid", locationLat: 21.4145, locationLng: 39.8895, emergencyStatus: false },
      { name: "Ahmad Fauzi", nationality: "Indonesian", passportNumber: "B23456789", phone: "+6281456789012", campaignGroup: "Kemenag Group", permitStatus: "Valid", locationLat: 21.4120, locationLng: 39.8910, emergencyStatus: false },
      { name: "Dewi Putri", nationality: "Indonesian", passportNumber: "B34567890", phone: "+6281567890123", campaignGroup: "Kemenag Group", permitStatus: "Expired", locationLat: 21.4135, locationLng: 39.8920, emergencyStatus: false },
      { name: "Rizky Pratama", nationality: "Indonesian", passportNumber: "B45678901", phone: "+6281678901234", campaignGroup: "Hajj Travel Indo", permitStatus: "Valid", locationLat: 21.4125, locationLng: 39.8880, emergencyStatus: false },
      // Pakistani
      { name: "Fatima Noor", nationality: "Pakistani", passportNumber: "C45678912", phone: "+923001234567", campaignGroup: "Pak-Hajj Campaign", permitStatus: "Pending", locationLat: 21.4210, locationLng: 39.8270, emergencyStatus: false },
      { name: "Ali Khan", nationality: "Pakistani", passportNumber: "C12345678", phone: "+923012345678", campaignGroup: "Pak-Hajj Campaign", permitStatus: "Valid", locationLat: 21.4200, locationLng: 39.8260, emergencyStatus: false },
      { name: "Usman Qureshi", nationality: "Pakistani", passportNumber: "C23456789", phone: "+923023456789", campaignGroup: "Lahore Hajj Group", permitStatus: "Valid", locationLat: 21.4220, locationLng: 39.8280, emergencyStatus: false },
      { name: "Aisha Siddiqui", nationality: "Pakistani", passportNumber: "C34567890", phone: "+923034567890", campaignGroup: "Lahore Hajj Group", permitStatus: "Expired", locationLat: 21.4205, locationLng: 39.8295, emergencyStatus: false },
      { name: "Tariq Mahmood", nationality: "Pakistani", passportNumber: "C56789012", phone: "+923056789012", campaignGroup: "Karachi Hajj", permitStatus: "Valid", locationLat: 21.4215, locationLng: 39.8240, emergencyStatus: true },
      // Saudi
      { name: "Abdullah Al-Rashid", nationality: "Saudi", passportNumber: "S12345678", phone: "+966501234567", campaignGroup: "Ministry of Hajj", permitStatus: "Valid", locationLat: 21.4228, locationLng: 39.8265, emergencyStatus: false },
      { name: "Khalid Al-Otaibi", nationality: "Saudi", passportNumber: "S23456789", phone: "+966502345678", campaignGroup: "Ministry of Hajj", permitStatus: "Valid", locationLat: 21.4232, locationLng: 39.8258, emergencyStatus: false },
      { name: "Nora Al-Ghamdi", nationality: "Saudi", passportNumber: "S34567890", phone: "+966503456789", campaignGroup: "Makkah Local", permitStatus: "Valid", locationLat: 21.4222, locationLng: 39.8270, emergencyStatus: false },
      { name: "Mohammed Al-Zahrani", nationality: "Saudi", passportNumber: "S45678901", phone: "+966504567890", campaignGroup: "Makkah Local", permitStatus: "Valid", locationLat: 21.4235, locationLng: 39.8245, emergencyStatus: false },
      { name: "Sara Al-Harthi", nationality: "Saudi", passportNumber: "S56789012", phone: "+966505678901", campaignGroup: "Ministry of Hajj", permitStatus: "Valid", locationLat: 21.4218, locationLng: 39.8252, emergencyStatus: false },
      // Turkish
      { name: "Mehmet Yilmaz", nationality: "Turkish", passportNumber: "T12345678", phone: "+905301234567", campaignGroup: "Diyanet Tours", permitStatus: "Valid", locationLat: 21.3840, locationLng: 39.9280, emergencyStatus: false },
      { name: "Fatima Ozdemir", nationality: "Turkish", passportNumber: "T23456789", phone: "+905302345678", campaignGroup: "Diyanet Tours", permitStatus: "Valid", locationLat: 21.3825, locationLng: 39.9295, emergencyStatus: false },
      { name: "Ali Kaya", nationality: "Turkish", passportNumber: "T34567890", phone: "+905303456789", campaignGroup: "Istanbul Hajj Group", permitStatus: "Expired", locationLat: 21.3850, locationLng: 39.9270, emergencyStatus: false },
      { name: "Ayse Demir", nationality: "Turkish", passportNumber: "T45678901", phone: "+905304567890", campaignGroup: "Istanbul Hajj Group", permitStatus: "Valid", locationLat: 21.3830, locationLng: 39.9300, emergencyStatus: false },
      { name: "Mustafa Celik", nationality: "Turkish", passportNumber: "T56789012", phone: "+905305678901", campaignGroup: "Diyanet Tours", permitStatus: "Pending", locationLat: 21.3845, locationLng: 39.9285, emergencyStatus: false },
      // Malaysian
      { name: "Ahmad Ibrahim", nationality: "Malaysian", passportNumber: "M12345678", phone: "+60121234567", campaignGroup: "Tabung Haji", permitStatus: "Valid", locationLat: 21.3550, locationLng: 39.9840, emergencyStatus: false },
      { name: "Nurul Huda", nationality: "Malaysian", passportNumber: "M23456789", phone: "+60122345678", campaignGroup: "Tabung Haji", permitStatus: "Valid", locationLat: 21.3560, locationLng: 39.9855, emergencyStatus: false },
      { name: "Mohd Syafiq", nationality: "Malaysian", passportNumber: "M34567890", phone: "+60123456789", campaignGroup: "KL Hajj Group", permitStatus: "Valid", locationLat: 21.3538, locationLng: 39.9825, emergencyStatus: false },
      { name: "Ain Izzati", nationality: "Malaysian", passportNumber: "M45678901", phone: "+60124567890", campaignGroup: "KL Hajj Group", permitStatus: "Expired", locationLat: 21.3555, locationLng: 39.9865, emergencyStatus: false },
      { name: "Haziq Mohd", nationality: "Malaysian", passportNumber: "M56789012", phone: "+60125678901", campaignGroup: "Tabung Haji", permitStatus: "Valid", locationLat: 21.3545, locationLng: 39.9848, emergencyStatus: false },
      // Nigerian
      { name: "Abubakar Musa", nationality: "Nigerian", passportNumber: "N12345678", phone: "+2348031234567", campaignGroup: "NAHCON Group", permitStatus: "Valid", locationLat: 21.4230, locationLng: 39.8740, emergencyStatus: false },
      { name: "Fatimah Bello", nationality: "Nigerian", passportNumber: "N23456789", phone: "+2348032345678", campaignGroup: "NAHCON Group", permitStatus: "Valid", locationLat: 21.4220, locationLng: 39.8725, emergencyStatus: false },
      { name: "Ibrahim Garba", nationality: "Nigerian", passportNumber: "N34567890", phone: "+2348033456789", campaignGroup: "Abuja Hajj Board", permitStatus: "Pending", locationLat: 21.4235, locationLng: 39.8750, emergencyStatus: false },
      { name: "Hauwa Umar", nationality: "Nigerian", passportNumber: "N45678901", phone: "+2348034567890", campaignGroup: "Abuja Hajj Board", permitStatus: "Valid", locationLat: 21.4225, locationLng: 39.8730, emergencyStatus: false },
      { name: "Suleiman Yusuf", nationality: "Nigerian", passportNumber: "N56789012", phone: "+2348035678901", campaignGroup: "NAHCON Group", permitStatus: "Expired", locationLat: 21.4215, locationLng: 39.8745, emergencyStatus: false },
      // Bangladeshi
      { name: "Rahman Dhali", nationality: "Bangladeshi", passportNumber: "BD12345678", phone: "+8801711234567", campaignGroup: "Bangladesh Hajj Mission", permitStatus: "Valid", locationLat: 21.4228, locationLng: 39.8268, emergencyStatus: false },
      { name: "Nasreen Akhter", nationality: "Bangladeshi", passportNumber: "BD23456789", phone: "+8801712345678", campaignGroup: "Bangladesh Hajj Mission", permitStatus: "Valid", locationLat: 21.4238, locationLng: 39.8278, emergencyStatus: false },
      { name: "Karim Hossain", nationality: "Bangladeshi", passportNumber: "BD34567890", phone: "+8801713456789", campaignGroup: "Dhaka Hajj Group", permitStatus: "Expired", locationLat: 21.4212, locationLng: 39.8258, emergencyStatus: false },
      { name: "Sharmin Begum", nationality: "Bangladeshi", passportNumber: "BD45678901", phone: "+8801714567890", campaignGroup: "Dhaka Hajj Group", permitStatus: "Valid", locationLat: 21.4222, locationLng: 39.8282, emergencyStatus: false },
      { name: "Jahangir Alam", nationality: "Bangladeshi", passportNumber: "BD56789012", phone: "+8801715678901", campaignGroup: "Bangladesh Hajj Mission", permitStatus: "Pending", locationLat: 21.4245, locationLng: 39.8255, emergencyStatus: false },
      // Moroccan
      { name: "Youssef Benali", nationality: "Moroccan", passportNumber: "MR12345678", phone: "+212661234567", campaignGroup: "Moroccan Hajj Office", permitStatus: "Valid", locationLat: 21.4140, locationLng: 39.8900, emergencyStatus: false },
      { name: "Fatima Ezzahra", nationality: "Moroccan", passportNumber: "MR23456789", phone: "+212662345678", campaignGroup: "Moroccan Hajj Office", permitStatus: "Valid", locationLat: 21.4130, locationLng: 39.8915, emergencyStatus: false },
      { name: "Mohammed Alaoui", nationality: "Moroccan", passportNumber: "MR34567890", phone: "+212663456789", campaignGroup: "Casablanca Hajj", permitStatus: "Expired", locationLat: 21.4150, locationLng: 39.8895, emergencyStatus: false },
      { name: "Khadija Berrada", nationality: "Moroccan", passportNumber: "MR45678901", phone: "+212664567890", campaignGroup: "Casablanca Hajj", permitStatus: "Valid", locationLat: 21.4120, locationLng: 39.8905, emergencyStatus: false },
      { name: "Hassan Rachidi", nationality: "Moroccan", passportNumber: "MR56789012", phone: "+212665678901", campaignGroup: "Moroccan Hajj Office", permitStatus: "Pending", locationLat: 21.4145, locationLng: 39.8910, emergencyStatus: false },
      // Indian
      { name: "Abdul Sattar", nationality: "Indian", passportNumber: "IN12345678", phone: "+919871234567", campaignGroup: "India Hajj Committee", permitStatus: "Valid", locationLat: 21.3835, locationLng: 39.9290, emergencyStatus: false },
      { name: "Farzana Khatoon", nationality: "Indian", passportNumber: "IN23456789", phone: "+919872345678", campaignGroup: "India Hajj Committee", permitStatus: "Valid", locationLat: 21.3848, locationLng: 39.9278, emergencyStatus: false },
      { name: "Mohammed Irfan", nationality: "Indian", passportNumber: "IN34567890", phone: "+919873456789", campaignGroup: "Mumbai Hajj Group", permitStatus: "Expired", locationLat: 21.3820, locationLng: 39.9305, emergencyStatus: false },
      { name: "Ruqayyah Siddiqui", nationality: "Indian", passportNumber: "IN45678901", phone: "+919874567890", campaignGroup: "Mumbai Hajj Group", permitStatus: "Valid", locationLat: 21.3858, locationLng: 39.9270, emergencyStatus: false },
      { name: "Habib Khan", nationality: "Indian", passportNumber: "IN56789012", phone: "+919875678901", campaignGroup: "India Hajj Committee", permitStatus: "Valid", locationLat: 21.3840, locationLng: 39.9295, emergencyStatus: false },
    ];

    for (const p of seedPilgrims) {
      try {
        await storage.createPilgrim(p);
      } catch {
        // skip duplicate passport numbers
      }
    }
  }

  const existingAlerts = await storage.getAlerts();
  if (existingAlerts.length === 0) {
    await storage.createAlert({
      type: "Crowd Density",
      message: "High crowd density detected near King Abdulaziz Gate. Recommend diverting to King Fahd Gate.",
      locationLat: 21.4225,
      locationLng: 39.8262,
      status: "Active",
    });

    await storage.createAlert({
      type: "Unauthorized",
      message: "Face detection triggered: Potential unauthorized pilgrim detected in sector 4.",
      locationLat: 21.4210,
      locationLng: 39.8270,
      status: "Active",
    });
  }

  const existingEmergencies = await storage.getEmergencies();
  if (existingEmergencies.length === 0) {
    await storage.createEmergency({
      pilgrimId: 2,
      type: "Medical",
      status: "Active",
      locationLat: 21.4230,
      locationLng: 39.8250,
    });
  }
}
