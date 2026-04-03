# Te lo risparmio

Analizza i prezzi dei prodotti Amazon e scopri se stai facendo un buon affare, con suggerimenti di alternative migliori. Powered by **I consigli di nonna Pina** e **Amazon Creators API**.

## Funzionalità principali

- **Analisi prezzo a semaforo** — verdetto immediato (verde / giallo / rosso) basato sullo sconto rispetto al listino e sul confronto con le alternative di mercato
- **Ricerca alternative intelligente** — fino a 10 prodotti simili nella stessa categoria, classificati per rapporto qualità-prezzo, recensioni e rilevanza semantica
- **Supporto link brevi** — incolla qualsiasi formato di link Amazon (completi, amzn.to, amzn.eu, a.co, link condivisi da app)
- **Arricchimento recensioni** — se le API non forniscono il rating, il sistema lo recupera in automatico dalla pagina prodotto
- **Barra di confronto prezzi** — visualizzazione grafica del prezzo attuale vs media alternative vs alternativa più economica
- **Carousel alternative** — navigazione orizzontale tra le alternative suggerite con immagine, prezzo, rating e link affiliato
- **Dark mode** — tema chiaro/scuro con toggle animato e persistenza su `localStorage`
- **Pagina "Come funziona"** — guida interattiva con esempio di analisi (dati fittizi) e FAQ dettagliate
- **Analytics opzionali** — integrazione PostHog (EU) con rispetto del DNT e sanitizzazione URL
- **Accessibilità** — skip link, landmark semantici, contrasto AA, navigazione da tastiera, label ARIA, switch dark mode accessibile
- **Sicurezza** — CSP restrittivo, Helmet, rate limiting (30 req/min), validazione ASIN anti-SSRF, CORS configurabile

## Stack tecnologico

| Layer          | Tecnologia                                       |
| -------------- | ------------------------------------------------ |
| **Frontend**   | Vue 3 (Composition API) + Pinia + Vue Router     |
| **Styling**    | Tailwind CSS v4 (`@tailwindcss/vite`)            |
| **Animazioni** | Lottie (`vue3-lottie` + `lottie-web`)            |
| **Backend**    | Node.js + Fastify 5                              |
| **Linguaggio** | TypeScript (end-to-end, strict)                  |
| **API dati**   | Amazon Creators API (`amazon-creators-api`)      |
| **Analytics**  | PostHog (opzionale, EU hosting)                  |
| **Testing**    | Vitest + @vue/test-utils                         |
| **Linting**    | ESLint 9 + typescript-eslint + eslint-plugin-vue |
| **Formatting** | Prettier                                         |
| **Git hooks**  | Husky + lint-staged                              |
| **Deploy**     | Docker (multi-stage) / Render / Railway / Fly.io |

## Requisiti

- Node.js >= 20

## Setup

```bash
npm install
cp .env.example .env
# Compila le variabili in .env con le credenziali Amazon Creators API
```

## Script disponibili

| Comando                | Descrizione                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Avvia backend + frontend in parallelo    |
| `npm run dev:client`   | Solo frontend Vite (porta 5173)          |
| `npm run dev:server`   | Solo backend Fastify (porta 3000)        |
| `npm run build`        | Type-check + build produzione (completo) |
| `npm run build:client` | Solo build frontend                      |
| `npm start`            | Avvio produzione                         |
| `npm test`             | Esegui test (Vitest)                     |
| `npm run test:watch`   | Test in modalità watch                   |
| `npm run typecheck`    | Type-check Vue + TS                      |
| `npm run lint`         | ESLint                                   |
| `npm run lint:fix`     | ESLint con auto-fix                      |
| `npm run format`       | Formatta con Prettier                    |
| `npm run format:check` | Verifica formattazione                   |

In sviluppo il frontend Vite (`5173`) fa proxy di `/api` verso Fastify (`3000`).

## API endpoints

| Metodo | Endpoint                  | Descrizione                                            |
| ------ | ------------------------- | ------------------------------------------------------ |
| POST   | `/api/validate-link`      | Valida un link Amazon ed estrae l'ASIN                 |
| GET    | `/api/product/:asin`      | Recupera dettagli prodotto + keywords + link affiliato |
| GET    | `/api/alternatives/:asin` | Cerca e classifica fino a 10 alternative               |
| GET    | `/api/health`             | Health check                                           |

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
├── index.html                     # Entry HTML (Vite) + CSP + meta SEO
├── Dockerfile                     # Build multi-stage (Node 20 Alpine)
├── vite.config.ts                 # Vite + Vue + Tailwind v4 + proxy API
├── vitest.config.ts               # Configurazione test
├── eslint.config.mjs              # ESLint 9 flat config (type-checked)
├── tsconfig.json                  # TS config (root, strict)
├── tsconfig.app.json              # TS config (frontend)
├── tsconfig.server.json           # TS config (backend)
├── .env.example                   # Template variabili d'ambiente
│
├── server/                        # Backend (Fastify 5)
│   ├── index.ts                   # Entry point + Helmet + CORS + rate limit
│   ├── config.ts                  # Configurazione da env vars
│   ├── routes/
│   │   ├── validate.ts            # POST /api/validate-link
│   │   ├── product.ts             # GET  /api/product/:asin
│   │   └── alternatives.ts        # GET  /api/alternatives/:asin
│   └── services/
│       ├── asin-extractor.ts      # Estrazione ASIN da URL (+ short link)
│       ├── creators-api-client.ts # Wrapper Amazon Creators API
│       ├── keyword-extractor.ts   # Estrazione keywords/query da titolo
│       ├── alternative-ranker.ts  # Ranking composito (prezzo, rating, recensioni, rilevanza)
│       ├── relevance-filter.ts    # Filtro rilevanza semantica (Jaccard + core tokens)
│       ├── review-enricher.ts     # Arricchimento rating da pagina prodotto
│       ├── review-scraper.ts      # Scraping recensioni da amazon.it
│       ├── affiliate-builder.ts   # Costruzione link affiliati canonici
│       ├── price-evaluator.ts     # Logica semaforo (verde/giallo/rosso)
│       └── cache.ts               # Cache in-memory con TTL
│
├── src/                           # Frontend (Vue 3 + Pinia)
│   ├── main.ts                    # Bootstrap app + Pinia + Router + PostHog
│   ├── App.vue                    # Root: skip link + nav + router-view + footer
│   ├── env.d.ts                   # Tipi Vite/Vue
│   ├── assets/
│   │   ├── main.css               # Tailwind v4 import
│   │   ├── images/                # Logo SVG (light/dark)
│   │   └── animation/             # Lottie JSON
│   ├── api/
│   │   └── client.ts              # Fetch wrapper con gestione errori
│   ├── components/
│   │   ├── AppNav.vue             # Navbar: brand, navigazione, toggle dark mode
│   │   ├── AppFooter.vue          # Footer: social "I consigli di nonna Pina" + disclaimer affiliazione
│   │   ├── UrlInput.vue           # Input URL con validazione live
│   │   ├── LoadingState.vue       # Stato di caricamento animato (Lottie)
│   │   ├── ResultView.vue         # Vista risultato completa
│   │   ├── ProductCard.vue        # Card prodotto (immagine, prezzo, rating, sconto)
│   │   ├── TrafficLight.vue       # Semaforo prezzo + barre confronto
│   │   ├── AlternativesCarousel.vue # Carousel alternative scorrevole
│   │   ├── StarRating.vue         # Stelle rating accessibili
│   │   ├── ErrorState.vue         # Stato errore con retry
│   │   └── FaqSection.vue         # FAQ accordion accessibile
│   ├── composables/
│   │   ├── useAnalytics.ts        # Wrapper PostHog (no-op se disattivato)
│   │   ├── useDarkMode.ts         # Dark mode con persistenza
│   │   └── useUrlValidation.ts    # Validazione URL + estrazione ASIN client-side
│   ├── plugins/
│   │   └── posthog.ts             # Plugin PostHog (EU, DNT, sanitizzazione)
│   ├── router/
│   │   └── index.ts               # Vue Router: / (Home) + /come-funziona
│   ├── stores/
│   │   └── analysis.ts            # Pinia store: flusso analisi completo
│   ├── types/
│   │   └── analysis.ts            # Interfacce condivise (Product, Alternative, Evaluation)
│   └── utils/
│       ├── asin-extractor.ts      # ASIN extractor (client-side)
│       └── price-evaluator.ts     # Logica semaforo (client-side)
│
├── scripts/
│   └── build-server.mjs           # Script build backend
│
└── tests/                         # Test (Vitest)
    ├── asin-extractor.test.ts
    ├── asin-extractor-server.test.ts
    ├── cache.test.ts
    ├── keyword-extractor.test.ts
    ├── product-route.test.ts
    ├── alternative-ranker.test.ts
    ├── alternatives-route.test.ts
    ├── affiliate-builder.test.ts
    ├── relevance-filter.test.ts
    ├── price-evaluator.test.ts
    └── use-analytics.test.ts
```

## Variabili d'ambiente

| Variabile                         | Descrizione                                     |
| --------------------------------- | ----------------------------------------------- |
| `CREATORS_API_CREDENTIAL_ID`      | Credential ID dalla Creators API                |
| `CREATORS_API_CREDENTIAL_SECRET`  | Credential Secret                               |
| `CREATORS_API_CREDENTIAL_VERSION` | Versione credenziali (default: `1`)             |
| `CREATORS_API_PARTNER_TAG`        | Tag affiliato Amazon Associates                 |
| `CREATORS_API_MARKETPLACE`        | Marketplace (default: `www.amazon.it`)          |
| `PORT`                            | Porta server (default: `3000`)                  |
| `NODE_ENV`                        | Ambiente (`development` / `production`)         |
| `CORS_ORIGINS`                    | Origini consentite, separate da virgola         |
| `VITE_API_BASE_URL`               | URL base API per il frontend (vuoto in dev)     |
| `VITE_POSTHOG_KEY`                | Chiave PostHog (opzionale, disabilita se vuota) |

## Docker

Build e avvio con Docker (multi-stage, Node 20 Alpine, utente non-root):

```bash
docker build -t te-lo-risparmio .
docker run -p 3000:3000 --env-file .env te-lo-risparmio
```

## Logica del semaforo

Il verdetto si basa su due segnali combinati:

1. **Sconto rispetto al listino** — percentuale di risparmio rispetto al prezzo originale dichiarato da Amazon
2. **Confronto con le alternative** — percentuale di differenza rispetto alla media dei prezzi delle alternative nella stessa categoria

| Colore     | Condizione                                                                  |
| ---------- | --------------------------------------------------------------------------- |
| **Verde**  | Sconto >= 20% e non più caro delle alternative, oppure >= 15% più economico |
| **Rosso**  | Nessuno sconto significativo e >= 10% più caro delle alternative            |
| **Giallo** | Tutto il resto                                                              |

## Ranking delle alternative

Le alternative vengono cercate nella stessa categoria merceologica tramite keywords estratte dal titolo. Il ranking composito considera:

- Rating in stelle
- Numero di recensioni
- Rapporto qualità-prezzo
- Rilevanza semantica (Jaccard similarity + core token overlap)

Vengono mostrate le migliori 10 dopo il filtro di rilevanza.
