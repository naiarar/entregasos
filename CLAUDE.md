# EntregaSOS — instruções para Claude Code

Mini-projeto de portfólio da Naiara aplicando o cronograma de estudos 2026: NestJS, Prisma, Postgres+Mongo, Next.js, WebSocket, Deck.gl/MapLibre, React Native, Jest, Sentry, Git Worktree.

> Quando entrar nessa sessão, leia este arquivo + os arquivos da pasta `memory/` (índice em `MEMORY.md`) antes de propor qualquer mudança. **Não re-litigue decisões já cravadas** — confirme antes de mudar.

## Idioma
Toda comunicação em **português (pt-BR)**. Naiara prefere análises detalhadas mas com fechamento prático (deltas concretos > discussões abertas).

## Estilo de código
- **Nunca adicionar comentários** ao código a menos que ela peça explicitamente.
- Não adicionar docstrings, anotações inline, ou explicações em código sem solicitação.

## O produto em uma frase
SaaS multitenant de gestão de frota própria multimodal (bike/moto/carro) para SMB brasileiro — farmácia, pet shop, restaurante de bairro com 5-15 entregadores próprios que hoje opera com Excel + WhatsApp.

**Persona primária:** Dono-operador do SMB (Dona Cláudia, Farmácia Vida Leve, 6 motoboys + 2 ciclistas).
**Persona secundária:** Entregador (Lucas, 22, usa só o app RN).

**JTBD:** "Quando entram 8 pedidos no pico, eu quero saber em 5s quem pega o quê e onde cada um está, para parar de atender no balcão com o celular na mão."

## Stack alinhada ao cronograma
- Backend: NestJS 10 (monolito modular)
- DB transacional: PostgreSQL + Prisma (schema em `prisma/schema.prisma` na raiz)
- Telemetria GPS: MongoDB (`position_events`, TTL 7d)
- Tempo real: WebSocket Gateway (Socket.IO)
- Frontend (a criar): Next.js + Mantine + Tailwind + Deck.gl + MapLibre
- Mobile (a criar): React Native (só app do entregador)
- Testes: Jest
- Observabilidade: Sentry (tag `tenantId`)
- IA dev: Claude Code

## Estrutura monorepo (pnpm workspaces)
```
entregasos/
├── apps/
│   ├── api/          # NestJS — implementado (mínimo: /health)
│   ├── web/          # Next.js — a criar
│   └── mobile/       # React Native — a criar
├── packages/
│   └── shared/       # enums + schemas Zod (single source of truth)
├── prisma/           # schema.prisma na raiz
├── docs/
├── .github/workflows/ci.yml
└── docker-compose.yml
```

## Decisões cravadas (não re-litigue)

### Roles
`GENERAL_ADMIN` (plataforma) · `ADMIN` (dono tenant) · `DISPATCHER` · `DRIVER`. Cliente final tem link público de tracking, sem login.

### Multitenancy
- Row-level: `tenantId` NOT NULL em toda tabela
- JWT carrega `{ sub, tenantId, role, driverId? }` — `tenantId` nullable só pra GENERAL_ADMIN
- Prisma middleware injeta `where: { tenantId }` via AsyncLocalStorage (`nestjs-cls`)
- Módulo `/admin/*` isolado com `PrismaAdminService` SEPARADO (sem middleware) — linha física entre tenant-safe e admin-raw
- Cross-tenant access retorna **404, nunca 403** (não vaza existência)
- WebSocket rooms: `tenant:${tenantId}:fleet` / `tenant:${tenantId}:driver:${driverId}`

### Schema (Postgres)
- **Address** (tabela própria, 1:1 com Tenant; reutilizável em Delivery)
- **Tenant**: name, cnpj, legalName, responsibleName, **responsibleCpf (AES-256-GCM)**, cpfLast2, addressId, logoUrl?, primaryColor?, secondaryColor?
- **User**: status `PENDING_ACTIVATION/ACTIVE/DISABLED`, passwordHash nullable até ativação
- **Driver**: vehicleType {BIKE/MOTO/CAR}, vehicleOwnership {OWN/RENTED/COMPANY} — **informativo apenas**, sem campos extras
- **Invite**: tokenHash SHA-256, TTL 72h, single-use
- **AuditLog**: ações de GENERAL_ADMIN

### Segurança LGPD
- CPF criptografado em repouso (AES-256-GCM via `CPF_ENCRYPTION_KEY` env)
- CPF **nunca retornado plano** — interceptor global mascara como `***.***.***-XX` usando `cpfLast2`, inclusive pro GA
- CNPJ é público, plano OK
- Validação de docs: lib `cpf-cnpj-validator` (não reimplementar mod 11)

### White label (feature do produto)
- Logo PNG/JPEG até 1MB — **SVG bloqueado** (XSS)
- Cor primária + secundária (hex `#RRGGBB`)
- Storage: Cloudflare R2 (S3-compatible)
- Theming runtime: Mantine + `colord` pra gerar 10 shades
- Tenant resolution: **JWT-only** (sem subdomain, sem path)
- **Anti-flash crítico**: branding entregue server-side no primeiro render autenticado (`/me/branding` no `(dashboard)/layout.tsx`)
- Login fica em tema neutro

### Onboarding (convite + ativação)
1. GA cadastra Tenant + branding + dados do responsável
2. Sistema cria User ADMIN PENDING + Invite (token, TTL 72h)
3. Email via **Resend** → ADMIN abre link `/activate?token=...`
4. ADMIN define senha → status ACTIVE → cai no dashboard COM BRANDING aplicado

### CI/CD
- `.github/workflows/ci.yml` com lint + typecheck (Node 22, pnpm 9)
- Coverage gate: `{branches:70, functions:75, lines:80, statements:80}` quando testes existirem (Sem 13)
- Branch protection na `main` (lint/typecheck/test/build verdes)
- Sem CD automático no MVP

## Onde NÃO complicar (acordado com Winston/Architect)
- Sem microsserviços (monolito modular)
- Sem event sourcing (Mongo append-only basta)
- Sem multi-region / k8s
- Sem Turborepo/Nx (pnpm workspaces puro)
- Sem `packages/ui` (RN e Web não compartilham componente)
- Sem fonte custom / CSS arbitrário / favicon dinâmico por tenant
- Sem SVG no upload (XSS)
- Sem SSO / 2FA / múltiplos ADMINS por tenant / import CSV
- Sem subdomain por tenant
- Sem tour de onboarding pós-ativação (CTA direto pra `/drivers/new`)
- Sem `CompanyVehicle` separada (ownership é só enum)
- Sem geocoding/lat-lng no Address do tenant — só na entrega

## Telas web já desenhadas (a implementar)
- `/admin/tenants/new` — GA cadastra cliente (4 seções: fiscal, endereço, responsável legal, identidade visual com preview ao vivo)
- `/admin/tenants` — lista de clientes
- `/(dashboard)/drivers/new` — ADMIN cadastra entregador (tela única estilo WhatsApp; cards grandes pra vehicle type)
- `/(public)/activate?token=` — landing pública de ativação
- `/(public)/t/[token]` — tracking público pro cliente final

## Testes críticos no CI (bloqueiam merge)
- `tenant-isolation.spec.ts` · `general-admin-crosstenant.spec.ts` · `cpf-encryption.spec.ts` · `cpf-masking.spec.ts` · `ws-tenant-room.spec.ts` · `address-1to1.spec.ts` · `activate.e2e-spec.ts` · `tenants-branding.e2e-spec.ts` · `invite-token-hashing.spec.ts`

## Estado atual da implementação
**Concluído** (branch `EOS-001`):
- Monorepo pnpm workspaces (apps/api + packages/shared)
- NestJS 10 com `/health`
- packages/shared com enums e schemas Zod (Address, Tenant, Driver)
- `prisma/schema.prisma` com modelos completos
- docker-compose (Postgres 16 + Mongo 7) — containers healthy
- CI GitHub Actions (lint + typecheck)
- `.env` com secrets gerados (gitignored)
- Bug Prisma P1010 destravado (conflito de porta com brew Postgres 17 — Docker movido pra 5433). Migration `20260518234003_init` criada (7 tabelas).

**Concluído** (branch `EOS-002` — Semana 2 do cronograma):
- ✅ Módulo `auth` com JWT + RBAC (Roles `GENERAL_ADMIN/ADMIN/DISPATCHER/DRIVER`)
- ✅ Prisma tenant middleware via `nestjs-cls` (AsyncLocalStorage injeta `where: { tenantId }`)
- ✅ Setup Jest

**Pendências críticas:**
1. 🎨 **Branding pendente** — tagline + paleta + logo direction pra EntregaSOS (a tagline "Levou? Levou." era do nome anterior descartado).

**Próximos passos sugeridos:**
- Módulo `tenants` + `/admin/tenants/new` (Semana 3-4) → próxima branch `EOS-003`
- Implementar `PrismaAdminService` isolado (linha física entre tenant-safe e admin-raw)
- Cobertura dos testes críticos: `tenant-isolation.spec.ts`, `general-admin-crosstenant.spec.ts`, `cpf-encryption.spec.ts`

## Como rodar localmente
```bash
pnpm install
cp .env.example .env   # se não tiver
pnpm db:up             # sobe Postgres (porta 5433) + Mongo
pnpm db:migrate        # ✅ funciona
pnpm dev:api           # NestJS em http://localhost:3333
```

## Memória adicional
Arquivos em [`memory/`](memory/) (não vai pro git — config pessoal):
- `MEMORY.md` — índice
- `project_entregasos.md` — visão geral, persona, JTBD, telas, branding, onboarding
- `project_entregasos_architecture.md` — schema completo, multitenancy, white label runtime, invite flow, CI, env vars
- `user_naiara_profile.md` — perfil de aprendizado, cronograma 2026, preferências

## Convenções de branch e commit
- `main` — sempre verde
- `develop` — integração
- `EOS-XXX` — feature branches (XXX = número incremental tipo story/ticket)
- Commits: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
