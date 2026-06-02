export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
export const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "true";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (STATIC_DEMO && typeof window !== "undefined") {
    return staticDemoApi<T>(path, options);
  }

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = typeof window !== "undefined" ? localStorage.getItem("mindbridge_token") : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Erro ao comunicar com o servidor");
  return data as T;
}

type DemoDb = {
  conversations: Conversation[];
};

function demoDb(): DemoDb {
  const saved = localStorage.getItem("mindbridge_demo_db");
  if (saved) return JSON.parse(saved) as DemoDb;
  return { conversations: [] };
}

function saveDemoDb(db: DemoDb) {
  localStorage.setItem("mindbridge_demo_db", JSON.stringify(db));
}

function demoMessage(sender_type: Message["sender_type"], message: string): Message {
  return {
    id: crypto.randomUUID(),
    conversation_id: "demo",
    sender_type,
    message,
    created_at: new Date().toISOString()
  };
}

function detectDemoRisk(message: string): RiskLevel {
  const text = message.toLowerCase();
  if (["suicídio", "suicidio", "me matar", "não quero viver", "nao quero viver", "automutilação", "violência", "violencia", "abuso"].some((term) => text.includes(term))) return "red";
  if (["sumir", "triste", "sozinho", "sozinha", "não aguento", "nao aguento", "muito mal"].some((term) => text.includes(term))) return "yellow";
  return "green";
}

function assistantDemoReply(risk: RiskLevel) {
  if (risk === "red") {
    return "Sinto muito que você esteja passando por esse momento. Você não precisa lidar com isso sozinho.\n\nSe estiver em risco agora, procure ajuda imediata: CVV 188, SAMU 192 ou Bombeiros 193.\n\nTambém posso sinalizar esta conversa para a orientadora do Senac. Buscar ajuda é um ato de coragem.";
  }
  if (risk === "yellow") {
    return "Obrigado por me contar. Conversar com alguém pode aliviar parte desse peso. A orientadora do Senac pode ajudar você dentro da instituição.";
  }
  return "Obrigado por confiar em mim para falar sobre isso. Posso continuar te escutando, e a orientadora do Senac também pode ajudar se você quiser.";
}

async function staticDemoApi<T>(path: string, options: RequestInit): Promise<T> {
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(String(options.body)) : {};
  const db = demoDb();
  const conversation = db.conversations[0];

  if (path === "/entry/anonymous" && method === "POST") {
    const item: Conversation = {
      id: "demo",
      risk_level: body.checkin === "Muito mal" ? "yellow" : "green",
      status: "open",
      needs_follow_up: body.checkin === "Muito mal",
      tags: [],
      updated_at: new Date().toISOString(),
      user: {
        id: "demo-user",
        name: null,
        phone: null,
        email: null,
        course: null,
        is_anonymous: true,
        anonymous_code: "MB-2026-0001"
      },
      messages: [demoMessage("assistant", "Olá. Você entrou como MB-2026-0001. Pode conversar sem informar sua identidade.")],
      notes: [],
      emotional_checkins: [{ id: crypto.randomUUID(), mood: body.checkin || "Neutro", created_at: new Date().toISOString() }]
    };
    db.conversations = [item];
    saveDemoDb(db);
    return { user: item.user, conversation: item } as T;
  }

  if (path === "/entry/identified" && method === "POST") {
    const item: Conversation = {
      id: "demo",
      risk_level: body.checkin === "Muito mal" ? "yellow" : "green",
      status: "open",
      needs_follow_up: body.checkin === "Muito mal",
      tags: [],
      updated_at: new Date().toISOString(),
      user: {
        id: "demo-user",
        name: body.name,
        phone: body.phone,
        email: body.email,
        course: body.course || null,
        is_anonymous: false,
        anonymous_code: null
      },
      messages: [demoMessage("assistant", "Olá. Obrigado por chegar até aqui. Este é um espaço de acolhimento inicial, sem diagnósticos. Como posso te escutar hoje?")],
      notes: [],
      emotional_checkins: [{ id: crypto.randomUUID(), mood: body.checkin || "Neutro", created_at: new Date().toISOString() }]
    };
    db.conversations = [item];
    saveDemoDb(db);
    return { user: item.user, conversation: item } as T;
  }

  if (path.startsWith("/conversations/") && method === "GET") {
    if (!conversation) throw new Error("Conversa não encontrada");
    return conversation as T;
  }

  if (path.endsWith("/messages") && method === "POST") {
    if (!conversation) throw new Error("Conversa não encontrada");
    const risk = detectDemoRisk(body.message);
    conversation.risk_level = risk === "red" || conversation.risk_level === "red" ? "red" : risk === "yellow" ? "yellow" : conversation.risk_level;
    conversation.needs_follow_up = conversation.needs_follow_up || risk !== "green";
    conversation.updated_at = new Date().toISOString();
    const userMessage = demoMessage("student", body.message);
    const assistantMessage = demoMessage("assistant", assistantDemoReply(risk));
    conversation.messages.push(userMessage, assistantMessage);
    saveDemoDb(db);
    return { userMessage, assistantMessage, conversation } as T;
  }

  if (path.endsWith("/quick-action") && method === "POST") {
    if (!conversation) throw new Error("Conversa não encontrada");
    const replies: Record<string, string> = {
      counselor: "Entendi. Vou sinalizar que você quer falar com a orientadora do Senac. Buscar ajuda é um ato de coragem.",
      contacts: "Contatos de ajuda: CVV 188, SAMU 192 e Bombeiros 193. Se houver risco agora, procure ajuda imediata.",
      close: "Conversa encerrada. Você pode voltar quando precisar. Buscar ajuda é um ato de coragem.",
      ai: "Tudo bem. Podemos continuar por aqui, com calma. O que você gostaria de me contar agora?"
    };
    if (body.action === "counselor") conversation.status = "waiting_counselor";
    if (body.action === "close") conversation.status = "closed";
    const message = demoMessage("assistant", replies[body.action] || replies.ai);
    conversation.messages.push(message);
    saveDemoDb(db);
    return { message, conversation } as T;
  }

  if (path === "/emotional-checkins" && method === "POST") {
    if (!conversation) throw new Error("Conversa não encontrada");
    const checkin = { id: crypto.randomUUID(), mood: body.mood, created_at: new Date().toISOString() };
    conversation.emotional_checkins.push(checkin);
    saveDemoDb(db);
    return checkin as T;
  }

  if (path === "/counselor/login" && method === "POST") {
    if ((body.email === "admin@senac.br" && body.password === "123456") || (body.email === "orientadora@senac.br" && body.password === "MindBridge@2026")) {
      return { token: "static-demo-token", counselor: { id: "demo-counselor", name: "Orientadora Senac", email: body.email } } as T;
    }
    throw new Error("E-mail ou senha inválidos");
  }

  if (path === "/counselor/dashboard") {
    return {
      total: db.conversations.length,
      alerts: db.conversations.filter((item) => item.risk_level === "red").length,
      waiting: db.conversations.filter((item) => item.needs_follow_up || item.status === "waiting_counselor").length,
      closed: db.conversations.filter((item) => item.status === "closed").length
    } as T;
  }

  if (path.startsWith("/counselor/conversations?")) {
    return db.conversations as T;
  }

  if (path.endsWith("/reply") && method === "POST") {
    if (!conversation) throw new Error("Conversa não encontrada");
    const reply = demoMessage("counselor", body.message);
    conversation.messages.push(reply);
    conversation.status = "in_follow_up";
    saveDemoDb(db);
    return { reply, conversation } as T;
  }

  if (path.endsWith("/status") && method === "POST") {
    if (!conversation) throw new Error("Conversa não encontrada");
    conversation.status = body.status;
    saveDemoDb(db);
    return conversation as T;
  }

  if (path.endsWith("/notes") && method === "POST") {
    if (!conversation) throw new Error("Conversa não encontrada");
    const note = { id: crypto.randomUUID(), note: body.note, created_at: new Date().toISOString() };
    conversation.notes.push(note);
    saveDemoDb(db);
    return note as T;
  }

  throw new Error("Rota indisponível no modo demo estático");
}

export type RiskLevel = "green" | "yellow" | "red";

export type Message = {
  id: string;
  conversation_id: string;
  sender_type: "student" | "assistant" | "counselor";
  message: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  risk_level: RiskLevel;
  status: string;
  needs_follow_up: boolean;
  tags: string[];
  updated_at: string;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    course: string | null;
    is_anonymous: boolean;
    anonymous_code: string | null;
  };
  messages: Message[];
  notes: { id: string; note: string; created_at: string }[];
  emotional_checkins: { id: string; mood: string; created_at: string }[];
};
