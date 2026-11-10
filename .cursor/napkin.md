# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-11-10] Deploy na Vercel usa `vercel-build`**
   Do instead: deixar a Vercel rodar `prisma migrate deploy && prisma db seed && nuxt build`. `DATABASE_URL` é a URL do pooler; `DIRECT_URL` é a URL direta. Não apontar o migrate para o pooler.
2. **[2026-11-09] Scripts do Prisma 7 ficam bloqueados no install**
   Do instead: se o aviso `install-scripts` listar `prisma` e `@prisma/engines`, aprove só esses dois e rode `npm rebuild prisma @prisma/engines`. Não rode `npm audit fix --force`.
3. **[2026-11-09] `sharp` quebra sem o script de instalação**
   Do instead: aprovar com `npm install-scripts approve sharp` e, se o pacote já estiver em `node_modules`, rodar `npm rebuild sharp`. `esbuild`, `@tailwindcss/oxide` e `@parcel/watcher` podem já funcionar.

## Shell & Command Reliability
1. **[2026-11-09] `npm install prisma` instala o ORM 8, ainda release candidate**
   Do instead: fixar a major 7 (`prisma@7` e `@prisma/client@7`). O CLI 8 não lê `schema.prisma` e não tem `generate` nem `migrate dev`.
2. **[2026-11-09] Vitest 5 exige Vite `^6.4`**
   Do instead: instalar `vitest@4.1.12`. O Nuxt deste repo está no Vite 6.3 e o 5 não resolve.
3. **[2026-11-09] `env("DATABASE_URL")` derruba o CLI mesmo sem banco**
   Do instead: passar `DATABASE_URL=postgresql://mapa_cidadao:mapa_cidadao@localhost:5432/mapa_cidadao` só no comando de `prisma generate`. O `prisma.config.ts` prefere `DIRECT_URL`. No reset de teste, gravar as duas com a URL de `mapa_cidadao_test`. Não exportar a URL de desenvolvimento na sessão do vitest.

## Domain Behavior Guardrails
1. **[2026-11-10] Supabase `mapa-cidadao` usa o pooler e o PostGIS nasce na migration**
   Do instead: autenticar `plugin-supabase-supabase` com `mcp_auth`. Projeto `tlkexuwxmkdhllmsxxxl`. `DATABASE_URL` no pooler transaction porta `6543`; `DIRECT_URL` no session porta `5432`; as duas com `sslmode=require`. Não criar PostGIS antes do `prisma migrate deploy`: a migration `init` instala no schema `public`. Em `pgPoolConfig`, tirar `sslmode` da URL antes de passar ao `pg`, senão o `require` vira `verify-full` e apaga `rejectUnauthorized: false`.
2. **[2026-11-10] Tiles da CARTO exigem API key**
   Do instead: guardar a chave em `NUXT_PUBLIC_CARTO_API_KEY` no `.env`. A URL é `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=`. Sem a variável, o mapa usa o OpenStreetMap.
3. **[2026-11-10] CSS virtual do `@nuxt/fonts` responde 404 JSON no dev**
   Do instead: deixar `ui.fonts: false` e não listar `@nuxt/fonts` em `modules`. O CSS global fica vazio e o Vite devolve `application/json`.
4. **[2026-11-10] `UModal` fora do `UApp` não acha o locale**
   Do instead: em `app.vue`, o `<UApp>` envolve `<NuxtLayout>`, não só `<NuxtPage>`.
5. **[2026-11-10] Visitante anônimo dispara 401 em `/api/user/me`**
   Do instead: no servidor, só chamar a rota se o cookie `auth_token` tiver valor. No cliente com SSR, reutilizar o usuário já hidratado no Pinia.
6. **[2026-11-09] `useToast()` no store criado pelo plugin não desenha o toast**
   Do instead: gravar direto em `useState("toasts")` dentro da ação de login e de cadastro. A fila do `useToast()` capturada no setup do plugin não chega no `UApp`.
7. **[2026-11-09] PostGIS deixa o `public` não vazio e o deploy responde P3005**
   Do instead: no banco `mapa_cidadao_test`, se `prisma migrate deploy` devolver P3005, apagar só o schema `public`, recriar e repetir o deploy. No Postgres de produção, criar o banco vazio e deixar a migration instalar o PostGIS. Não apagar o schema `public` de produção.
8. **[2026-11-09] `h3` 1.15.3 não exporta `callHandler`**
   Do instead: montar o evento com `createEvent` do h3 e chamar o handler real. Não subir `nuxt dev`.
9. **[2026-11-09] `date_birth` no fuso local vira o dia anterior**
   Do instead: gravar `YYYY-MM-DDT00:00:00.000Z` e serializar com `toISOString().slice(0, 10)`. Não usar `getDate()` local.
10. **[2026-11-09] Coordenada da ocorrência é GeoJSON nos dois sentidos**
   Do instead: pedido e resposta usam `[longitude, latitude]`. O par de prova é `[-46.633308, -23.55052]`. `toRequestCoordinates(latitude, longitude)` devolve esse par. O marcador lê `coordinates[1]`, `coordinates[0]`.

## User Directives
1. **[2026-11-10] Navbar com os componentes do Nuxt UI 3**
   Do instead: usar `UNavigationMenu` em `components/layout/Navbar.vue`. `UHeader` só existe no Nuxt UI 4, que exige Nuxt 4. Não reinstalar o Flowbite.
2. **[2026-11-09] Responder em português**
   Do instead: toda resposta ao usuário neste repositório em português.
