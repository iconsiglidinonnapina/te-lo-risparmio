<script setup lang="ts">
import FaqSection from '@/components/FaqSection.vue';
import TrafficLight from '@/components/TrafficLight.vue';
import ProductCard from '@/components/ProductCard.vue';
import AlternativesCarousel from '@/components/AlternativesCarousel.vue';
import type { ProductResponse, AlternativeProduct, PriceEvaluation } from '@/types/analysis';

// Mock data for example analysis (fictional products for demo purposes)
const mockProduct: ProductResponse = {
  asin: 'B0DEMO1234',
  title: 'Cuffie Wireless con Cancellazione Attiva del Rumore — Bluetooth 5.3, Autonomia 40h',
  imageUrl: null,
  detailPageUrl: '#',
  price: { amount: 79.9, currency: 'EUR', displayAmount: '79,90 €' },
  listPrice: { amount: 109.9, currency: 'EUR', displayAmount: '109,90 €' },
  savingsPercentage: 27,
  savingsAmount: { amount: 30, currency: 'EUR', displayAmount: '30,00 €' },
  reviewRating: 4.2,
  reviewCount: 1843,
  browseNodeId: null,
  browseNodeName: null,
  keywords: '',
  affiliateUrl: '#',
};

const mockAlternatives: AlternativeProduct[] = [
  {
    asin: 'B0ALT001',
    title: 'Auricolari In-Ear Bluetooth 5.0 con Custodia di Ricarica Rapida',
    imageUrl: null,
    detailPageUrl: '#',
    price: { amount: 29.9, currency: 'EUR', displayAmount: '29,90 €' },
    listPrice: null,
    savingsPercentage: null,
    savingsAmount: null,
    reviewRating: 4.4,
    reviewCount: 3021,
    browseNodeId: null,
    browseNodeName: null,
    score: 0.95,
    affiliateUrl: '#',
  },
  {
    asin: 'B0ALT002',
    title: 'Cuffie Over-Ear Pieghevoli con Microfono e Cavo Rimovibile',
    imageUrl: null,
    detailPageUrl: '#',
    price: { amount: 24.5, currency: 'EUR', displayAmount: '24,50 €' },
    listPrice: null,
    savingsPercentage: null,
    savingsAmount: null,
    reviewRating: 4.1,
    reviewCount: 876,
    browseNodeId: null,
    browseNodeName: null,
    score: 0.88,
    affiliateUrl: '#',
  },
  {
    asin: 'B0ALT003',
    title: 'Cuffie Sportive Impermeabili IPX5 con Archetto Regolabile',
    imageUrl: null,
    detailPageUrl: '#',
    price: { amount: 54.9, currency: 'EUR', displayAmount: '54,90 €' },
    listPrice: null,
    savingsPercentage: null,
    savingsAmount: null,
    reviewRating: 4.6,
    reviewCount: 512,
    browseNodeId: null,
    browseNodeName: null,
    score: 0.82,
    affiliateUrl: '#',
  },
  {
    asin: 'B0ALT004',
    title: 'Altoparlante Portatile Bluetooth con Bass Boost — 12h Batteria',
    imageUrl: null,
    detailPageUrl: '#',
    price: { amount: 38.9, currency: 'EUR', displayAmount: '38,90 €' },
    listPrice: null,
    savingsPercentage: null,
    savingsAmount: null,
    reviewRating: 3.9,
    reviewCount: 247,
    browseNodeId: null,
    browseNodeName: null,
    score: 0.65,
    affiliateUrl: '#',
  },
];

const mockEvaluation: PriceEvaluation = {
  color: 'red',
  label: 'Prezzo alto',
  explanation:
    "Buon sconto del 27% rispetto al prezzo di listino. Nettamente più caro delle alternative (53%). Costa più del doppio dell'alternativa più economica",
  savingsPct: 27,
  vsAlternativesPct: -53,
  priceBars: {
    currentPrice: { amount: 79.9, displayAmount: '79,90 €' },
    averageAlternativePrice: { amount: 37.05, displayAmount: '37,05 €' },
    cheapestAlternativePrice: { amount: 24.5, displayAmount: '24,50 €' },
  },
};
</script>

<template>
  <main id="maincontent" tabindex="-1" class="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
    <h1
      class="mb-2 text-center text-xs font-semibold uppercase tracking-[1.5px] text-teal-600 dark:text-teal-500"
    >
      Come funziona
    </h1>
    <p
      class="mb-8 text-center text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-100"
    >
      Analisi completa in 3 passi
    </p>

    <!-- Steps -->
    <div class="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div
        class="rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:border-gray-300 dark:border-[rgba(148,163,184,0.1)] dark:bg-[#0a0a0a] dark:hover:border-[rgba(148,163,184,0.2)]"
      >
        <div
          class="mx-auto mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-600 dark:bg-[rgba(20,184,166,0.15)] dark:text-teal-500"
        >
          1
        </div>
        <h2 class="mb-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Incolla il link
        </h2>
        <p class="text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
          Copia l'URL del prodotto Amazon che ti interessa e incollalo nella barra.
        </p>
      </div>

      <div
        class="rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:border-gray-300 dark:border-[rgba(148,163,184,0.1)] dark:bg-[#0a0a0a] dark:hover:border-[rgba(148,163,184,0.2)]"
      >
        <div
          class="mx-auto mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-600 dark:bg-[rgba(20,184,166,0.15)] dark:text-teal-500"
        >
          2
        </div>
        <h2 class="mb-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Analizziamo il prezzo
        </h2>
        <p class="text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
          Confrontiamo il prezzo attuale con il prezzo di listino e con la media delle alternative
          disponibili nella stessa categoria.
        </p>
      </div>

      <div
        class="rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:border-gray-300 dark:border-[rgba(148,163,184,0.1)] dark:bg-[#0a0a0a] dark:hover:border-[rgba(148,163,184,0.2)]"
      >
        <div
          class="mx-auto mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-600 dark:bg-[rgba(20,184,166,0.15)] dark:text-teal-500"
        >
          3
        </div>
        <h2 class="mb-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Scopri il verdetto
        </h2>
        <p class="text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
          Ti diciamo se il prodotto che vuoi acquistare ha un prezzo giusto o ci sono alternative
          migliori al momento.
        </p>
      </div>
    </div>

    <!-- Analysis Example Section -->
    <div
      class="mb-2 mt-16 text-center text-xs font-semibold uppercase tracking-[1.5px] text-teal-600 dark:text-teal-500"
    >
      Esempio di analisi
    </div>
    <h2
      class="mb-8 text-center text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100"
    >
      Ecco cosa ottieni
    </h2>

    <div class="space-y-6">
      <ProductCard :product="mockProduct" demo />
      <TrafficLight :evaluation="mockEvaluation" />
      <AlternativesCarousel :alternatives="mockAlternatives" demo />
    </div>

    <!-- FAQ Section -->
    <FaqSection />
  </main>
</template>
