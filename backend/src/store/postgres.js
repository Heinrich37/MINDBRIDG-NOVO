import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createPostgresStore() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const schema = fs.readFileSync(path.join(__dirname, "../db/schema.sql"), "utf8");
  await pool.query(schema);

  const adminEmail = process.env.ADMIN_EMAIL || "orientadora@senac.br";
  const adminPassword = process.env.ADMIN_PASSWORD || "MindBridge@2026";
  const adminName = process.env.ADMIN_NAME || "Orientadora Senac";
  const existing = await pool.query("SELECT id FROM counselors WHERE email = $1", [adminEmail]);
  if (existing.rowCount === 0) {
    await pool.query(
      "INSERT INTO counselors (name, email, password_hash) VALUES ($1, $2, $3)",
      [adminName, adminEmail, await bcrypt.hash(adminPassword, 10)]
    );
  }
  const testAccess = await pool.query("SELECT id FROM counselors WHERE email = $1", ["admin@senac.br"]);
  if (testAccess.rowCount === 0) {
    await pool.query(
      "INSERT INTO counselors (name, email, password_hash) VALUES ($1, $2, $3)",
      ["Acesso de Teste", "admin@senac.br", await bcrypt.hash("123456", 10)]
    );
  }

  async function getConversation(id) {
    const { rows } = await pool.query("SELECT * FROM conversations WHERE id = $1", [id]);
    if (!rows[0]) throw Object.assign(new Error("Conversa não encontrada"), { status: 404 });
    const conversation = rows[0];
    const [user, msgs, notes, checkins] = await Promise.all([
      pool.query("SELECT * FROM users WHERE id = $1", [conversation.user_id]),
      pool.query("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC", [id]),
      pool.query("SELECT * FROM counselor_notes WHERE conversation_id = $1 ORDER BY created_at DESC", [id]),
      pool.query("SELECT * FROM emotional_checkins WHERE user_id = $1 ORDER BY created_at DESC", [conversation.user_id])
    ]);
    return { ...conversation, user: user.rows[0], messages: msgs.rows, notes: notes.rows, emotional_checkins: checkins.rows };
  }

  return {
    type: "postgres",
    async createUser(input) {
      const { rows } = await pool.query(
        "INSERT INTO users (name, phone, email, course, is_anonymous, anonymous_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [input.name, input.phone, input.email, input.course || null, input.is_anonymous, input.anonymous_code]
      );
      return rows[0];
    },
    async createAnonymousUser() {
      const count = await pool.query("SELECT COUNT(*)::int AS total FROM users");
      const code = `MB-${new Date().getFullYear()}-${String(count.rows[0].total + 1).padStart(4, "0")}`;
      const { rows } = await pool.query(
        "INSERT INTO users (is_anonymous, anonymous_code) VALUES (true, $1) RETURNING *",
        [code]
      );
      return rows[0];
    },
    async createConversation(input) {
      const { rows } = await pool.query(
        "INSERT INTO conversations (user_id, risk_level, status, needs_follow_up) VALUES ($1, $2, $3, $4) RETURNING *",
        [input.user_id, input.risk_level, input.status, input.needs_follow_up]
      );
      return rows[0];
    },
    getConversation,
    async addMessage(input) {
      const { rows } = await pool.query(
        "INSERT INTO messages (conversation_id, sender_type, message) VALUES ($1, $2, $3) RETURNING *",
        [input.conversation_id, input.sender_type, input.message]
      );
      await pool.query("UPDATE conversations SET updated_at = NOW() WHERE id = $1", [input.conversation_id]);
      return rows[0];
    },
    async updateConversationRisk(id, riskLevel, tags, needsFollowUp) {
      const rank = { green: 1, yellow: 2, red: 3 };
      const current = await getConversation(id);
      const finalRisk = rank[riskLevel] > rank[current.risk_level] ? riskLevel : current.risk_level;
      const finalTags = [...new Set([...(current.tags || []), ...tags])];
      await pool.query(
        "UPDATE conversations SET risk_level = $1, needs_follow_up = needs_follow_up OR $2, tags = $3, updated_at = NOW() WHERE id = $4",
        [finalRisk, needsFollowUp, finalTags, id]
      );
      return getConversation(id);
    },
    async setConversationStatus(id, status, needsFollowUp) {
      await pool.query("UPDATE conversations SET status = $1, needs_follow_up = $2, updated_at = NOW() WHERE id = $3", [status, needsFollowUp, id]);
      return getConversation(id);
    },
    async createEmotionalCheckin(input) {
      const { rows } = await pool.query("INSERT INTO emotional_checkins (user_id, mood) VALUES ($1, $2) RETURNING *", [input.user_id, input.mood]);
      return rows[0];
    },
    async findCounselorByEmail(email) {
      const { rows } = await pool.query("SELECT * FROM counselors WHERE email = $1", [email]);
      return rows[0] || null;
    },
    async getDashboard() {
      const { rows } = await pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE risk_level = 'red')::int AS alerts,
          COUNT(*) FILTER (WHERE needs_follow_up = true OR status = 'waiting_counselor')::int AS waiting,
          COUNT(*) FILTER (WHERE status = 'closed')::int AS closed
        FROM conversations
      `);
      return rows[0];
    },
    async listConversations(filter) {
      const all = await pool.query("SELECT id FROM conversations ORDER BY updated_at DESC");
      const enriched = await Promise.all(all.rows.map((row) => getConversation(row.id)));
      return enriched.filter((conversation) => {
        if (filter === "anonymous") return conversation.user?.is_anonymous;
        if (filter === "identified") return !conversation.user?.is_anonymous;
        if (filter === "alert") return conversation.risk_level === "red";
        if (filter === "waiting") return conversation.status === "waiting_counselor" || conversation.needs_follow_up;
        if (filter === "closed") return conversation.status === "closed";
        return true;
      });
    },
    async addCounselorNote(input) {
      const { rows } = await pool.query("INSERT INTO counselor_notes (conversation_id, note) VALUES ($1, $2) RETURNING *", [input.conversation_id, input.note]);
      return rows[0];
    }
  };
}
