import express from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { analyzeMessage, buildAssistantReply } from "./services/assistant.js";
import {
  hashToken,
  publicConversation,
  publicUser,
  randomToken,
  sanitizeText,
  signCounselorToken,
  timingSafeEqualText,
  verifyCounselorToken
} from "./security.js";

const userSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  email: z.string().trim().email().max(180),
  course: z.string().trim().max(120).optional().nullable(),
  consent: z.literal(true),
  checkin: z.enum(["Muito bem", "Bem", "Neutro", "Mal", "Muito mal"])
});

const messageSchema = z.object({
  message: z.string().trim().min(1).max(1500)
});

const noteSchema = z.object({
  note: z.string().trim().min(1).max(2000)
});

const anonymousEntrySchema = z.object({
  checkin: z.enum(["Muito bem", "Bem", "Neutro", "Mal", "Muito mal"]).default("Neutro")
});

const idSchema = z.object({
  id: z.string().uuid()
});

const quickActionSchema = z.object({
  action: z.enum(["counselor", "contacts", "close", "ai"])
});

const statusSchema = z.object({
  status: z.enum(["open", "waiting_counselor", "in_follow_up", "closed", "emergency"])
});

const emotionalCheckinSchema = z.object({
  user_id: z.string().uuid(),
  mood: z.enum(["😀", "😐", "😢", "😡", "😰", "😴", "Muito bem", "Bem", "Neutro", "Mal", "Muito mal"])
});

function authCounselor(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    const err = new Error("Token ausente");
    err.status = 401;
    throw err;
  }
  try {
    req.counselor = verifyCounselorToken(token);
    next();
  } catch {
    const err = new Error("Sessão inválida");
    err.status = 401;
    throw err;
  }
}

function optionalCounselor(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return verifyCounselorToken(token);
  } catch {
    return null;
  }
}

async function authConversation(req, _res, next) {
  try {
    const counselor = optionalCounselor(req);
    if (counselor) {
      req.counselor = counselor;
      next();
      return;
    }
    const { id } = idSchema.parse(req.params);
    const token = req.headers["x-conversation-token"];
    if (typeof token !== "string" || token.length < 32) {
      const err = new Error("Acesso à conversa não autorizado");
      err.status = 401;
      throw err;
    }
    const expectedHash = await req.store.getConversationAccessTokenHash(id);
    if (!timingSafeEqualText(hashToken(token), expectedHash)) {
      const err = new Error("Acesso à conversa não autorizado");
      err.status = 401;
      throw err;
    }
    next();
  } catch (err) {
    next(err);
  }
}

async function authConversationFromHeaders(req, _res, next) {
  try {
    const conversationId = req.headers["x-conversation-id"];
    const conversationToken = req.headers["x-conversation-token"];
    if (typeof conversationId !== "string" || typeof conversationToken !== "string") {
      const err = new Error("Acesso à conversa não autorizado");
      err.status = 401;
      throw err;
    }
    idSchema.parse({ id: conversationId });
    const expectedHash = await req.store.getConversationAccessTokenHash(conversationId);
    if (!timingSafeEqualText(hashToken(conversationToken), expectedHash)) {
      const err = new Error("Acesso à conversa não autorizado");
      err.status = 401;
      throw err;
    }
    req.conversationId = conversationId;
    next();
  } catch (err) {
    next(err);
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." }
});

export function createApiRouter({ store }) {
  const router = express.Router();
  router.use((req, _res, next) => {
    req.store = store;
    next();
  });

  router.post("/entry/identified", async (req, res) => {
    const input = userSchema.parse(req.body);
    const conversationToken = randomToken();
    const user = await store.createUser({
      name: sanitizeText(input.name, 120),
      phone: sanitizeText(input.phone, 30),
      email: sanitizeText(input.email, 180).toLowerCase(),
      course: sanitizeText(input.course, 120) || null,
      is_anonymous: false,
      anonymous_code: null
    });
    const risk = input.checkin === "Muito mal" ? "yellow" : "green";
    const conversation = await store.createConversation({
      user_id: user.id,
      access_token_hash: hashToken(conversationToken),
      risk_level: risk,
      status: "open",
      needs_follow_up: risk !== "green"
    });
    await store.createEmotionalCheckin({ user_id: user.id, mood: input.checkin });
    await store.addMessage({
      conversation_id: conversation.id,
      sender_type: "assistant",
      message: "Olá. Obrigado por chegar até aqui. Este é um espaço de acolhimento inicial, sem diagnósticos. Como posso te escutar hoje?"
    });
    res.status(201).json({ user: publicUser(user), conversation: publicConversation(conversation), conversation_token: conversationToken });
  });

  router.post("/entry/anonymous", async (req, res) => {
    const { checkin } = anonymousEntrySchema.parse(req.body);
    const conversationToken = randomToken();
    const user = await store.createAnonymousUser();
    const risk = checkin === "Muito mal" ? "yellow" : "green";
    const conversation = await store.createConversation({
      user_id: user.id,
      access_token_hash: hashToken(conversationToken),
      risk_level: risk,
      status: "open",
      needs_follow_up: risk !== "green"
    });
    await store.createEmotionalCheckin({ user_id: user.id, mood: checkin });
    await store.addMessage({
      conversation_id: conversation.id,
      sender_type: "assistant",
      message: `Olá. Você entrou como ${user.anonymous_code}. Pode conversar sem informar sua identidade. Se houver risco, a orientadora poderá receber um alerta interno para acompanhamento.`
    });
    res.status(201).json({ user: publicUser(user), conversation: publicConversation(conversation), conversation_token: conversationToken });
  });

  router.get("/conversations/:id", authConversation, async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const conversation = await store.getConversation(id);
    res.json(publicConversation(conversation));
  });

  router.post("/conversations/:id/messages", authConversation, async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const { message } = messageSchema.parse(req.body);
    const userMessage = await store.addMessage({
      conversation_id: id,
      sender_type: "student",
      message: sanitizeText(message, 1500)
    });
    const analysis = analyzeMessage(userMessage.message);
    await store.updateConversationRisk(id, analysis.riskLevel, analysis.tags, analysis.needsFollowUp);

    const assistantMessage = await store.addMessage({
      conversation_id: id,
      sender_type: "assistant",
      message: buildAssistantReply(userMessage.message, analysis)
    });

    const conversation = publicConversation(await store.getConversation(id));
    res.status(201).json({ userMessage, assistantMessage, conversation });
  });

  router.post("/conversations/:id/quick-action", authConversation, async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const { action } = quickActionSchema.parse(req.body);
    const replies = {
      counselor: "Entendi. Vou sinalizar que você quer falar com a orientadora do Senac. Buscar ajuda é um ato de coragem.",
      contacts: "Contatos de ajuda: CVV 188, SAMU 192 e Bombeiros 193. Se houver risco agora, procure ajuda imediata.",
      close: "Conversa encerrada. Você pode voltar quando precisar. Buscar ajuda é um ato de coragem.",
      ai: "Tudo bem. Podemos continuar por aqui, com calma. O que você gostaria de me contar agora?"
    };
    if (action === "counselor") {
      await store.setConversationStatus(id, "waiting_counselor", true);
    }
    if (action === "close") {
      await store.setConversationStatus(id, "closed", false);
    }
    const message = await store.addMessage({
      conversation_id: id,
      sender_type: "assistant",
      message: replies[action] || replies.ai
    });
    const conversation = publicConversation(await store.getConversation(id));
    res.json({ message, conversation });
  });

  router.post("/emotional-checkins", authConversationFromHeaders, async (req, res) => {
    const { user_id, mood } = emotionalCheckinSchema.parse(req.body);
    const conversation = await store.getConversation(req.conversationId);
    if (conversation.user_id !== user_id) {
      const err = new Error("Acesso não autorizado ao check-in");
      err.status = 403;
      throw err;
    }
    const checkin = await store.createEmotionalCheckin({ user_id, mood });
    res.status(201).json(checkin);
  });

  router.post("/counselor/login", loginLimiter, async (req, res) => {
    const email = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "").trim();
    const counselor = await store.findCounselorByEmail(email);
    if (!counselor || !(await bcrypt.compare(password, counselor.password_hash))) {
      const err = new Error("E-mail ou senha inválidos");
      err.status = 401;
      throw err;
    }
    const token = signCounselorToken({ id: counselor.id, email: counselor.email, name: counselor.name });
    res.json({ token, counselor: { id: counselor.id, name: counselor.name, email: counselor.email } });
  });

  router.get("/counselor/dashboard", authCounselor, async (_req, res) => {
    res.json(await store.getDashboard());
  });

  router.get("/counselor/conversations", authCounselor, async (req, res) => {
    const conversations = await store.listConversations(req.query.filter || "all");
    res.json(conversations.map(publicConversation));
  });

  router.post("/counselor/conversations/:id/reply", authCounselor, async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const { message } = messageSchema.parse(req.body);
    const reply = await store.addMessage({
      conversation_id: id,
      sender_type: "counselor",
      message: sanitizeText(message, 1500)
    });
    await store.setConversationStatus(id, "in_follow_up", true);
    const conversation = publicConversation(await store.getConversation(id));
    res.status(201).json({ reply, conversation });
  });

  router.post("/counselor/conversations/:id/status", authCounselor, async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const { status } = statusSchema.parse(req.body);
    const conversation = await store.setConversationStatus(id, status, status !== "closed");
    res.json(publicConversation(conversation));
  });

  router.post("/counselor/conversations/:id/notes", authCounselor, async (req, res) => {
    const { id } = idSchema.parse(req.params);
    const { note } = noteSchema.parse(req.body);
    const saved = await store.addCounselorNote({ conversation_id: id, note: sanitizeText(note, 2000) });
    res.status(201).json(saved);
  });

  return router;
}
