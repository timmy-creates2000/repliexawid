import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { initDb } from "./api/lib/db";

// Route handlers
import configHandler from "./api/config";
import productsHandler from "./api/products";
import leadsHandler from "./api/leads";
import transactionsHandler from "./api/transactions";
import statsHandler from "./api/stats";
import bookingsHandler from "./api/bookings";
import slotsHandler from "./api/slots";
import sessionTypesHandler from "./api/session-types";
import availabilityHandler from "./api/availability";
import qualificationQuestionsHandler from "./api/qualification-questions";
import automationsHandler from "./api/automations";
import plansHandler from "./api/plans";
import announcementsHandler from "./api/announcements";
import subscribeHandler from "./api/subscribe";
import subscriptionHandler from "./api/subscription";
import chatHandler from "./api/chat";
import googleAuthHandler from "./api/google-auth";
import adminUsersHandler from "./api/admin/users";
import adminPlansHandler from "./api/admin/plans";
import adminRevenueHandler from "./api/admin/revenue";
import adminAnnouncementsHandler from "./api/admin/announcements";
import flutterwaveWebhookHandler from "./api/webhooks/flutterwave";
import paystackWebhookHandler from "./api/webhooks/paystack";
import stripeWebhookHandler from "./api/webhooks/stripe";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ─── API Routes ───────────────────────────────────────────────────────────────

app.all("/api/config", (req, res) => configHandler(req as any, res as any));
app.all("/api/products", (req, res) => productsHandler(req as any, res as any));
app.all("/api/leads", (req, res) => leadsHandler(req as any, res as any));
app.all("/api/transactions", (req, res) => transactionsHandler(req as any, res as any));
app.all("/api/stats", (req, res) => statsHandler(req as any, res as any));
app.all("/api/bookings/slots/:userId", (req, res) => {
  // Merge route params into query for the handler
  (req as any).query = { ...req.query, userId: req.params.userId };
  slotsHandler(req as any, res as any);
});
app.all("/api/bookings", (req, res) => bookingsHandler(req as any, res as any));
app.all("/api/session-types", (req, res) => sessionTypesHandler(req as any, res as any));
app.all("/api/availability", (req, res) => availabilityHandler(req as any, res as any));
app.all("/api/qualification-questions", (req, res) => qualificationQuestionsHandler(req as any, res as any));
app.all("/api/automations", (req, res) => automationsHandler(req as any, res as any));
app.all("/api/plans", (req, res) => plansHandler(req as any, res as any));
app.all("/api/announcements", (req, res) => announcementsHandler(req as any, res as any));
app.all("/api/subscribe", (req, res) => subscribeHandler(req as any, res as any));
app.all("/api/subscription", (req, res) => subscriptionHandler(req as any, res as any));
app.all("/api/chat", (req, res) => chatHandler(req as any, res as any));
app.all("/api/google-auth", (req, res) => googleAuthHandler(req as any, res as any));

// Admin routes
app.all("/api/admin/users", (req, res) => adminUsersHandler(req as any, res as any));
app.all("/api/admin/plans", (req, res) => adminPlansHandler(req as any, res as any));
app.all("/api/admin/revenue", (req, res) => adminRevenueHandler(req as any, res as any));
app.all("/api/admin/announcements", (req, res) => adminAnnouncementsHandler(req as any, res as any));

// Webhook routes
app.all("/api/webhooks/flutterwave", (req, res) => flutterwaveWebhookHandler(req as any, res as any));
app.all("/api/webhooks/paystack", (req, res) => paystackWebhookHandler(req as any, res as any));
app.all("/api/webhooks/stripe", (req, res) => stripeWebhookHandler(req as any, res as any));

// ─── Start Server ─────────────────────────────────────────────────────────────

async function startServer() {
  await initDb();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
