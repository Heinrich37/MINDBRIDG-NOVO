export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = typeof window !== "undefined" ? localStorage.getItem("mindbridge_token") : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Erro ao comunicar com o servidor");
  return data as T;
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
