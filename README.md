# Amazon Price Advisor

Analizza i prezzi dei prodotti Amazon e suggerisce alternative migliori, tramite **Amazon Creators API**.

## Stack tecnologico

| Layer          | Tecnologia                                       |
| -------------- | ------------------------------------------------ |
| **Frontend**   | Vue 3 (Composition API) + Pinia + Vite           |
| **Styling**    | Tailwind CSS v4 (`@tailwindcss/vite`)            |
| **Backend**    | Node.js + Fastify                                |
| **Linguaggio** | TypeScript (end-to-end)                          |
| **API dati**   | Amazon Creators API                              |
| **Testing**    | Vitest + @vue/test-utils                         |
| **Linting**    | ESLint 9 + typescript-eslint + eslint-plugin-vue |
| **Formatting** | Prettier                                         |
| **Git hooks**  | Husky + lint-staged                              |

## Requisiti

- Node.js >= 20

## Setup

```bash
npm install
cp .env.example .env
```

## Script disponibili

| Comando                | Descrizione                           |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Avvia backend + frontend in parallelo |
| `npm run dev:client`   | Solo frontend Vite (porta 5173)       |
| `npm run dev:server`   | Solo backend Fastify (porta 3000)     |
| `npm run build`        | Type-check + build produzione         |
| `npm start`            | Avvio produzione                      |
| `npm test`             | Esegui test (Vitest)                  |
| `npm run typecheck`    | Type-check Vue + TS                   |
| `npm run lint`         | ESLint                                |
| `npm run lint:fix`     | ESLint con auto-fix                   |
| `npm run format`       | Formatta con Prettier                 |
| `npm run format:check` | Verifica formattazione                |

In sviluppo il frontend Vite (`5173`) fa proxy di `/api` verso Fastify (`3000`).

## Quality gates

Ogni commit viene automaticamente controllato da **Husky + lint-staged**:

- **ESLint** + auto-fix su file `.ts` e `.vue`
- **Prettier** su tutti i file staged

## TypeScript strict

Il progetto usa un `tsconfig.json` con regole strict rinforzate:

- `strict: true` (include `strictNullChecks`, `noImplicitAny`, ecc.)
- `noUncheckedIndexedAccess` — accesso sicuro a indici di array/oggetti
- `noImplicitOverride` — override esplicito nei metodi
- `noFallthroughCasesInSwitch` — nessun fallthrough involontario
- `verbatimModuleSyntax` — import/export type espliciti

## Struttura del progetto

```
├── index.html                    # Entry HTML (Vite)
├── vite.config.ts                # Vite + Vue + Tailwind v4
├── vitest.config.ts              # Configurazione test
├── eslint.config.mjs             # ESLint 9 flat config (type-checked)
├── .prettierrc                   # Configurazione Prettier
├── .editorconfig                 # Configurazione editor
├── tsconfig.json                 # TS config (root, strict)
├── tsconfig.app.json             # TS config (frontend)
├── tsconfig.server.json          # TS config (backend)
├── .env.example                  # Template env vars
├── .husky/pre-commit             # Git hook pre-commit
│
├── server/                       # Backend (Fastify)
│   ├── index.ts                  # Entry point server
│   ├── config.ts                 # Env vars
│   ├── routes/                   # Route API
│   │   ├── validate.ts           # POST /api/validate-link
│   │   ├── product.ts            # GET  /api/product/:asin
│   │   └── alternatives.ts       # GET  /api/alternatives/:asin
│   └── services/                 # Servizi business
│       ├── asin-extractor.ts     # Estrazione ASIN da URL
│       ├── creators-api-client.ts # Wrapper Amazon Creators API
│       ├── keyword-extractor.ts  # Estrazione keywords da titoli
│       ├── alternative-ranker.ts # Ranking alternative (score composito)
│       └── cache.ts              # Cache in-memory con TTL
│
├── src/                          # Frontend (Vue 3 + Pinia)
│   ├── main.ts                   # Bootstrap app
│   ├── App.vue                   # Root component
│   ├── env.d.ts                  # Tipi Vite/Vue
│   ├── assets/
│   │   └── main.css              # Tailwind v4 import
│   ├── components/               # Componenti Vue (da creare)
│   ├── stores/                   # Pinia stores (da creare)
│   ├── api/                      # API client
│   │   └── client.ts             # Fetch wrapper
│   └── utils/                    # Utility
│       └── asin-extractor.ts     # ASIN extractor (client-side)
│
└── tests/                        # Test (Vitest)
    ├── asin-extractor.test.ts
    ├── asin-extractor-server.test.ts
    ├── cache.test.ts
    ├── keyword-extractor.test.ts
    ├── product-route.test.ts
    ├── alternative-ranker.test.ts
    └── alternatives-route.test.ts
```

## Variabili d'ambiente

| Variabile                         | Descrizione                          |
| --------------------------------- | ------------------------------------ |
| `CREATORS_API_CREDENTIAL_ID`      | Credential ID dalla Creators API     |
| `CREATORS_API_CREDENTIAL_SECRET`  | Credential Secret                    |
| `CREATORS_API_CREDENTIAL_VERSION` | Versione credenziali (default: 1)    |
| `CREATORS_API_PARTNER_TAG`        | Tag affiliato Amazon Associates      |
| `CREATORS_API_MARKETPLACE`        | Marketplace (default: www.amazon.it) |
| `PORT`                            | Porta server (default: 3000)         |
