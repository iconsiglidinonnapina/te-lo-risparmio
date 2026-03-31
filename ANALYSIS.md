# Amazon Price Advisor — Analisi Funzionale e Tecnica

> **Vincolo architetturale:** flusso interamente basato su **Amazon Creators API**.
> Nessuno scraping, nessuna dipendenza esterna (Keepa, CamelCamelCamel).
> Zero Playwright/Puppeteer. Deploy leggero su qualsiasi hosting (anche 128MB RAM).

---

## 1. Architettura di Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                        │
│  HTML/CSS/JS vanilla (o Vite per DX)                    │
│  Stati: INPUT → LOADING → RESULT                        │
└──────────────────────┬──────────────────────────────────┘
                       │ fetch /api/*
┌──────────────────────▼──────────────────────────────────┐
│                 BACKEND (Node.js / Fastify)              │
│                                                          │
│  /api/validate-link    → estrae ASIN, valida formato     │
│  /api/product-info     → dati prodotto + valutazione     │
│  /api/alternatives     → prodotti alternativi            │
│                                                          │
│  Servizi interni:                                        │
│  ├─ AsinExtractor                                        │
│  ├─ CreatorsAPI Service (unica fonte dati)               │
│  ├─ PriceEvaluator (semaforo)                            │
│  └─ AffiliateLinkBuilder                                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Amazon Creators │
              │  API (REST)      │
              │                  │
              │  • GetItems      │
              │  • SearchItems   │
              │  • GetBrowseNodes│
              └─────────────────┘
```

---

## 2. Stack Tecnologico

| Layer                | Tecnologia                                | Motivazione                                                                                                                            |
| -------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**         | HTML + CSS + JS vanilla (o Vite)          | Minimalismo richiesto, zero overhead                                                                                                   |
| **Backend**          | **Node.js + Fastify**                     | Velocità, schema validation nativa, ottimo per API proxy                                                                               |
| **Unica fonte dati** | **Amazon Creators API**                   | Prezzo attuale, prezzo di listino (savingBasis), sconto %, review score, categorie, immagini, ricerca prodotti — tutto in un'unica API |
| **SDK**              | **`amazon-creators-api`** (npm)           | Wrapper TypeScript. Alternativa: SDK ufficiale Amazon da Associates Central                                                            |
| **Affiliate Links**  | **Amazon Associates Tag**                 | `partnerTag` passato nelle richieste Creators API → link affiliati automatici nelle response                                           |
| **Deploy**           | **Fly.io / Railway / Vercel / qualsiasi** | Nessun browser headless → basta Node.js puro, anche 128MB RAM                                                                          |
| **Env/Config**       | **dotenv + .env**                         | Secrets: Creators API credentials, Partner tag                                                                                         |

---

## 3. Dati Disponibili dalla Creators API

### GetItems — Risorse utilizzate per il prodotto principale

| Risorsa Creators API            | Dato ottenuto                          | Uso nel flusso                    |
| ------------------------------- | -------------------------------------- | --------------------------------- |
| `itemInfo.title`                | Titolo prodotto                        | Card prodotto                     |
| `itemInfo.features`             | Bullet point caratteristiche           | Dettagli card (opzionale)         |
| `images.primary.large`          | Immagine principale                    | Card prodotto                     |
| `offersV2.listings.price`       | **Prezzo attuale** (amount + currency) | Card + input per semaforo         |
| `offersV2.listings.savingBasis` | **Prezzo di listino / prezzo barrato** | Confronto per semaforo            |
| `offersV2.listings.savings`     | **Sconto** (amount + percentage)       | Semaforo + label "Risparmi X%"    |
| `customerReviews.starRating`    | **Rating medio** (es. 4.3/5)           | Card + ranking alternative        |
| `customerReviews.count`         | **Numero recensioni**                  | Card + ranking alternative        |
| `browseNodeInfo.browseNodes`    | Categoria / BrowseNodeId               | Query per SearchItems alternative |

### SearchItems — Risorse per le alternative

| Risorsa Creators API                | Dato ottenuto                          | Uso nel flusso                       |
| ----------------------------------- | -------------------------------------- | ------------------------------------ |
| Tutte le risorse sopra              | Stessi dati per ciascun risultato      | Card carosello                       |
| Filtri: `MinPrice`, `MaxPrice`      | Range prezzo per alternative           | Prodotti con prezzo ≤ prezzo attuale |
| Filtro: `BrowseNodeId` + `Keywords` | Stessa categoria + keywords dal titolo | Pertinenza alternative               |

---

## 4. Flusso Dettagliato per Fase

### FASE 1 — Input & Validazione

```
URL in ingresso → Regex extraction → ASIN
Pattern: /(?:dp|product)\/([A-Z0-9]{10})/
```

L'ASIN è un codice alfanumerico di **10 caratteri** sempre presente nel path Amazon. Esempio:
`/dp/B084K866MQ/` → ASIN = `B084K866MQ`

### FASE 2 — Raccolta Dati (2 chiamate API, parallelizzabili)

```
         ┌─── Creators API: GetItems(ASIN)
         │      → titolo, immagine, prezzo attuale
         │      → prezzo di listino (savingBasis)
         │      → sconto % (savings.percentage)
         │      → review score + count
         │      → BrowseNodeId + categoria
         │
ASIN ────┤
         │
         └─── Creators API: SearchItems(BrowseNode, keywords)
                → stessa categoria, prezzo ≤ prezzo_attuale_prodotto
                → max 10 risultati con prezzo, review, immagine
                → ranking lato server → top 5
```

### FASE 3 — Elaborazione (Logica Semaforo)

Il semaforo si basa su **3 segnali combinati** disponibili dalla Creators API:

```
// Segnale 1: Sconto rispetto al prezzo di listino (savingBasis)
savings_pct = savings.percentage   // es. 25%

// Segnale 2: Posizionamento rispetto alle alternative
prezzo_prodotto = 45.99
media_alternative = media(prezzi top 5 alternative)
posizione_vs_alt = (prezzo_prodotto - media_alternative) / media_alternative

// Segnale 3: Qualità (review score del prodotto)
review_score = customerReviews.starRating  // es. 4.3

// Logica combinata
if savings_pct >= 20% AND posizione_vs_alt <= 0:
    semaforo = "green"    → "Ottimo prezzo!"
elif savings_pct >= 5% OR posizione_vs_alt <= 0.15:
    semaforo = "yellow"   → "Prezzo nella media"
else:
    semaforo = "red"      → "Prezzo alto — valuta le alternative"
```

### FASE 4 — Rendering Risultato

- Card prodotto con link affiliato
- Semaforo visivo (🔴🟡🟢) con label testuale
- Info sconto: "Risparmi X% rispetto al listino"
- Carosello 5 alternative (SEMPRE visibile, anche se green)
- Ogni link → affiliate link con partnerTag

---

## 5. Struttura del Progetto

```
amazon-price-advisor/
├── .env                          # secrets
├── .env.example
├── package.json
├── server.js                     # entry point Fastify
├── src/
│   ├── routes/
│   │   ├── validate.js           # POST /api/validate-link
│   │   ├── product.js            # GET  /api/product/:asin
│   │   └── alternatives.js       # GET  /api/alternatives/:asin
│   ├── services/
│   │   ├── asin-extractor.js     # regex + validazione URL
│   │   ├── creators-api-client.js # wrapper Amazon Creators API
│   │   ├── price-evaluator.js    # logica semaforo (3 segnali)
│   │   └── affiliate-builder.js  # costruzione link affiliato
│   └── config.js                 # env vars centralizzate
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js                    # logica frontend (state machine)
└── tests/
    ├── asin-extractor.test.js
    ├── price-evaluator.test.js
    └── affiliate-builder.test.js
```

---

## 6. Variabili d'Ambiente

```env
# Amazon Creators API
# Credenziali ottenibili da: https://affiliate-program.amazon.com/creatorsapi
CREATORS_API_CREDENTIAL_ID=your-credential-id
CREATORS_API_CREDENTIAL_SECRET=your-credential-secret
CREATORS_API_CREDENTIAL_VERSION=1
CREATORS_API_PARTNER_TAG=mystore-21
CREATORS_API_MARKETPLACE=www.amazon.it

# App
PORT=3000
NODE_ENV=production
```

---

## 7. Rischi e Mitigazioni

| #   | Rischio                                                             | Impatto                     | Mitigazione                                                                                                              |
| --- | ------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Creators API rate limit**                                         | Blocco temporaneo           | Cache in-memory (TTL 1h), throttling con p-queue                                                                         |
| 2   | **Creators API richiede 10 vendite qualificanti** negli ultimi 30gg | Non puoi accedere all'API   | Prerequisito bloccante — il progetto non funziona senza. Generare le prime vendite via contenuti/social prima del lancio |
| 3   | **`savingBasis` non sempre presente**                               | Semaforo degradato          | Se mancante, basarsi solo su confronto con alternative; label "Confronta con le alternative"                             |
| 4   | **ASIN non trovato / prodotto non disponibile**                     | UX rotta                    | Gestione errori con messaggi chiari per ogni caso                                                                        |
| 5   | **Categorie Amazon molto ampie**                                    | Alternative poco pertinenti | Usare `BrowseNodeId` più specifico + keywords dal titolo prodotto                                                        |
| 6   | **Amazon TOS** per affiliazione                                     | Rischio ban account         | I link devono essere chiaramente etichettati come affiliati (disclaimer obbligatorio)                                    |
| 7   | **SearchItems restituisce max 10 risultati**                        | Pool alternative limitato   | Ranking aggressivo: score = f(review, count, prezzo). 5 su 10 sono sufficienti                                           |

---

## 8. Pianificazione — Epiche, User Story e Task

---

### EPIC 1 — Infrastruttura e Setup Progetto

> _Setup del progetto, configurazione ambiente_

**US 1.1** — Come sviluppatore, voglio un progetto Node.js configurato con Fastify e struttura cartelle definita.

| Task                                                                                    | Stima |
| --------------------------------------------------------------------------------------- | ----- |
| T1.1.1 — Init progetto, package.json, dipendenze (fastify, dotenv, amazon-creators-api) | S     |
| T1.1.2 — Struttura cartelle (src/routes, src/services, public, tests)                   | S     |
| T1.1.3 — Configurazione .env.example + config.js centralizzato                          | S     |
| T1.1.4 — Setup Fastify con static file serving (public/)                                | S     |
| T1.1.5 — Setup ESLint + Vitest                                                          | S     |

**US 1.2** — Come sviluppatore, voglio un ambiente di deploy configurato.

| Task                                           | Stima |
| ---------------------------------------------- | ----- |
| T1.2.1 — Dockerfile o fly.toml / railway.json  | M     |
| T1.2.2 — Configurazione env vars in produzione | S     |

---

### EPIC 2 — Validazione Input e Estrazione ASIN

> _L'utente inserisce un URL e il sistema valida che sia Amazon ed estrae l'ASIN_

**US 2.1** — Come utente, voglio incollare un link Amazon e ricevere conferma che sia valido.

| Task                                                                                                      | Stima |
| --------------------------------------------------------------------------------------------------------- | ----- |
| T2.1.1 — `asin-extractor.js`: regex per estrarre ASIN da URL Amazon (supporto .it, .com, .de, short URLs) | M     |
| T2.1.2 — Route `POST /api/validate-link` con validazione input (sanitize, max length, URL format)         | S     |
| T2.1.3 — Unit test per varianti URL Amazon (dp/, product/, gp/product/, short link amzn.to)               | M     |
| T2.1.4 — Frontend: input field con validazione client-side (pattern URL)                                  | S     |

---

### EPIC 3 — Recupero Dati Prodotto (Creators API)

> _Dato un ASIN, recuperare tutti i dati tramite Creators API_

**US 3.1** — Come sistema, dato un ASIN voglio ottenere prezzo, sconto, titolo, immagine e review score.

| Task                                                                                                                                                                                                                                               | Stima |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| T3.1.1 — `creators-api-client.js`: wrapper Creators API con `ApiClient` + `TypedDefaultApi`, operazione `GetItems` (credentialId/Secret)                                                                                                           | M     |
| T3.1.2 — Richiesta risorse: `offersV2.listings.price`, `offersV2.listings.savingBasis`, `offersV2.listings.savings`, `customerReviews.starRating`, `customerReviews.count`, `itemInfo.title`, `images.primary.large`, `browseNodeInfo.browseNodes` | S     |
| T3.1.3 — Parsing risposta: estrazione strutturata di prezzo attuale, prezzo listino, sconto %, review, BrowseNodeId                                                                                                                                | M     |
| T3.1.4 — Route `GET /api/product/:asin`                                                                                                                                                                                                            | S     |
| T3.1.5 — Cache in-memory (Map con TTL 1h) per evitare chiamate duplicate                                                                                                                                                                           | M     |

**US 3.2** — Come sistema, voglio estrarre categorie e keywords per cercare alternative.

| Task                                                                             | Stima |
| -------------------------------------------------------------------------------- | ----- |
| T3.2.1 — Estrazione BrowseNodeId dalla risposta GetItems                         | S     |
| T3.2.2 — Estrazione keywords dal titolo prodotto (stopword removal, token top N) | M     |
| T3.2.3 — Combinazione BrowseNode + keywords per query SearchItems                | S     |

---

### EPIC 4 — Ricerca Prodotti Alternativi (Creators API)

> _Trovare 5 alternative nella stessa categoria con prezzo ≤ prezzo attuale_

**US 4.1** — Come sistema, voglio cercare prodotti alternativi filtrati per prezzo e ordinati per qualità.

| Task                                                                                                       | Stima |
| ---------------------------------------------------------------------------------------------------------- | ----- |
| T4.1.1 — `creators-api-client.js`: operazione `SearchItems` con filtri (BrowseNode, keywords, MaxPrice)    | L     |
| T4.1.2 — Richiesta risorse per ogni risultato: prezzo, savingBasis, savings, review, immagine, titolo      | S     |
| T4.1.3 — Logica di ranking: `score = (review_rating × 2) + log(review_count) - (prezzo / prezzo_prodotto)` | M     |
| T4.1.4 — Selezione top 5, escludendo l'ASIN originale, trasformazione dati per frontend                    | S     |
| T4.1.5 — Route `GET /api/alternatives/:asin`                                                               | S     |

---

### EPIC 5 — Affiliate Link Builder

> _Ogni link deve contenere il tag affiliato_

**US 5.1** — Come business, voglio che ogni link prodotto contenga il mio tag affiliato.

| Task                                                                                   | Stima |
| -------------------------------------------------------------------------------------- | ----- |
| T5.1.1 — `affiliate-builder.js`: costruzione URL canonico Amazon con `tag` param       | S     |
| T5.1.2 — Pulizia URL: rimozione tracking params inutili, mantenimento solo `/dp/ASIN/` | S     |
| T5.1.3 — Unit test: vari formati input → output atteso con tag                         | S     |

---

### EPIC 6 — Price Evaluator (Semaforo)

> _Valutazione se il prezzo è buono basata su sconto + confronto alternative_

**US 6.1** — Come utente, voglio un indicatore visivo (semaforo) che mi dica se il prezzo è buono.

| Task                                                                                                            | Stima |
| --------------------------------------------------------------------------------------------------------------- | ----- |
| T6.1.1 — `price-evaluator.js`: algoritmo a 3 segnali (savings%, posizione vs alternative, review score)         | M     |
| T6.1.2 — Gestione caso `savingBasis` assente: fallback solo su confronto alternative                            | S     |
| T6.1.3 — Output strutturato: `{ color, label, explanation, savings_pct, vs_alternatives_pct }`                  | S     |
| T6.1.4 — Unit test: prodotto con sconto alto, senza sconto, prezzo sopra media alternative, savingBasis assente | M     |

---

### EPIC 7 — Frontend (UI a stati progressivi)

> _Interfaccia minimale con 3 stati: Input → Loading → Result_

**US 7.1** — Come utente, voglio una pagina minimale con un campo di ricerca.

| Task                                                                         | Stima |
| ---------------------------------------------------------------------------- | ----- |
| T7.1.1 — `index.html`: layout base, meta tags, font, favicon                 | S     |
| T7.1.2 — `styles.css`: design system minimale (variables, reset, typography) | M     |
| T7.1.3 — Stato INPUT: campo search centrato, placeholder, bottone "Analizza" | S     |

**US 7.2** — Come utente, durante l'analisi voglio un'animazione di caricamento con fase corrente.

| Task                                                                                         | Stima |
| -------------------------------------------------------------------------------------------- | ----- |
| T7.2.1 — Stato LOADING: animazione CSS (spinner/pulse)                                       | M     |
| T7.2.2 — Step indicator: "Verifica link…", "Recupero dati prodotto…", "Ricerca alternative…" | S     |
| T7.2.3 — `app.js`: state machine (INPUT → LOADING → RESULT \| ERROR)                         | M     |

**US 7.3** — Come utente, voglio vedere card prodotto, semaforo e carosello alternative.

| Task                                                                                                    | Stima |
| ------------------------------------------------------------------------------------------------------- | ----- |
| T7.3.1 — Card prodotto: immagine, titolo, prezzo, sconto %, review score, link affiliato                | M     |
| T7.3.2 — Componente semaforo: 3 cerchi con stato attivo + label testuale + spiegazione                  | M     |
| T7.3.3 — Carosello alternative: 5 card scrollabili con immagine, titolo, prezzo, rating, link affiliato | L     |
| T7.3.4 — Bottone "Nuova ricerca" per tornare a stato INPUT                                              | S     |
| T7.3.5 — Disclaimer affiliazione (obbligatorio TOS Amazon)                                              | S     |

**US 7.4** — Come utente, voglio che la pagina sia responsive e funzioni su mobile.

| Task                                                | Stima |
| --------------------------------------------------- | ----- |
| T7.4.1 — Media queries per breakpoint mobile/tablet | M     |
| T7.4.2 — Touch-friendly carousel (swipe)            | M     |

---

### EPIC 8 — Gestione Errori e Edge Case

**US 8.1** — Come utente, voglio messaggi di errore chiari se qualcosa va storto.

| Task                                                                                    | Stima |
| --------------------------------------------------------------------------------------- | ----- |
| T8.1.1 — Stato ERROR nel frontend con messaggi user-friendly                            | S     |
| T8.1.2 — Gestione: URL non Amazon, ASIN non trovato, prodotto non disponibile, API down | M     |
| T8.1.3 — Rate limiting lato server (protezione abuse)                                   | M     |
| T8.1.4 — Logging strutturato (pino, incluso con Fastify)                                | S     |

---

## 9. Ordine di Esecuzione Raccomandato

```
Sprint 1 (foundation)    → Epic 1 + Epic 2 + Epic 5
Sprint 2 (core data)     → Epic 3 + Epic 6
Sprint 3 (alternatives)  → Epic 4
Sprint 4 (frontend)      → Epic 7
Sprint 5 (hardening)     → Epic 8
```

5 sprint totali. Nessuna Epic 9 — nessun fallback necessario.

---

## 10. Costi Ricorrenti

| Servizio                       | Costo    | Note                                                          |
| ------------------------------ | -------- | ------------------------------------------------------------- |
| **Amazon Creators API**        | Gratuita | Richiede account Associates attivo con almeno 10 vendite/30gg |
| **Hosting** (Fly.io free tier) | €0       | Node.js puro, 128-256MB RAM sufficienti                       |

**Costo totale: €0/mese** (escluso dominio opzionale)

---

## 11. Note Critiche

1. **PA-API v5 è deprecata dal 30 aprile 2026.** La sostituta ufficiale è la **Amazon Creators API**. Stesse operazioni, autenticazione semplificata: `credentialId` + `credentialSecret` + `version`.

2. **Creators API richiede almeno 10 vendite qualificanti negli ultimi 30 giorni**. È un prerequisito bloccante — senza non si accede all'API. Generare le prime vendite tramite contenuti/social/blog prima del lancio.

3. **`savingBasis` (prezzo di listino) non è sempre presente.** Amazon lo mostra solo quando c'è un prezzo barrato sulla pagina. Se mancante, il semaforo si basa solo sul confronto con le alternative.

4. **Review score** disponibile via `customerReviews.starRating` + `customerReviews.count`. Nessuno scraping necessario.

5. **SearchItems** restituisce max 10 risultati per chiamata. Il ranking va fatto lato server: `score = f(review_rating, review_count, prezzo)`.

6. **Usa `offersV2` e non `offers`** — `offers` è deprecato.

7. **SDK consigliato**: `amazon-creators-api` (npm, TypeScript wrapper). Credenziali su https://affiliate-program.amazon.com/creatorsapi.

8. **Marketplace**: stringa host `"www.amazon.it"`.

9. **Il disclaimer affiliazione è obbligatorio**: "In qualità di Affiliato Amazon, ricevo un guadagno per ciascun acquisto idoneo."

---

## 12. Esempio Concreto — Outcome Finale

### Input dell'utente

L'utente incolla:

```
https://www.amazon.it/Venilia-Fix-Pellicola-Naturale-Spessore-54913/dp/B084K866MQ/
```

### Chiamata 1 — GetItems(B084K866MQ)

Il backend chiama la Creators API con queste risorse:

```js
const resources = [
  'itemInfo.title',
  'itemInfo.features',
  'images.primary.large',
  'offersV2.listings.price',
  'offersV2.listings.savingBasis',
  'offersV2.listings.savings',
  'customerReviews.starRating',
  'customerReviews.count',
  'browseNodeInfo.browseNodes',
];
```

**Risposta parsata:**

```json
{
  "asin": "B084K866MQ",
  "title": "Venilia Pellicola Adesiva Fix, Effetto Legno Naturale",
  "image": "https://m.media-amazon.com/images/I/71xxxxx.jpg",
  "price": { "amount": 12.99, "currency": "EUR" },
  "savingBasis": { "amount": 17.49, "currency": "EUR" },
  "savings": { "amount": 4.5, "percentage": 26 },
  "reviews": { "starRating": 4.3, "count": 1847 },
  "browseNodeId": "2454163031",
  "category": "Carta da parati e accessori"
}
```

### Chiamata 2 — SearchItems (in parallelo)

```js
SearchItems({
  keywords: 'pellicola adesiva effetto legno',
  browseNodeId: '2454163031',
  maxPrice: 1299, // ≤ prezzo attuale in centesimi
  resources: [
    /* stesse risorse */
  ],
});
```

**Risposta parsata (top 5 dopo ranking):**

```json
[
  {
    "asin": "B07XXXXX01",
    "title": "d-c-fix Pellicola Adesiva Legno Quercia",
    "price": { "amount": 9.99 },
    "savings": { "percentage": 15 },
    "reviews": { "starRating": 4.5, "count": 3201 },
    "image": "https://..."
  },
  {
    "asin": "B09XXXXX02",
    "title": "Homein Carta Adesiva per Mobili Effetto Legno",
    "price": { "amount": 11.49 },
    "savings": { "percentage": 10 },
    "reviews": { "starRating": 4.2, "count": 956 },
    "image": "https://..."
  },
  {
    "asin": "B08XXXXX03",
    "title": "KINLO Pellicola Legno Autoadesiva",
    "price": { "amount": 8.99 },
    "savings": null,
    "reviews": { "starRating": 4.1, "count": 2103 },
    "image": "https://..."
  },
  {
    "asin": "B0BXXXXX04",
    "title": "Niviy Carta da Parati Adesiva Legno Vintage",
    "price": { "amount": 10.99 },
    "savings": { "percentage": 20 },
    "reviews": { "starRating": 4.4, "count": 678 },
    "image": "https://..."
  },
  {
    "asin": "B06XXXXX05",
    "title": "Arthome Pellicola Effetto Legno per Mobili",
    "price": { "amount": 7.99 },
    "savings": { "percentage": 30 },
    "reviews": { "starRating": 4.0, "count": 4512 },
    "image": "https://..."
  }
]
```

### Elaborazione Semaforo

```
savings_pct = 26%                              → > 20%  ✓
media_alternative = (9.99+11.49+8.99+10.99+7.99) / 5 = €9.89
posizione_vs_alt = (12.99 - 9.89) / 9.89 = +31%  → prodotto SOPRA la media

Risultato: savings% buono MA prezzo sopra media alternative
→ semaforo = "yellow" — "Prezzo scontato, ma ci sono alternative più economiche"
```

### Rendering Finale (cosa vede l'utente)

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌────────┐  Venilia Pellicola Adesiva Fix               │
│  │ [img]  │  Effetto Legno Naturale                      │
│  │        │                                              │
│  └────────┘  €12,99  ██ €17,49  -26%                    │
│              ★★★★☆ 4.3 (1.847 recensioni)               │
│                                                          │
│              🔗 Vedi su Amazon →                         │
│                 (link affiliato)                          │
│                                                          │
│  ┌──────────────────────────────────────────┐            │
│  │  🟡  PREZZO NELLA MEDIA                  │            │
│  │                                           │            │
│  │  Scontato del 26% rispetto al listino,   │            │
│  │  ma in media €3,10 più caro delle        │            │
│  │  alternative nella stessa categoria.      │            │
│  └──────────────────────────────────────────┘            │
│                                                          │
│  ── Alternative consigliate ──────────────────           │
│                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────│
│  │ [img]   │ │ [img]   │ │ [img]   │ │ [img]   │ │ [i │
│  │ d-c-fix │ │ Homein  │ │ KINLO   │ │ Niviy   │ │ Art│
│  │ €9,99   │ │ €11,49  │ │ €8,99   │ │ €10,99  │ │ €7,│
│  │ ★4.5    │ │ ★4.2    │ │ ★4.1    │ │ ★4.4    │ │ ★4.│
│  │ (3.201) │ │ (956)   │ │ (2.103) │ │ (678)   │ │ (4.│
│  │ 🔗 Vedi │ │ 🔗 Vedi │ │ 🔗 Vedi │ │ 🔗 Vedi │ │ 🔗 │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────│
│                                          ← scorri →      │
│                                                          │
│  ┌──────────────────────┐                                │
│  │  🔄 Nuova ricerca    │                                │
│  └──────────────────────┘                                │
│                                                          │
│  In qualità di Affiliato Amazon, ricevo un guadagno      │
│  per ciascun acquisto idoneo.                            │
└─────────────────────────────────────────────────────────┘
```

### Casi Semaforo — Esempi concreti

| Scenario                                         | savings% | vs alternative | Semaforo | Label                                              |
| ------------------------------------------------ | -------- | -------------- | -------- | -------------------------------------------------- |
| Prodotto scontato E sotto media alternative      | 30%      | -10%           | 🟢       | "Ottimo prezzo!"                                   |
| Prodotto scontato MA sopra media alternative     | 26%      | +31%           | 🟡       | "Scontato, ma ci sono alternative più convenienti" |
| Prodotto non scontato E sopra media alternative  | 0%       | +25%           | 🔴       | "Prezzo alto — valuta le alternative"              |
| Prodotto non scontato MA sotto media alternative | 0%       | -5%            | 🟡       | "Prezzo nella media, nessuno sconto attivo"        |
| Nessuna alternativa trovata, prodotto scontato   | 20%      | n/a            | 🟢       | "Sconto attivo del 20%"                            |
| Nessuna alternativa, nessuno sconto              | 0%       | n/a            | 🟡       | "Prezzo pieno — nessun dato di confronto"          |
