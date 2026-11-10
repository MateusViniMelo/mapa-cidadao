# Mapas Sociais App

## Descrição

O **Mapas Sociais App** é uma aplicação web desenvolvida com Nuxt 3 para facilitar o reporte e visualização de ocorrências sociais em mapas interativos. O projeto permite aos usuários registrar, visualizar e gerenciar ocorrências em um mapa, utilizando geolocalização e autenticação de usuários.

## Funcionalidades

- **Autenticação de Usuários**: Login e registro de usuários.
- **Mapa Interativo**: Visualização de ocorrências em um mapa usando Leaflet.
- **Reportar Ocorrências**: Usuários podem criar e gerenciar suas próprias ocorrências.
- **Geolocalização Reversa**: Integração com API para obter endereços a partir de coordenadas.
- **Modo Escuro/Claro**: Alternância de tema com botão dedicado.
- **Páginas Principais**:
  - Página inicial com mapa.
  - Minhas Ocorrências: Lista de ocorrências do usuário.
  - Sobre: Informações sobre o projeto.

## Tecnologias Utilizadas

- **Nuxt 3**: Framework Vue.js para aplicações universais.
- **Vue 3**: Framework JavaScript progressivo.
- **TypeScript**: Superset tipado do JavaScript.
- **Leaflet**: Biblioteca para mapas interativos.
- **Pinia**: Gerenciamento de estado para Vue.js.
- **Tailwind CSS**: Framework CSS utilitário.
- **Flowbite**: Componentes UI baseados em Tailwind CSS.
- **Zod**: Validação de esquemas.
- **Axios**: Cliente HTTP para requisições API.

## Pré-requisitos

- Node.js 22 ou superior
- npm
- PostgreSQL com PostGIS (localmente, `docker compose up -d`)

## Instalação

1. Clone o repositório:
   ```bash
   cd mapas-sociais-app
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Copie `.env.example` para `.env` e ajuste as variáveis.

## Executando o Projeto

Para executar em modo de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

Para build de produção:
```bash
npm run build
```

Para preview da build:
```bash
npm run preview
```

## Estrutura do Projeto

- `components/`: Componentes Vue reutilizáveis (Navbar, Mapa, Modais, etc.).
- `pages/`: Páginas da aplicação (index, minhas-ocorrências, sobre).
- `composables/`: Funções composáveis para lógica reutilizável.
- `stores/`: Stores Pinia para gerenciamento de estado.
- `interfaces/`: Definições de tipos TypeScript.
- `services/`: Serviços para comunicação com APIs.
- `middleware/`: Middlewares para autenticação e outras lógicas.
- `server/api/`: APIs do lado servidor (ex: reverse geocoding).
- `assets/`: Arquivos estáticos (CSS, imagens).


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

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
