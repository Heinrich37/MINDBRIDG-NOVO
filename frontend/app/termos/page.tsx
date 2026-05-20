import { Logo } from "@/components/Logo";

export default function TermsPage() {
  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-3xl"><Logo /></div>
      <article className="glass mx-auto mt-8 max-w-3xl space-y-5 rounded-[2rem] p-6 leading-7 md:p-8">
        <h1 className="text-3xl font-semibold">Termos de uso</h1>
        <p>O MindBridge é um MVP de acolhimento inicial para testes internos no Senac. Ele não substitui psicólogo, psiquiatra, médico, CVV ou emergência.</p>
        <p>Ao usar a plataforma, você entende que conversas podem ser encaminhadas para a orientadora quando houver necessidade de acompanhamento institucional.</p>
        <p>Em risco imediato, procure ajuda humana: CVV 188, SAMU 192 ou Bombeiros 193. Buscar ajuda é um ato de coragem.</p>
      </article>
    </main>
  );
}
