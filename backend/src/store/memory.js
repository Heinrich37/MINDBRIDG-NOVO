import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

const now = () => new Date().toISOString();

export async function createMemoryStore() {
  const users = [];
  const conversations = [];
  const messages = [];
  const counselors = [];
  const notes = [];
  const checkins = [];

  counselors.push({
    id: uuid(),
    name: process.env.ADMIN_NAME || "Orientadora Senac",
    email: process.env.ADMIN_EMAIL || "orientadora@senac.br",
    password_hash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "MindBridge@2026", 10)
  });
  counselors.push({
    id: uuid(),
    name: "Acesso de Teste",
    email: "admin@senac.br",
    password_hash: await bcrypt.hash("123456", 10)
  });

  function enrich(conversation) {
    const user = users.find((item) => item.id === conversation.user_id);
    return {
      ...conversation,
      user,
      messages: messages.filter((item) => item.conversation_id === conversation.id),
      notes: notes.filter((item) => item.conversation_id === conversation.id),
      emotional_checkins: checkins.filter((item) => item.user_id === conversation.user_id)
    };
  }

  return {
    type: "memory",
    async createUser(input) {
      const user = { id: uuid(), created_at: now(), ...input };
      users.push(user);
      return user;
    },
    async createAnonymousUser() {
      const code = `MB-${new Date().getFullYear()}-${String(users.length + 1).padStart(4, "0")}`;
      const user = { id: uuid(), name: null, phone: null, email: null, course: null, is_anonymous: true, anonymous_code: code, created_at: now() };
      users.push(user);
      return user;
    },
    async createConversation(input) {
      const conversation = { id: uuid(), tags: [], created_at: now(), updated_at: now(), ...input };
      conversations.push(conversation);
      return conversation;
    },
    async getConversation(id) {
      const conversation = conversations.find((item) => item.id === id);
      if (!conversation) throw Object.assign(new Error("Conversa não encontrada"), { status: 404 });
      return enrich(conversation);
    },
    async addMessage(input) {
      const message = { id: uuid(), created_at: now(), ...input };
      messages.push(message);
      const conversation = conversations.find((item) => item.id === input.conversation_id);
      if (conversation) conversation.updated_at = now();
      return message;
    },
    async updateConversationRisk(id, riskLevel, newTags, needsFollowUp) {
      const conversation = conversations.find((item) => item.id === id);
      if (!conversation) return null;
      const rank = { green: 1, yellow: 2, red: 3 };
      if (rank[riskLevel] > rank[conversation.risk_level]) conversation.risk_level = riskLevel;
      conversation.needs_follow_up = conversation.needs_follow_up || needsFollowUp;
      conversation.tags = [...new Set([...(conversation.tags || []), ...newTags])];
      conversation.updated_at = now();
      return enrich(conversation);
    },
    async setConversationStatus(id, status, needsFollowUp) {
      const conversation = conversations.find((item) => item.id === id);
      if (!conversation) throw Object.assign(new Error("Conversa não encontrada"), { status: 404 });
      conversation.status = status;
      conversation.needs_follow_up = needsFollowUp;
      conversation.updated_at = now();
      return enrich(conversation);
    },
    async createEmotionalCheckin(input) {
      const checkin = { id: uuid(), created_at: now(), ...input };
      checkins.push(checkin);
      return checkin;
    },
    async findCounselorByEmail(email) {
      return counselors.find((item) => item.email.toLowerCase() === email.toLowerCase()) || null;
    },
    async getDashboard() {
      return {
        total: conversations.length,
        alerts: conversations.filter((item) => item.risk_level === "red").length,
        waiting: conversations.filter((item) => item.status === "waiting_counselor" || item.needs_follow_up).length,
        closed: conversations.filter((item) => item.status === "closed").length
      };
    },
    async listConversations(filter) {
      return conversations
        .filter((conversation) => {
          const user = users.find((item) => item.id === conversation.user_id);
          if (filter === "anonymous") return user?.is_anonymous;
          if (filter === "identified") return !user?.is_anonymous;
          if (filter === "alert") return conversation.risk_level === "red";
          if (filter === "waiting") return conversation.status === "waiting_counselor" || conversation.needs_follow_up;
          if (filter === "closed") return conversation.status === "closed";
          return true;
        })
        .map(enrich)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    },
    async addCounselorNote(input) {
      const note = { id: uuid(), created_at: now(), ...input };
      notes.push(note);
      return note;
    }
  };
}
