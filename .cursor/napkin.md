# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-11-09] Scripts do Prisma 7 ficam bloqueados no install**
   Do instead: se o aviso `install-scripts` listar `prisma` e `@prisma/engines`, aprove só esses dois e rode `npm rebuild prisma @prisma/engines`. Não rode `npm audit fix --force`.
2. **[2026-11-09] `sharp` quebra sem o script de instalação**
   Do instead: aprovar com `npm install-scripts approve sharp` e, se o pacote já estiver em `node_modules`, rodar `npm rebuild sharp`. `esbuild`, `@tailwindcss/oxide` e `@parcel/watcher` podem já funcionar.

## Shell & Command Reliability
1. **[2026-11-09] `npm install prisma` instala o ORM 8, ainda release candidate**
   Do instead: fixar a major 7 (`prisma@7` e `@prisma/client@7`). O CLI 8 não lê `schema.prisma` e não tem `generate` nem `migrate dev`.
2. **[2026-11-09] Vitest 5 exige Vite `^6.4`**
   Do instead: instalar `vitest@4.1.12`. O Nuxt deste repo está no Vite 6.3 e o 5 não resolve.
3. **[2026-11-09] `env("DATABASE_URL")` derruba o CLI mesmo sem banco**
   Do instead: passar `DATABASE_URL=postgresql://mapa_cidadao:mapa_cidadao@localhost:5432/mapa_cidadao` só no comando de `prisma generate`. Não exportar essa URL na sessão do vitest: o config recusa qualquer banco que não seja `mapa_cidadao_test`.

## Domain Behavior Guardrails
1. **[2026-11-09] `useToast()` no store criado pelo plugin não desenha o toast**
   Do instead: gravar direto em `useState("toasts")` dentro da ação de login e de cadastro. A fila do `useToast()` capturada no setup do plugin não chega no `UApp`.
2. **[2026-11-09] PostGIS deixa o `public` não vazio e o deploy responde P3005**
   Do instead: no banco `mapa_cidadao_test`, se `prisma migrate deploy` devolver P3005, apagar só o schema `public`, recriar e repetir o deploy. Não fazer isso em `mapa_cidadao`.
3. **[2026-11-09] `h3` 1.15.3 não exporta `callHandler`**
   Do instead: montar o evento com `createEvent` do h3 e chamar o handler real. Não subir `nuxt dev`.
4. **[2026-11-09] `date_birth` no fuso local vira o dia anterior**
   Do instead: gravar `YYYY-MM-DDT00:00:00.000Z` e serializar com `toISOString().slice(0, 10)`. Não usar `getDate()` local.
5. **[2026-11-09] Coordenada da ocorrência é GeoJSON nos dois sentidos**
   Do instead: pedido e resposta usam `[longitude, latitude]`. O par de prova é `[-46.633308, -23.55052]`. `toRequestCoordinates(latitude, longitude)` devolve esse par. O marcador lê `coordinates[1]`, `coordinates[0]`.
6. **[2026-11-09] `npm audit fix --force` no Nuxt**
   Do instead: tratar as dezenas de avisos de auditoria como dependências transitivas. Não rodar `--force` sem revisar o que seria rebaixado.

## User Directives
1. **[2026-11-09] Interface só com o Nuxt UI**
   Do instead: não reinstalar o Flowbite nem importar o plugin dele no Tailwind. O menu mobile abre por estado Vue em `components/layout/Navbar.vue`.
2. **[2026-11-09] Responder em português**
   Do instead: toda resposta ao usuário neste repositório em português.
