"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import { Bot, HeartHandshake, LifeBuoy, Send, SmilePlus, UserRound } from "lucide-react";
import { api, API_URL, Conversation, Message } from "@/lib/api";
import { BreathingModal } from "@/components/BreathingModal";

const socketUrl = API_URL.replace("/api", "");
const moods = ["😀", "😐", "😢", "😡", "😰", "😴"];

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<Conversation>(`/conversations/${params.id}`).then((data) => {
      setConversation(data);
      setMessages(data.messages);
    });
    const socket = io(socketUrl);
    socket.emit("join:conversation", params.id);
    socket.on("message:new", (message: Message) => {
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setTyping(false);
    });
    return () => { socket.disconnect(); };
  }, [params.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const redAlert = useMemo(() => conversation?.risk_level === "red" || messages.some((item) => item.message.includes("CVV 188")), [conversation, messages]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    setTyping(true);
    const data = await api<{ conversation: Conversation }>(`/conversations/${params.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ message: text })
    });
    setConversation(data.conversation);
  }

  async function quick(action: string) {
    const data = await api<{ conversation: Conversation }>(`/conversations/${params.id}/quick-action`, {
      method: "POST",
      body: JSON.stringify({ action })
    });
    setConversation(data.conversation);
  }

  async function saveMood(mood: string) {
    if (!conversation?.user?.id) return;
    await api("/emotional-checkins", {
      method: "POST",
      body: JSON.stringify({ user_id: conversation.user.id, mood })
    });
    setMoodOpen(false);
    setMessages((current) => [...current, {
      id: `local-${Date.now()}`,
      conversation_id: params.id,
      sender_type: "student",
      message: `Como estou me sentindo hoje: ${mood}`,
      created_at: new Date().toISOString()
    }]);
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="border-b border-ink/10 bg-white/78 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-ink/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint text-ink"><Bot size={21} /></div>
            <div>
              <h1 className="font-semibold">MindBridge</h1>
              <p className="text-xs text-ink/58 dark:text-white/60">Acolhimento inicial, sem diagnósticos</p>
            </div>
          </div>
          {redAlert && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">Alerta ativo</span>}
        </div>
      </header>

      {redAlert && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="mx-auto max-w-4xl">Se estiver em risco agora, procure ajuda imediata: CVV 188, SAMU 192 ou Bombeiros 193.</div>
        </div>
      )}

      <section className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-4 py-4">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((message) => {
            const mine = message.sender_type === "student";
            const counselor = message.sender_type === "counselor";
            return (
              <div key={message.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${counselor ? "bg-ocean text-white" : "bg-mint text-ink"}`}>{counselor ? <UserRound size={16} /> : <Bot size={16} />}</div>}
                <div className={`max-w-[82%] whitespace-pre-line rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${mine ? "bg-ink text-white dark:bg-mint dark:text-ink" : "bg-white/85 text-ink dark:bg-white/10 dark:text-white"}`}>
                  {message.message}
                </div>
              </div>
            );
          })}
          {typing && <div className="ml-10 text-sm text-ink/55 dark:text-white/55">IA digitando...</div>}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => quick("counselor")} className="shrink-0 rounded-full border border-ocean/30 bg-white/70 px-4 py-2 text-sm">Quero falar com a orientadora</button>
          <button onClick={() => quick("ai")} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm">Prefiro continuar com a IA</button>
          <button onClick={() => quick("contacts")} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm"><LifeBuoy className="mr-1 inline" size={15} /> Ver contatos de ajuda</button>
          <button onClick={() => setBreathing(true)} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm">Exercícios de respiração</button>
          <button onClick={() => setMoodOpen((value) => !value)} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm"><SmilePlus className="mr-1 inline" size={15} /> Como estou me sentindo hoje</button>
          <button onClick={() => quick("close")} className="shrink-0 rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm">Encerrar conversa</button>
        </div>
        {moodOpen && <div className="mb-3 flex gap-2 rounded-2xl bg-white/70 p-3 dark:bg-white/10">{moods.map((mood) => <button key={mood} onClick={() => saveMood(mood)} className="rounded-xl px-3 py-2 text-2xl hover:bg-mint/50">{mood}</button>)}</div>}
        <form onSubmit={send} className="flex gap-2 rounded-3xl border border-ink/10 bg-white/82 p-2 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/10">
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escreva sua mensagem..." className="min-w-0 flex-1 bg-transparent px-4 outline-none" />
          <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white dark:bg-mint dark:text-ink" title="Enviar"><Send size={18} /></button>
        </form>
        <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-ink/55 dark:text-white/55"><HeartHandshake size={14} /> Buscar ajuda é um ato de coragem.</p>
      </section>
      <BreathingModal open={breathing} onClose={() => setBreathing(false)} />
    </main>
  );
}
