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

- Node.js (versão 16 ou superior)
- npm ou yarn

## Instalação

1. Clone o repositório:
   ```bash
   cd mapas-sociais-app
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente (se necessário):
   - Crie um arquivo `.env` na raiz do projeto e adicione as variáveis necessárias (ex: URLs de API).

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


## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).



# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
