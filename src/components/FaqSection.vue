<script setup lang="ts">
import { ref } from 'vue';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

const faqs = ref<FaqItem[]>([
  {
    id: 1,
    question: "Come funziona l'analisi del prezzo?",
    answer:
      "Quando inserisci un link Amazon, recuperiamo le informazioni del prodotto tramite le API ufficiali di Amazon. L'analisi si basa su due fattori concreti: (1) lo sconto rispetto al prezzo di listino, cioè la differenza tra il prezzo attuale e il prezzo originale dichiarato da Amazon; (2) il confronto con la media dei prezzi di prodotti alternativi trovati nella stessa categoria Amazon. Combinando questi due dati, il sistema assegna un verdetto visivo tramite un semaforo (verde, giallo, rosso). Non disponiamo di uno storico dei prezzi: il confronto avviene esclusivamente tra dati disponibili al momento della ricerca.",
  },
  {
    id: 2,
    question: 'Cosa significano i colori del semaforo?',
    answer:
      'Verde (Ottimo prezzo): il prodotto ha uno sconto significativo rispetto al listino (almeno 20%) e non risulta più caro delle alternative, oppure è almeno il 15% più economico della media delle alternative. Giallo (Prezzo nella media): il prodotto non presenta né un grande sconto né un prezzo particolarmente elevato rispetto alle alternative. Rosso (Prezzo alto): il prodotto non ha uno sconto rilevante ed è sensibilmente più caro della media delle alternative trovate (almeno il 10% in più). Questi valori sono soglie indicative pensate per orientarti, non giudizi assoluti.',
  },
  {
    id: 3,
    question: 'Cosa significa "più caro della media delle alternative"?',
    answer:
      'Quando cerchiamo alternative, raccogliamo i prezzi di prodotti simili nella stessa categoria Amazon. Calcoliamo la media aritmetica di questi prezzi. Se il prodotto che stai analizzando costa di più rispetto a questa media, ti mostriamo la percentuale di differenza. È importante sapere che le alternative non sono necessariamente prodotti identici: possono differire per marca, caratteristiche o qualità. Questo dato serve come indicazione di mercato, non come confronto diretto tra prodotti equivalenti. Ti consigliamo sempre di valutare le alternative proposte leggendo le specifiche e le recensioni.',
  },
  {
    id: 4,
    question: 'Come vengono scelte le alternative?',
    answer:
      'Le alternative vengono cercate nella stessa categoria merceologica del prodotto, usando parole chiave estratte automaticamente dal titolo. Ogni alternativa viene classificata con un punteggio interno che tiene conto di: valutazione in stelle, numero di recensioni e rapporto qualità-prezzo. Ti mostriamo le 5 migliori. Tuttavia, la ricerca automatica ha dei limiti: le alternative potrebbero includere prodotti di fascia diversa o con caratteristiche differenti. Per questo motivo le presentiamo come suggerimenti da valutare, non come sostituti garantiti.',
  },
  {
    id: 5,
    question: 'Il prezzo di listino mostrato è affidabile?',
    answer:
      'Il prezzo di listino e la percentuale di sconto provengono direttamente da Amazon tramite le sue API ufficiali. Noi li riportiamo così come Amazon li comunica, senza modificarli. Tieni presente che il prezzo di listino corrisponde al prezzo consigliato dal produttore o al prezzo originale indicato da Amazon, e non è necessariamente il prezzo a cui il prodotto è stato venduto in precedenza. In alcuni casi Amazon potrebbe mostrare un listino che non riflette il reale valore di mercato del prodotto.',
  },
  {
    id: 6,
    question: 'Da dove provengono i dati?',
    answer:
      "Tutti i dati (prezzo, prezzo di listino, sconto, recensioni, immagini, alternative) provengono dalle API ufficiali di Amazon. Non raccogliamo dati da fonti terze né effettuiamo scraping. I dati vengono recuperati in tempo reale al momento dell'analisi, quindi riflettono la situazione su Amazon nell'istante in cui effettui la ricerca. Non conserviamo uno storico dei prezzi.",
  },
  {
    id: 7,
    question: 'Quali siti Amazon sono supportati?',
    answer:
      'Attualmente il servizio è ottimizzato per Amazon Italia (amazon.it). Puoi incollare il link del prodotto in qualsiasi formato: link completi, link compressi (amzn.to, amzn.eu, a.co) e link condivisi dalle app Amazon.',
  },
  {
    id: 8,
    question: 'È davvero gratuito? Come vi sostenete?',
    answer:
      "Sì, il servizio è completamente gratuito e non richiede registrazione. Ci sosteniamo tramite il programma di affiliazione Amazon: i link verso Amazon presenti nei risultati (sia per il prodotto analizzato sia per le alternative) contengono un codice affiliato. Se effettui un acquisto tramite questi link, Amazon ci riconosce una piccola commissione. Questo non comporta alcun costo aggiuntivo per te e non influenza in alcun modo l'analisi del prezzo o la selezione delle alternative: il verdetto del semaforo e il punteggio delle alternative sono calcolati con criteri oggettivi e trasparenti.",
  },
  {
    id: 9,
    question: "L'analisi può sostituire una valutazione personale?",
    answer:
      "No. L'analisi è uno strumento orientativo che ti fornisce dati oggettivi per prendere una decisione più informata. Tuttavia, non può tenere conto di fattori soggettivi come le tue esigenze specifiche, la preferenza per un brand, la qualità percepita o le condizioni di garanzia. Ti consigliamo di usare il nostro strumento come punto di partenza e di leggere sempre le recensioni e le specifiche del prodotto prima di acquistare.",
  },
]);

const openItems = ref<Set<number>>(new Set());

function toggleItem(id: number) {
  if (openItems.value.has(id)) {
    openItems.value.delete(id);
  } else {
    openItems.value.add(id);
  }
}

function isOpen(id: number): boolean {
  return openItems.value.has(id);
}
</script>

<template>
  <section class="mx-auto mt-12 w-full max-w-2xl" aria-labelledby="faq-heading">
    <h2
      id="faq-heading"
      class="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100"
    >
      Domande frequenti
    </h2>

    <div class="space-y-3">
      <div
        v-for="faq in faqs"
        :key="faq.id"
        class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#141414]"
      >
        <h3>
          <button
            type="button"
            :aria-expanded="isOpen(faq.id)"
            :aria-controls="`faq-answer-${faq.id}`"
            class="flex w-full items-center justify-between px-5 py-4 text-left font-medium text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none dark:text-gray-100 dark:hover:bg-[#1a1a1a]"
            @click="toggleItem(faq.id)"
          >
            <span class="text-base">{{ faq.question }}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 shrink-0 text-gray-500 transition-transform dark:text-gray-400"
              :class="{ 'rotate-180': isOpen(faq.id) }"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </h3>

        <div
          :id="`faq-answer-${faq.id}`"
          class="grid transition-all duration-300 ease-in-out"
          :class="isOpen(faq.id) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden">
            <div class="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400">
              {{ faq.answer }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
