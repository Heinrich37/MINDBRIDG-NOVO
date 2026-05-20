import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { analyzeMessage, buildAssistantReply } from "./services/assistant.js";

const jwtSecret = process.env.JWT_SECRET || "mindbridge-dev-secret";

const userSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  course: z.string().optional().nullable(),
  consent: z.literal(true),
  checkin: z.string().min(2)
});

const messageSchema = z.object({
  message: z.string().min(1).max(2000)
});

const noteSchema = z.object({
  note: z.string().min(1).max(4000)
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
    req.counselor = jwt.verify(token, jwtSecret);
    next();
  } catch {
    const err = new Error("Sessão inválida");
    err.status = 401;
    throw err;
  }
}

export function createApiRouter({ store, io }) {
  const router = express.Router();

  router.post("/entry/identified", async (req, res) => {
    const input = userSchema.parse(req.body);
    const user = await store.createUser({
      ...input,
      is_anonymous: false,
      anonymous_code: null
    });
    const risk = input.checkin === "Muito mal" ? "yellow" : "green";
    const conversation = await store.createConversation({
      user_id: user.id,
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
    res.status(201).json({ user, conversation });
  });

  router.post("/entry/anonymous", async (req, res) => {
    const checkin = String(req.body?.checkin || "Neutro");
    const user = await store.createAnonymousUser();
    const risk = checkin === "Muito mal" ? "yellow" : "green";
    const conversation = await store.createConversation({
      user_id: user.id,
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
    res.status(201).json({ user, conversation });
  });

  router.get("/conversations/:id", async (req, res) => {
    const conversation = await store.getConversation(req.params.id);
    res.json(conversation);
  });

  router.post("/conversations/:id/messages", async (req, res) => {
    const { message } = messageSchema.parse(req.body);
    const userMessage = await store.addMessage({
      conversation_id: req.params.id,
      sender_type: "student",
      message
    });
    const analysis = analyzeMessage(message);
    await store.updateConversationRisk(req.params.id, analysis.riskLevel, analysis.tags, analysis.needsFollowUp);

    const assistantMessage = await store.addMessage({
      conversation_id: req.params.id,
      sender_type: "assistant",
      message: buildAssistantReply(message, analysis)
    });

    const conversation = await store.getConversation(req.params.id);
    io.to(`conversation:${req.params.id}`).emit("message:new", userMessage);
    io.to(`conversation:${req.params.id}`).emit("message:new", assistantMessage);
    io.to("counselor").emit("conversation:update", conversation);
    if (analysis.riskLevel === "red") {
      io.to("counselor").emit("alert:red", conversation);
    }
    res.status(201).json({ userMessage, assistantMessage, conversation });
  });

  router.post("/conversations/:id/quick-action", async (req, res) => {
    const action = String(req.body?.action || "");
    const replies = {
      counselor: "Entendi. Vou sinalizar que você quer falar com a orientadora do Senac. Buscar ajuda é um ato de coragem.",
      contacts: "Contatos de ajuda: CVV 188, SAMU 192 e Bombeiros 193. Se houver risco agora, procure ajuda imediata.",
      close: "Conversa encerrada. Você pode voltar quando precisar. Buscar ajuda é um ato de coragem.",
      ai: "Tudo bem. Podemos continuar por aqui, com calma. O que você gostaria de me contar agora?"
    };
    if (action === "counselor") {
      await store.setConversationStatus(req.params.id, "waiting_counselor", true);
    }
    if (action === "close") {
      await store.setConversationStatus(req.params.id, "closed", false);
    }
    const message = await store.addMessage({
      conversation_id: req.params.id,
      sender_type: "assistant",
      message: replies[action] || replies.ai
    });
    const conversation = await store.getConversation(req.params.id);
    io.to(`conversation:${req.params.id}`).emit("message:new", message);
    io.to("counselor").emit("conversation:update", conversation);
    res.json({ message, conversation });
  });

  router.post("/emotional-checkins", async (req, res) => {
    const user_id = String(req.body?.user_id || "");
    const mood = String(req.body?.mood || "");
    const checkin = await store.createEmotionalCheckin({ user_id, mood });
    res.status(201).json(checkin);
  });

  router.post("/counselor/login", async (req, res) => {
    const email = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "").trim();
    const counselor = await store.findCounselorByEmail(email);
    if (!counselor || !(await bcrypt.compare(password, counselor.password_hash))) {
      const err = new Error("E-mail ou senha inválidos");
      err.status = 401;
      throw err;
    }
    const token = jwt.sign({ id: counselor.id, email: counselor.email, name: counselor.name }, jwtSecret, { expiresIn: "8h" });
    res.json({ token, counselor: { id: counselor.id, name: counselor.name, email: counselor.email } });
  });

  router.get("/counselor/dashboard", authCounselor, async (_req, res) => {
    res.json(await store.getDashboard());
  });

  router.get("/counselor/conversations", authCounselor, async (req, res) => {
    res.json(await store.listConversations(req.query.filter || "all"));
  });

  router.post("/counselor/conversations/:id/reply", authCounselor, async (req, res) => {
    const { message } = messageSchema.parse(req.body);
    const reply = await store.addMessage({
      conversation_id: req.params.id,
      sender_type: "counselor",
      message
    });
    await store.setConversationStatus(req.params.id, "in_follow_up", true);
    const conversation = await store.getConversation(req.params.id);
    io.to(`conversation:${req.params.id}`).emit("message:new", reply);
    io.to("counselor").emit("conversation:update", conversation);
    res.status(201).json({ reply, conversation });
  });

  router.post("/counselor/conversations/:id/status", authCounselor, async (req, res) => {
    const status = String(req.body?.status || "open");
    const conversation = await store.setConversationStatus(req.params.id, status, status !== "closed");
    res.json(conversation);
  });

  router.post("/counselor/conversations/:id/notes", authCounselor, async (req, res) => {
    const { note } = noteSchema.parse(req.body);
    const saved = await store.addCounselorNote({ conversation_id: req.params.id, note });
    res.status(201).json(saved);
  });

  return router;
}
