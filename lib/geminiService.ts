import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export interface GeminiRequestBody {
  prompt?: string;
  systemInstruction?: string;
  make?: string;
  model?: string;
  year?: number;
  generation?: string;
  bodyType?: string;
}

export interface GeminiServiceResult {
  status: number;
  body: { text: string } | { error: string };
}

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sanitizeShortText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

export async function generateGeminiResponse(
  payload: GeminiRequestBody
): Promise<GeminiServiceResult> {
  const ai = getClient();
  if (!ai) {
    return {
      status: 500,
      body: {
        error:
          'Server GEMINI_API_KEY is not configured. Add GEMINI_API_KEY to your server environment variables.',
      },
    };
  }

  const rawPrompt = sanitizeShortText(payload.prompt, 2000);
  const make = sanitizeShortText(payload.make, 80);
  const model = sanitizeShortText(payload.model, 80);
  const generation = sanitizeShortText(payload.generation, 40);
  const bodyType = sanitizeShortText(payload.bodyType, 40);
  const year =
    typeof payload.year === 'number' && Number.isFinite(payload.year)
      ? Math.round(payload.year)
      : undefined;

  let contents = rawPrompt;
  let systemInstruction =
    sanitizeShortText(payload.systemInstruction, 600) ||
    'You are an Indian automotive historian and car spotter. Keep replies concise (under 75 words), accurate to Indian-market specifications, and free of markdown headings.';

  if (!contents) {
    if (!make || !model) {
      return {
        status: 400,
        body: { error: 'Provide either a prompt or car make and model.' },
      };
    }

    const carLabel = [year ? String(year) : '', make, model].filter(Boolean).join(' ');
    const meta = [generation, bodyType].filter(Boolean).join(', ');
    contents = `Give concise Indian-market car spotter notes for the ${carLabel}${
      meta ? ` (${meta})` : ''
    }: 1) two distinctive exterior cues (headlights, grille, wheels, pillar, or stance) for identifying this generation in India, and 2) one notable fact about its Indian market run or powertrain.`;
    systemInstruction =
      'You are an Indian automotive specialist for Cardle India. Respond in 2–3 crisp, factual sentences (under 75 words total). Focus strictly on the Indian-market car, visual spotting cues, and Indian heritage or powertrain specs. Plain prose only, no markdown bullet symbols or emojis.';
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return {
        status: 502,
        body: { error: 'Gemini returned an empty response.' },
      };
    }

    return {
      status: 200,
      body: { text },
    };
  } catch (err: unknown) {
    const status =
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      typeof (err as { status?: unknown }).status === 'number'
        ? (err as { status: number }).status
        : 500;

    const rawMessage =
      err instanceof Error ? err.message : 'Failed to generate response from Gemini API.';

    if (status === 403 || /PERMISSION_DENIED|API_KEY_INVALID/i.test(rawMessage)) {
      return {
        status: 403,
        body: {
          error:
            'Gemini API key was rejected or lacks permission. Please verify GEMINI_API_KEY in your server environment.',
        },
      };
    }

    if (status === 429 || /RESOURCE_EXHAUSTED/i.test(rawMessage)) {
      return {
        status: 429,
        body: {
          error: 'Gemini API rate limit reached. Please wait a moment and try again.',
        },
      };
    }

    return {
      status: status >= 400 && status < 600 ? status : 500,
      body: { error: rawMessage },
    };
  }
}
