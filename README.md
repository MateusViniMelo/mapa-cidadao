# Mapa Cidadão

Aplicação web em Nuxt 3 para registrar e acompanhar problemas da cidade no mapa: iluminação, pavimentação, alagamento e lixo. Quem tem 18 anos ou mais cria uma conta, marca o ponto e outras pessoas podem ver e confirmar a ocorrência.

## Funcionalidades

- Cadastro e login com sessão em cookie HttpOnly. O e-mail é gravado em minúsculas.
- Mapa com MapLibre. Com `NUXT_PUBLIC_CARTO_API_KEY`, os tiles vêm da CARTO; sem a chave, o mapa usa o OpenStreetMap.
- Criação de ocorrência no clique do mapa, com endereço obtido no Nominatim.
- Curtida e encerramento da própria ocorrência.
- Lista em Minhas Ocorrências (`/my-occurrences`).
- Tema claro e escuro.
- Páginas: início (`/`), sobre (`/sobre`) e minhas ocorrências.

Os cinco tipos gravados no seed são Problema de Iluminação, Problema de Pavimentação, Alagamento, Acúmulo de Lixo e Falta de Pavimentação.

## Tecnologias

- Nuxt 3, Vue 3 e TypeScript
- Nuxt UI 3 e Tailwind CSS
- Pinia
- MapLibre (`nuxt-maplibre`)
- Prisma 7 com PostgreSQL e PostGIS
- Zod
- Vitest

## Pré-requisitos

- Node.js 22 ou superior
- npm
- Docker, para o Postgres local com PostGIS

## Instalação

1. Copie o ambiente antes de instalar. O `postinstall` gera o Prisma Client e o CLI lê essas variáveis:

   ```bash
   cp .env.example .env
   npm install
   ```

2. Suba o banco. O Compose cria `mapa_cidadao` e `mapa_cidadao_test`:

   ```bash
   docker compose up -d
   ```

3. Aplique as migrations e grave os tipos de ocorrência:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

A aplicação fica em `http://localhost:3000`.

O seed de produção grava só os cinco tipos. Usuários e ocorrências de Belém e Ananindeua entram apenas no banco de teste:

```bash
npm run db:seed:test
```

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build do Nuxt |
| `npm run preview` | Preview da build |
| `npx vitest run` | Testes. Exigem o Postgres local; o Vitest só aceita o banco `mapa_cidadao_test` |
| `npm run db:seed:test` | Fixtures locais em `mapa_cidadao_test` |

## Estrutura

- `components/`: mapa, autenticação e layout.
- `pages/`: `index.vue`, `sobre.vue` e `my-occurrences.vue`.
- `composables/` e `stores/`: lógica de cliente e estado Pinia.
- `server/api/`: rotas Nitro.
- `server/domain/`: autenticação, ocorrências e geocodificação.
- `prisma/`: schema, migrations e seeds.
- `validators/`, `interfaces/` e `utils/`: contratos compartilhados.
- `test/`: testes Vitest.

A coordenada da ocorrência trafega como GeoJSON: `[longitude, latitude]`.

## Deploy na Vercel

O build de produção é o script `vercel-build`: ele aplica as migrations, faz o seed dos tipos de ocorrência e roda `nuxt build`. A Vercel usa esse script no lugar de `build`. O runtime é Node.js 22 (`.node-version`). As functions ficam em `pdx1`, ao lado do Postgres do projeto Supabase `mapa-cidadao` (`us-west-2`).

O banco precisa de PostGIS. Crie o banco vazio e não instale a extensão antes: a primeira migration cria a extensão. Se o schema `public` já tiver objetos, `prisma migrate deploy` responde P3005.

No Supabase, use o host do pooler (`aws-0-us-west-2.pooler.supabase.com`), que tem IPv4. O host `db.<ref>.supabase.co` é só IPv6 e o build da Vercel não alcança.

Variáveis no projeto da Vercel (Production e Preview):

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Pooler em modo transaction, porta `6543`, com `sslmode=require`. A aplicação usa esta URL. |
| `DIRECT_URL` | Pooler em modo session, porta `5432`, com `sslmode=require`. Migrations e seed usam esta URL. |
| `NUXT_PUBLIC_CARTO_API_KEY` | Opcional. Sem ela, o mapa usa o OpenStreetMap. |

Localmente as duas URLs podem ser iguais. No Neon, o par é o mesmo: URL com `-pooler` na `DATABASE_URL` e URL direta na `DIRECT_URL`.

A migration `20261110173000_enable_rls` liga RLS nas tabelas do `public`. Sem policies, a Data API do Supabase fica fechada. O Prisma segue acessando pelo papel dono da tabela, que o Postgres isenta do RLS.
