import { createClient, Client } from '@libsql/client';

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error('TURSO_DATABASE_URL is not set');
    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN || '',
    });
  }
  return client;
}

// ─── Migrations ───────────────────────────────────────────────────────────────

export async function initDb(): Promise<void> {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS business_configs (
      user_id                  TEXT PRIMARY KEY,
      name                     TEXT NOT NULL DEFAULT '',
      description              TEXT NOT NULL DEFAULT '',
      negotiation_mode         INTEGER NOT NULL DEFAULT 0,
      brand_color              TEXT NOT NULL DEFAULT '#ea580c',
      widget_position          TEXT NOT NULL DEFAULT 'bottom-right',
      widget_bg_style          TEXT NOT NULL DEFAULT 'dark',
      widget_border_radius     TEXT NOT NULL DEFAULT 'rounded',
      widget_avatar_url        TEXT,
      widget_welcome_message   TEXT,
      widget_auto_open_delay   INTEGER NOT NULL DEFAULT 0,
      show_powered_by          INTEGER NOT NULL DEFAULT 1,
      payment_method           TEXT NOT NULL DEFAULT 'manual',
      bank_name                TEXT,
      account_number           TEXT,
      paystack_public_key      TEXT,
      paystack_secret_key      TEXT,
      flutterwave_public_key   TEXT,
      flutterwave_secret_key   TEXT,
      stripe_public_key        TEXT,
      stripe_secret_key        TEXT,
      currency                 TEXT NOT NULL DEFAULT 'NGN',
      google_client_id         TEXT,
      google_access_token      TEXT,
      google_refresh_token     TEXT,
      resend_api_key           TEXT,
      ai_model                 TEXT NOT NULL DEFAULT 'gemini',
      plan                     TEXT NOT NULL DEFAULT 'starter',
      chat_count               INTEGER NOT NULL DEFAULT 0,
      created_at               DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL REFERENCES business_configs(user_id) ON DELETE CASCADE,
      name         TEXT NOT NULL,
      price        REAL NOT NULL,
      last_price   REAL NOT NULL DEFAULT 0,
      description  TEXT NOT NULL DEFAULT '',
      type         TEXT NOT NULL DEFAULT 'digital',
      link         TEXT,
      is_active    INTEGER NOT NULL DEFAULT 1,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS session_types (
      id               TEXT PRIMARY KEY,
      user_id          TEXT NOT NULL REFERENCES business_configs(user_id) ON DELETE CASCADE,
      name             TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      price            REAL NOT NULL DEFAULT 0,
      is_free          INTEGER NOT NULL DEFAULT 0,
      description      TEXT NOT NULL DEFAULT '',
      is_active        INTEGER NOT NULL DEFAULT 1,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS availability_rules (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL REFERENCES business_configs(user_id) ON DELETE CASCADE,
      day_of_week    INTEGER NOT NULL,
      start_time     TEXT NOT NULL,
      end_time       TEXT NOT NULL,
      buffer_minutes INTEGER NOT NULL DEFAULT 15,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id                 TEXT PRIMARY KEY,
      user_id            TEXT NOT NULL REFERENCES business_configs(user_id) ON DELETE CASCADE,
      visitor_name       TEXT NOT NULL,
      visitor_email      TEXT NOT NULL,
      session_type_id    TEXT NOT NULL REFERENCES session_types(id),
      start_time         DATETIME NOT NULL,
      end_time           DATETIME NOT NULL,
      status             TEXT NOT NULL DEFAULT 'pending',
      payment_reference  TEXT,
      google_event_id    TEXT,
      meet_link          TEXT,
      created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS leads (
      id                   TEXT PRIMARY KEY,
      user_id              TEXT NOT NULL REFERENCES business_configs(user_id) ON DELETE CASCADE,
      name                 TEXT,
      email                TEXT,
      phone                TEXT,
      status               TEXT NOT NULL DEFAULT 'new',
      qualification_data   TEXT DEFAULT '{}',
      created_at           DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS qualification_questions (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES business_configs(user_id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      field_key     TEXT NOT NULL,
      is_required   INTEGER NOT NULL DEFAULT 1,
      sort_order    INTEGER NOT NULL DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS automations (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL REFERENCES business_configs(user_id) ON DELETE CASCADE,
      trigger_event  TEXT NOT NULL,
      action_type    TEXT NOT NULL,
      is_enabled     INTEGER NOT NULL DEFAULT 0,
      config_json    TEXT NOT NULL DEFAULT '{}',
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES business_configs(user_id) ON DELETE CASCADE,
      amount      REAL NOT NULL,
      currency    TEXT NOT NULL DEFAULT 'NGN',
      method      TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      reference   TEXT NOT NULL,
      product_id  TEXT,
      booking_id  TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS plan_prices (
      plan_id        TEXT PRIMARY KEY,
      price_ngn      REAL NOT NULL DEFAULT 0,
      price_usd      REAL NOT NULL DEFAULT 0,
      max_products   INTEGER NOT NULL DEFAULT 3,
      max_leads      INTEGER NOT NULL DEFAULT 50,
      max_chats      INTEGER NOT NULL DEFAULT 100,
      features_json  TEXT NOT NULL DEFAULT '{}'
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id         TEXT PRIMARY KEY,
      message    TEXT NOT NULL,
      is_active  INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ads (
      id        TEXT PRIMARY KEY,
      title     TEXT,
      image_url TEXT,
      link      TEXT,
      active    INTEGER NOT NULL DEFAULT 1
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS subscription_intents (
      reference  TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      plan_id    TEXT NOT NULL,
      currency   TEXT NOT NULL DEFAULT 'NGN',
      amount     REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL UNIQUE,
      plan_id      TEXT NOT NULL,
      currency     TEXT NOT NULL DEFAULT 'NGN',
      amount       REAL NOT NULL,
      reference    TEXT NOT NULL,
      started_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at   DATETIME NOT NULL,
      is_active    INTEGER NOT NULL DEFAULT 1
    )
  `);

  // Seed plan_prices if empty
  const planCount = await db.execute('SELECT COUNT(*) as count FROM plan_prices');
  if ((planCount.rows[0] as any).count === 0) {
    const starterFeatures = JSON.stringify({ canEmbed: false, canCustomDomain: false, aiModels: ['gemini'], negotiationMode: false, analyticsRetentionDays: 7, prioritySupport: false });
    const proFeatures = JSON.stringify({ canEmbed: true, canCustomDomain: false, aiModels: ['gemini', 'openai', 'grok'], negotiationMode: true, analyticsRetentionDays: 30, prioritySupport: false });
    const businessFeatures = JSON.stringify({ canEmbed: true, canCustomDomain: true, aiModels: ['gemini', 'openai', 'grok'], negotiationMode: true, analyticsRetentionDays: 90, prioritySupport: true });

    await db.batch([
      { sql: 'INSERT INTO plan_prices VALUES (?, ?, ?, ?, ?, ?, ?)', args: ['starter', 0, 0, 3, 50, 100, starterFeatures] },
      { sql: 'INSERT INTO plan_prices VALUES (?, ?, ?, ?, ?, ?, ?)', args: ['pro', 2500, 5, 20, 500, 2000, proFeatures] },
      { sql: 'INSERT INTO plan_prices VALUES (?, ?, ?, ?, ?, ?, ?)', args: ['business', 7500, 15, -1, -1, -1, businessFeatures] },
    ]);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nanoid(): string {
  return Math.random().toString(36).slice(2, 11);
}

// ─── Config ───────────────────────────────────────────────────────────────────

export async function getConfig(userId: string): Promise<any | null> {
  const db = getDb();
  const r = await db.execute({ sql: 'SELECT * FROM business_configs WHERE user_id = ?', args: [userId] });
  return r.rows[0] ?? null;
}

export async function upsertConfig(userId: string, data: Record<string, any>): Promise<void> {
  const db = getDb();
  const fields = Object.keys(data);
  const setClauses = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => data[f]);
  await db.execute({
    sql: `INSERT INTO business_configs (user_id, ${fields.join(', ')}) VALUES (?, ${fields.map(() => '?').join(', ')})
          ON CONFLICT(user_id) DO UPDATE SET ${setClauses}`,
    args: [userId, ...values, ...values],
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(userId: string): Promise<any[]> {
  const db = getDb();
  const r = await db.execute({ sql: 'SELECT * FROM products WHERE user_id = ? AND is_active = 1', args: [userId] });
  return r.rows as any[];
}

export async function upsertProduct(product: Record<string, any>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO products (id, user_id, name, price, last_price, description, type, link)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET name=excluded.name, price=excluded.price,
          last_price=excluded.last_price, description=excluded.description, type=excluded.type, link=excluded.link`,
    args: [product.id || nanoid(), product.userId, product.name, product.price, product.lastPrice ?? 0, product.description ?? '', product.type ?? 'digital', product.link ?? null],
  });
}

export async function deleteProduct(id: string, userId: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'UPDATE products SET is_active = 0 WHERE id = ? AND user_id = ?', args: [id, userId] });
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function getLeads(userId: string): Promise<any[]> {
  const db = getDb();
  const r = await db.execute({ sql: 'SELECT * FROM leads WHERE user_id = ? ORDER BY created_at DESC', args: [userId] });
  return r.rows as any[];
}

export async function createLead(lead: Record<string, any>): Promise<string> {
  const db = getDb();
  const id = nanoid();
  await db.execute({
    sql: 'INSERT INTO leads (id, user_id, name, email, phone, status, qualification_data) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [id, lead.userId, lead.name ?? '', lead.email ?? '', lead.phone ?? '', 'new', JSON.stringify(lead.qualificationData ?? {})],
  });
  return id;
}

export async function updateLeadQualification(id: string, data: Record<string, string>): Promise<void> {
  const db = getDb();
  const existing = await db.execute({ sql: 'SELECT qualification_data FROM leads WHERE id = ?', args: [id] });
  const current = JSON.parse((existing.rows[0] as any)?.qualification_data ?? '{}');
  const merged = { ...current, ...data };
  await db.execute({ sql: 'UPDATE leads SET qualification_data = ? WHERE id = ?', args: [JSON.stringify(merged), id] });
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function getBookings(userId: string, status?: string): Promise<any[]> {
  const db = getDb();
  const sql = status
    ? 'SELECT * FROM bookings WHERE user_id = ? AND status = ? ORDER BY start_time ASC'
    : 'SELECT * FROM bookings WHERE user_id = ? ORDER BY start_time ASC';
  const args = status ? [userId, status] : [userId];
  const r = await db.execute({ sql, args });
  return r.rows as any[];
}

export async function createBooking(booking: Record<string, any>): Promise<string> {
  const db = getDb();
  const id = nanoid();
  await db.execute({
    sql: `INSERT INTO bookings (id, user_id, visitor_name, visitor_email, session_type_id, start_time, end_time, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, booking.userId, booking.visitorName, booking.visitorEmail, booking.sessionTypeId, booking.startTime, booking.endTime, booking.status ?? 'pending'],
  });
  return id;
}

export async function updateBooking(id: string, data: Record<string, any>): Promise<void> {
  const db = getDb();
  const fields = Object.keys(data);
  const setClauses = fields.map(f => {
    const col = f.replace(/([A-Z])/g, '_$1').toLowerCase();
    return `${col} = ?`;
  }).join(', ');
  await db.execute({ sql: `UPDATE bookings SET ${setClauses} WHERE id = ?`, args: [...Object.values(data), id] });
}

// ─── Session Types ────────────────────────────────────────────────────────────

export async function getSessionTypes(userId: string): Promise<any[]> {
  const db = getDb();
  const r = await db.execute({ sql: 'SELECT * FROM session_types WHERE user_id = ? AND is_active = 1', args: [userId] });
  return r.rows as any[];
}

export async function upsertSessionType(st: Record<string, any>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO session_types (id, user_id, name, duration_minutes, price, is_free, description)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET name=excluded.name, duration_minutes=excluded.duration_minutes,
          price=excluded.price, is_free=excluded.is_free, description=excluded.description`,
    args: [st.id || nanoid(), st.userId, st.name, st.durationMinutes ?? 60, st.price ?? 0, st.isFree ? 1 : 0, st.description ?? ''],
  });
}

export async function deleteSessionType(id: string, userId: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'UPDATE session_types SET is_active = 0 WHERE id = ? AND user_id = ?', args: [id, userId] });
}

// ─── Availability Rules ───────────────────────────────────────────────────────

export async function getAvailabilityRules(userId: string): Promise<any[]> {
  const db = getDb();
  const r = await db.execute({ sql: 'SELECT * FROM availability_rules WHERE user_id = ?', args: [userId] });
  return r.rows as any[];
}

export async function upsertAvailabilityRule(rule: Record<string, any>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO availability_rules (id, user_id, day_of_week, start_time, end_time, buffer_minutes)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET day_of_week=excluded.day_of_week, start_time=excluded.start_time,
          end_time=excluded.end_time, buffer_minutes=excluded.buffer_minutes`,
    args: [rule.id || nanoid(), rule.userId, rule.dayOfWeek, rule.startTime, rule.endTime, rule.bufferMinutes ?? 15],
  });
}

export async function deleteAvailabilityRule(id: string, userId: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM availability_rules WHERE id = ? AND user_id = ?', args: [id, userId] });
}

// ─── Qualification Questions ──────────────────────────────────────────────────

export async function getQualificationQuestions(userId: string): Promise<any[]> {
  const db = getDb();
  const r = await db.execute({ sql: 'SELECT * FROM qualification_questions WHERE user_id = ? ORDER BY sort_order ASC', args: [userId] });
  return r.rows as any[];
}

export async function upsertQualificationQuestion(q: Record<string, any>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO qualification_questions (id, user_id, question_text, field_key, is_required, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET question_text=excluded.question_text, field_key=excluded.field_key,
          is_required=excluded.is_required, sort_order=excluded.sort_order`,
    args: [q.id || nanoid(), q.userId, q.questionText, q.fieldKey, q.isRequired ? 1 : 0, q.sortOrder ?? 0],
  });
}

export async function deleteQualificationQuestion(id: string, userId: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM qualification_questions WHERE id = ? AND user_id = ?', args: [id, userId] });
}

// ─── Automations ──────────────────────────────────────────────────────────────

export async function getAutomations(userId: string): Promise<any[]> {
  const db = getDb();
  const r = await db.execute({ sql: 'SELECT * FROM automations WHERE user_id = ?', args: [userId] });
  return r.rows as any[];
}

export async function getEnabledAutomations(userId: string, event: string): Promise<any[]> {
  const db = getDb();
  const r = await db.execute({
    sql: 'SELECT * FROM automations WHERE user_id = ? AND trigger_event = ? AND is_enabled = 1',
    args: [userId, event],
  });
  return r.rows as any[];
}

export async function upsertAutomation(auto: Record<string, any>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO automations (id, user_id, trigger_event, action_type, is_enabled, config_json)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET trigger_event=excluded.trigger_event, action_type=excluded.action_type,
          is_enabled=excluded.is_enabled, config_json=excluded.config_json`,
    args: [auto.id || nanoid(), auto.userId, auto.triggerEvent, auto.actionType, auto.isEnabled ? 1 : 0, JSON.stringify(auto.configJson ?? {})],
  });
}

export async function updateAutomation(id: string, data: Record<string, any>): Promise<void> {
  const db = getDb();
  const updates: string[] = [];
  const args: any[] = [];
  if ('isEnabled' in data) { updates.push('is_enabled = ?'); args.push(data.isEnabled ? 1 : 0); }
  if ('configJson' in data) { updates.push('config_json = ?'); args.push(JSON.stringify(data.configJson)); }
  if (updates.length === 0) return;
  await db.execute({ sql: `UPDATE automations SET ${updates.join(', ')} WHERE id = ?`, args: [...args, id] });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactions(userId: string): Promise<any[]> {
  const db = getDb();
  const r = await db.execute({ sql: 'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC', args: [userId] });
  return r.rows as any[];
}

export async function createTransaction(tx: Record<string, any>): Promise<string> {
  const db = getDb();
  const id = nanoid();
  await db.execute({
    sql: 'INSERT INTO transactions (id, user_id, amount, currency, method, status, reference, product_id, booking_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, tx.userId, tx.amount, tx.currency ?? 'NGN', tx.method, tx.status ?? 'pending', tx.reference, tx.productId ?? null, tx.bookingId ?? null],
  });
  return id;
}

export async function updateTransaction(reference: string, status: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'UPDATE transactions SET status = ? WHERE reference = ?', args: [status, reference] });
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export async function getPlans(): Promise<any[]> {
  const db = getDb();
  const r = await db.execute('SELECT * FROM plan_prices');
  return r.rows as any[];
}

export async function upsertPlan(plan: Record<string, any>): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO plan_prices (plan_id, price_ngn, price_usd, max_products, max_leads, max_chats, features_json)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(plan_id) DO UPDATE SET price_ngn=excluded.price_ngn, price_usd=excluded.price_usd,
          max_products=excluded.max_products, max_leads=excluded.max_leads, max_chats=excluded.max_chats,
          features_json=excluded.features_json`,
    args: [plan.planId, plan.priceNgn, plan.priceUsd, plan.maxProducts, plan.maxLeads, plan.maxChats, JSON.stringify(plan.featuresJson ?? {})],
  });
}

// ─── Announcements ────────────────────────────────────────────────────────────

export async function getActiveAnnouncements(): Promise<any[]> {
  const db = getDb();
  const r = await db.execute('SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC');
  return r.rows as any[];
}

export async function createAnnouncement(message: string): Promise<string> {
  const db = getDb();
  const id = nanoid();
  await db.execute({ sql: 'INSERT INTO announcements (id, message, is_active) VALUES (?, ?, 1)', args: [id, message] });
  return id;
}

export async function toggleAnnouncement(id: string, isActive: boolean): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'UPDATE announcements SET is_active = ? WHERE id = ?', args: [isActive ? 1 : 0, id] });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats(userId: string): Promise<any> {
  const db = getDb();
  const [sales, leads, bookings, chats] = await Promise.all([
    db.execute({ sql: "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND status = 'success'", args: [userId] }),
    db.execute({ sql: 'SELECT COUNT(*) as count FROM leads WHERE user_id = ?', args: [userId] }),
    db.execute({ sql: "SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND status = 'confirmed'", args: [userId] }),
    db.execute({ sql: 'SELECT chat_count FROM business_configs WHERE user_id = ?', args: [userId] }),
  ]);
  const totalSales = (sales.rows[0] as any)?.total ?? 0;
  const leadsCount = (leads.rows[0] as any)?.count ?? 0;
  const bookingsCount = (bookings.rows[0] as any)?.count ?? 0;
  const chatsThisMonth = (chats.rows[0] as any)?.chat_count ?? 0;
  const conversionRate = leadsCount > 0 ? +((bookingsCount / leadsCount) * 100).toFixed(1) : 0;
  return { totalSales, leadsCount, bookingsCount, chatsThisMonth, conversionRate };
}

export async function getAdminRevenue(): Promise<any> {
  const db = getDb();
  const [total, byPlan] = await Promise.all([
    db.execute("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total, currency FROM transactions WHERE status = 'success' GROUP BY currency"),
    db.execute("SELECT bc.plan, COUNT(t.id) as txCount, COALESCE(SUM(t.amount), 0) as revenue FROM transactions t JOIN business_configs bc ON t.user_id = bc.user_id WHERE t.status = 'success' GROUP BY bc.plan"),
  ]);
  return { totals: total.rows, byPlan: byPlan.rows };
}
