import { ref, computed } from 'vue';
import { extractAsin, type AsinExtractionResult } from '@/utils/asin-extractor';

export function useUrlValidation() {
  const url = ref('');
  const submitted = ref(false);

  const result = computed<AsinExtractionResult>(() => extractAsin(url.value));

  const showError = computed(
    () => submitted.value && !result.value.valid && url.value.trim().length > 0,
  );

  const showSuccess = computed(() => result.value.valid);

  function validate(): AsinExtractionResult {
    submitted.value = true;
    return result.value;
  }

  function reset() {
    url.value = '';
    submitted.value = false;
  }

  return {
    url,
    submitted,
    result,
    showError,
    showSuccess,
    validate,
    reset,
  };
}
