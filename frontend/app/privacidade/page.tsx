import { Logo } from "@/components/Logo";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl"><Logo /></div>
      <article className="glass mx-auto mt-8 max-w-3xl space-y-5 rounded-[2rem] p-6 leading-7 md:p-8">
        <h1 className="text-3xl font-semibold">Política de privacidade</h1>
        <p>O MindBridge coleta apenas os dados necessários para acolhimento inicial e acompanhamento interno pela orientadora do Senac.</p>
        <p>Conversas podem ser sinalizadas quando houver indícios de risco, sempre com foco em encaminhamento humano e segurança. O sistema não realiza diagnósticos e não envia dados automaticamente a serviços externos.</p>
        <p>Dados identificados, quando informados, devem ser tratados conforme a LGPD, com acesso restrito, finalidade clara e retenção proporcional aos testes internos do MVP.</p>
      </article>
    </main>
  );
}
