const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('Impossibile contattare il server. Verifica la tua connessione.');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };

    if (res.status === 429) {
      throw new Error('Troppe richieste. Riprova tra qualche minuto.');
    }
    if (res.status === 404) {
      throw new Error(body.error ?? 'Prodotto non trovato su Amazon.');
    }
    if (res.status === 422) {
      throw new Error(body.error ?? 'Prodotto non disponibile o dati insufficienti.');
    }
    if (res.status >= 500) {
      throw new Error(body.error ?? 'Il servizio non è al momento disponibile. Riprova più tardi.');
    }

    throw new Error(body.error ?? `Errore HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}
