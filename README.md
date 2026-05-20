# MindBridge

MVP web para testes internos no Senac. O MindBridge oferece acolhimento inicial, escuta segura e encaminhamento para apoio humano, sem diagnóstico e sem substituir atendimento psicológico, psiquiátrico, médico ou emergencial.

## Stack

- Frontend: Next.js, TailwindCSS, Framer Motion
- Backend: Node.js, Express, JWT, Socket.IO
- Banco: PostgreSQL

## Executar

```bash
npm install
cp backend/.env.example backend/.env
npm run dev
```

Frontend: `http://localhost:3000`

Backend: `http://localhost:4000`

Sem `DATABASE_URL`, o backend usa armazenamento em memória para demonstração local. Para persistência, configure PostgreSQL e rode o schema em `backend/src/db/schema.sql`.

## Login da orientadora

Defina no `backend/.env`:

```env
ADMIN_EMAIL=orientadora@senac.br
ADMIN_PASSWORD=MindBridge@2026
JWT_SECRET=troque-este-segredo
DATABASE_URL=postgres://usuario:senha@localhost:5432/mindbridge
```

## Responsabilidade

O MindBridge não realiza diagnósticos e não envia dados automaticamente ao CVV. Em risco imediato, a interface exibe contatos oficiais: CVV 188, SAMU 192 e Bombeiros 193.
