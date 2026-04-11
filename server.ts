import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Turso Client (Lazy Initialization)
let dbClient: any = null;
const getDb = () => {
  if (!dbClient) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      console.warn("TURSO_DATABASE_URL is not set. Database features will be disabled.");
      return null;
    }
    dbClient = createClient({
      url: url,
      authToken: process.env.TURSO_AUTH_TOKEN || "",
    });
  }
  return dbClient;
};

// Initialize Database Schema
async function initDb() {
  const db = getDb();
  if (!db) return;

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS business_configs (
        user_id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        negotiation_mode INTEGER,
        brand_color TEXT,
        widget_position TEXT,
        payment_method TEXT,
        bank_name TEXT,
        account_number TEXT,
        flutterwave_public_key TEXT,
        flutterwave_secret_key TEXT,
        paystack_public_key TEXT,
        paystack_secret_key TEXT,
        google_client_id TEXT,
        composer_ip TEXT,
        composer_api_key TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        price REAL,
        last_price REAL,
        description TEXT,
        type TEXT,
        link TEXT,
        FOREIGN KEY(user_id) REFERENCES business_configs(user_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        email TEXT,
        phone TEXT,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES business_configs(user_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ads (
        id TEXT PRIMARY KEY,
        title TEXT,
        image_url TEXT,
        link TEXT,
        active INTEGER DEFAULT 1
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        amount REAL,
        method TEXT,
        status TEXT,
        reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES business_configs(user_id)
      )
    `);

    console.log("Database schema initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize database schema:", error);
  }
}

app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Example: Get business config
app.get("/api/config/search", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    
    const { query } = req.query;
    const result = await db.execute({
      sql: "SELECT * FROM business_configs WHERE user_id = ? OR name LIKE ?",
      args: [query, `%${query}%`],
    });
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to search config" });
  }
});

app.get("/api/config/:userId", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    
    const { userId } = req.params;
    const result = await db.execute({
      sql: "SELECT * FROM business_configs WHERE user_id = ?",
      args: [userId],
    });
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch config" });
  }
});

// Example: Save business config
app.post("/api/config", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });

    const { 
      userId, name, description, negotiationMode, 
      brandColor, widgetPosition, paymentMethod, 
      bankName, accountNumber, flutterwavePublicKey,
      flutterwaveSecretKey, paystackPublicKey,
      paystackSecretKey, googleClientId, 
      composerIp, composerApiKey 
    } = req.body;

    await db.execute({
      sql: `INSERT OR REPLACE INTO business_configs (
              user_id, name, description, negotiation_mode, 
              brand_color, widget_position, payment_method, 
              bank_name, account_number, flutterwave_public_key,
              flutterwave_secret_key, paystack_public_key,
              paystack_secret_key, google_client_id, 
              composer_ip, composer_api_key
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        userId, name, description, negotiationMode ? 1 : 0, 
        brandColor, widgetPosition, paymentMethod, 
        bankName, accountNumber, flutterwavePublicKey,
        flutterwaveSecretKey, paystackPublicKey,
        paystackSecretKey, googleClientId, 
        composerIp, composerApiKey
      ],
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Save config error:", error);
    res.status(500).json({ error: "Failed to save config" });
  }
});

// Ads API
app.get("/api/ads", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const result = await db.execute("SELECT * FROM ads WHERE active = 1");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});

app.post("/api/ads", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const { id, title, imageUrl, link, active } = req.body;
    await db.execute({
      sql: "INSERT OR REPLACE INTO ads (id, title, image_url, link, active) VALUES (?, ?, ?, ?, ?)",
      args: [id || Math.random().toString(36).substr(2, 9), title, imageUrl, link, active ? 1 : 0],
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save ad" });
  }
});

// Leads API
app.get("/api/leads/:userId", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const { userId } = req.params;
    const result = await db.execute({
      sql: "SELECT * FROM leads WHERE user_id = ? ORDER BY created_at DESC",
      args: [userId],
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

app.post("/api/leads", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const { userId, name, email, phone } = req.body;
    await db.execute({
      sql: "INSERT INTO leads (id, user_id, name, email, phone, status) VALUES (?, ?, ?, ?, ?, ?)",
      args: [Math.random().toString(36).substr(2, 9), userId, name, email, phone, 'new'],
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save lead" });
  }
});

// Products API
app.get("/api/products/:userId", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const { userId } = req.params;
    const result = await db.execute({
      sql: "SELECT * FROM products WHERE user_id = ?",
      args: [userId],
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const { id, userId, name, price, lastPrice, description, type, link } = req.body;
    await db.execute({
      sql: "INSERT OR REPLACE INTO products (id, user_id, name, price, last_price, description, type, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [id || Math.random().toString(36).substr(2, 9), userId, name, price, lastPrice, description, type, link],
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const { id } = req.params;
    await db.execute({
      sql: "DELETE FROM products WHERE id = ?",
      args: [id],
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Flutterwave Webhook Handler
app.post("/api/webhooks/flutterwave", async (req, res) => {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const signature = req.headers["verif-hash"];

  if (!signature || signature !== secretHash) {
    return res.status(401).end();
  }

  const payload = req.body;
  console.log("Flutterwave Webhook Received:", payload);

  // Logic to:
  // 1. Verify payment status
  // 2. Identify the business (customer)
  // 3. Send digital product email (via Resend/SendGrid)
  // 4. Log to Google Sheets (via Automation Webhook)

  res.status(200).end();
});

// Paystack Webhook Handler
app.post("/api/webhooks/paystack", async (req, res) => {
  // Paystack verification logic
  console.log("Paystack Webhook Received:", req.body);
  res.status(200).end();
});

// Transactions API
app.get("/api/transactions/:userId", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const { userId } = req.params;
    const result = await db.execute({
      sql: "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC",
      args: [userId],
    });
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const { userId, amount, method, status, reference } = req.body;
    await db.execute({
      sql: "INSERT INTO transactions (id, user_id, amount, method, status, reference) VALUES (?, ?, ?, ?, ?, ?)",
      args: [Math.random().toString(36).substr(2, 9), userId, amount, method, status || 'success', reference || `TRX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`],
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save transaction" });
  }
});

// Stats API
app.get("/api/stats/:userId", async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: "Database not configured" });
    const { userId } = req.params;
    
    const salesResult = await db.execute({
      sql: "SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND status = 'success'",
      args: [userId],
    });
    
    const leadsResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM leads WHERE user_id = ?",
      args: [userId],
    });

    res.json({
      totalSales: salesResult.rows[0]?.total || 0,
      leadsCount: leadsResult.rows[0]?.count || 0,
      conversionRate: leadsResult.rows[0]?.count > 0 ? ((salesResult.rows.length / leadsResult.rows[0]?.count) * 100).toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Vite middleware setup
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
