import { generateGeminiResponse, type GeminiRequestBody } from '../lib/geminiService.ts';

interface ApiRequest {
  method?: string;
  body?: unknown;
  on?(event: string, listener: (chunk: Buffer | string) => void): void;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(data: unknown): void;
  setHeader(name: string, value: string): void;
}

async function readJsonBody(req: ApiRequest): Promise<GeminiRequestBody> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as GeminiRequestBody;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as GeminiRequestBody;
  }

  if (Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString('utf8')) as GeminiRequestBody;
  }

  if (typeof req.on === 'function') {
    const raw = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on!('data', (chunk: Buffer | string) => {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk);
      });
      req.on!('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on!('error', (err: unknown) => reject(err));
    });
    if (raw.trim()) {
      return JSON.parse(raw) as GeminiRequestBody;
    }
  }

  return {};
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  let body: GeminiRequestBody;
  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Invalid JSON request body.' });
    return;
  }

  const result = await generateGeminiResponse(body);
  res.status(result.status).json(result.body);
}
