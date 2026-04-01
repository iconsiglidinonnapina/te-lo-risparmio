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
      'Recuperiamo le informazioni del prodotto Amazon tramite le API ufficiali di Amazon e confrontiamo il prezzo attuale con il prezzo di listino. Cerchiamo anche prodotti alternativi nella stessa categoria per darti un quadro completo: se il prezzo è in linea con le alternative o se ci sono opzioni migliori.',
  },
  {
    id: 2,
    question: 'Cosa significa "più caro della media delle alternative"?',
    answer:
      'Oltre al prezzo del singolo prodotto, cerchiamo prodotti simili nella stessa categoria Amazon. Calcoliamo la media dei prezzi delle alternative trovate. Se il tuo prodotto costa di più, ti mostriamo la percentuale di differenza per aiutarti a decidere.',
  },
  {
    id: 3,
    question: 'Come vengono scelte le alternative?',
    answer:
      'Le alternative vengono cercate nella stessa categoria merceologica del prodotto, usando parole chiave estratte dal titolo. Ogni alternativa viene classificata in base a un punteggio che tiene conto di: valutazione stelle, numero di recensioni e rapporto prezzo. Ti mostriamo le 5 migliori.',
  },
  {
    id: 4,
    question: 'Quali siti Amazon sono supportati?',
    answer:
      'Attualmente il servizio è ottimizzato per Amazon Italia (amazon.it). Puoi incollare direttamente il link del prodotto che ti interessa, anche in formato compresso (link corti).',
  },
  {
    id: 5,
    question: 'È davvero gratuito?',
    answer:
      'Sì, il servizio è completamente gratuito e non richiede registrazione. Ci sosteniamo tramite il programma di affiliazione Amazon: se acquisti tramite i nostri link, riceviamo una piccola commissione senza costi aggiuntivi per te.',
  },
  {
    id: 6,
    question: 'Ogni quanto vengono aggiornati i prezzi?',
    answer:
      "I prezzi vengono recuperati in tempo reale al momento dell'analisi tramite le API ufficiali di Amazon. Ogni analisi ti fornisce dati aggiornati al momento della ricerca.",
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
