export interface SpotterNotesInput {
  make: string;
  model: string;
  year: number;
  generation: string;
  bodyType: string;
}

export async function fetchCarSpotterNotes(car: SpotterNotesInput): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      make: car.make,
      model: car.model,
      year: car.year,
      generation: car.generation,
      bodyType: car.bodyType,
    }),
  });

  let data: { text?: string; error?: string } | null = null;
  try {
    data = (await res.json()) as { text?: string; error?: string };
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }

  if (!data?.text) {
    throw new Error('No spotter notes returned from server.');
  }

  return data.text;
}
