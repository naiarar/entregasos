# EntregaSOS

SaaS multitenant de gestão de frota própria multimodal (bike, moto, carro) para SMB brasileiro — farmácia, pet shop, restaurante de bairro com motoboy/ciclista próprio.

## Stack

- **Backend:** NestJS + Prisma + PostgreSQL + MongoDB + WebSocket
- **Frontend Web:** Next.js + Mantine + Tailwind + Deck.gl + MapLibre
- **Mobile:** React Native (Expo) — app do entregador
- **Observabilidade:** Sentry
- **Testes:** Jest

## Estrutura (monorepo pnpm workspaces)

```
entregasos/
├── apps/
│   ├── api/          # NestJS
│   ├── web/          # Next.js (a criar)
│   └── mobile/       # React Native (a criar)
├── packages/
│   └── shared/       # tipos, enums, schemas Zod
├── prisma/           # schema único na raiz
└── docs/
```

## Pré-requisitos

- Node 22+
- pnpm 9+
- Docker (Postgres + Mongo locais via Compose)

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm db:migrate
pnpm dev:api
```

## Scripts úteis

| Comando | O que faz |
|---|---|
| `pnpm lint` | Lint em todos os workspaces |
| `pnpm typecheck` | Type-check em todos os workspaces |
| `pnpm test` | Testes em todos os workspaces |
| `pnpm db:up` | Sobe Postgres + Mongo via Docker Compose |
| `pnpm db:down` | Derruba containers |
| `pnpm db:migrate` | Roda migrations Prisma em dev |
| `pnpm dev:api` | Inicia o backend NestJS em modo dev |
