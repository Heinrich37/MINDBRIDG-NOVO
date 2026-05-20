"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, Conversation } from "@/lib/api";
import { Logo } from "@/components/Logo";

const statusOptions = [
  ["in_follow_up", "Marcar acompanhado"],
  ["closed", "Encerrar atendimento"],
  ["emergency", "Marcar emergência"]
];

export default function CounselorConversationPage() {
  const params = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setConversation(await api<Conversation>(`/conversations/${params.id}`));
  }

  useEffect(() => { load(); }, [params.id]);

  async function sendReply(event: FormEvent) {
    event.preventDefault();
    if (!reply.trim()) return;
    await api(`/counselor/conversations/${params.id}/reply`, { method: "POST", body: JSON.stringify({ message: reply }) });
    setReply("");
    load();
  }

  async function saveNote(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    await api(`/counselor/conversations/${params.id}/notes`, { method: "POST", body: JSON.stringify({ note }) });
    setNote("");
    load();
  }

  async function setStatus(status: string) {
    const data = await api<Conversation>(`/counselor/conversations/${params.id}/status`, { method: "POST", body: JSON.stringify({ status }) });
    setConversation(data);
  }

  if (!conversation) return <main className="p-6">Carregando...</main>;
  const user = conversation.user;

  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-6xl"><Logo /></div>
      <section className="mx-auto mt-8 grid max-w-6xl gap-5 lg:grid-cols-[1fr_340px]">
        <div className="glass rounded-[1.7rem] p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{user?.is_anonymous ? user.anonymous_code : user?.name}</h1>
              <p className="text-sm text-ink/60 dark:text-white/60">Risco: {conversation.risk_level.toUpperCase()} · Status: {conversation.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(([value, label]) => <button key={value} onClick={() => setStatus(value)} className="rounded-full bg-white/70 px-3 py-2 text-sm dark:bg-white/10">{label}</button>)}
            </div>
          </div>
          <div className="max-h-[58vh] space-y-3 overflow-y-auto rounded-3xl bg-white/55 p-4 dark:bg-white/5">
            {conversation.messages.map((message) => (
              <div key={message.id} className={`rounded-3xl px-4 py-3 text-sm leading-6 ${message.sender_type === "student" ? "ml-auto max-w-[82%] bg-ink text-white" : message.sender_type === "counselor" ? "max-w-[82%] bg-ocean text-white" : "max-w-[82%] bg-white dark:bg-white/10"}`}>
                <p className="mb-1 text-xs opacity-70">{message.sender_type}</p>
                <p className="whitespace-pre-line">{message.message}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendReply} className="mt-4 flex gap-2">
            <input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Responder aluno" className="min-w-0 flex-1 rounded-2xl border border-ink/10 bg-white/75 px-4 py-3 outline-none dark:border-white/10 dark:bg-white/10" />
            <button className="rounded-2xl bg-ink px-5 py-3 font-medium text-white dark:bg-mint dark:text-ink">Enviar</button>
          </form>
        </div>
        <aside className="space-y-4">
          <div className="glass rounded-[1.7rem] p-5">
            <h2 className="font-semibold">Dados do aluno</h2>
            <div className="mt-4 space-y-2 text-sm text-ink/68 dark:text-white/68">
              <p>Nome: {user?.name || user?.anonymous_code}</p>
              <p>E-mail: {user?.email || "Anônimo"}</p>
              <p>Telefone: {user?.phone || "Anônimo"}</p>
              <p>Curso/Turma: {user?.course || "Não informado"}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{conversation.tags?.map((tag) => <span key={tag} className="rounded-full bg-mint/60 px-3 py-1 text-xs text-ink">{tag}</span>)}</div>
          </div>
          <form onSubmit={saveNote} className="glass rounded-[1.7rem] p-5">
            <h2 className="font-semibold">Anotação interna da orientadora</h2>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={5} className="mt-4 w-full rounded-2xl border border-ink/10 bg-white/75 p-3 outline-none dark:border-white/10 dark:bg-white/10" />
            <button className="mt-3 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white dark:bg-mint dark:text-ink">Salvar anotação</button>
            <div className="mt-4 space-y-3">{conversation.notes?.map((item) => <p key={item.id} className="rounded-2xl bg-white/65 p-3 text-sm dark:bg-white/10">{item.note}</p>)}</div>
          </form>
          <div className="glass rounded-[1.7rem] p-5">
            <h2 className="font-semibold">Padrões emocionais</h2>
            <div className="mt-3 flex flex-wrap gap-2">{conversation.emotional_checkins?.map((item) => <span key={item.id} className="rounded-full bg-white/70 px-3 py-1 text-sm dark:bg-white/10">{item.mood}</span>)}</div>
          </div>
        </aside>
      </section>
    </main>
  );
}
