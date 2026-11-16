import { resolveCarImageRequest } from '../lib/puzzleService.ts';

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  send(body: string | Buffer): void;
  setHeader(name: string, value: string): void;
}

function getQueryParam(
  query: Record<string, string | string[] | undefined> | undefined,
  key: string
): string | undefined {
  const val = query?.[key];
  if (Array.isArray(val)) return val[0];
  return val;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).send('Method not allowed');
    return;
  }

  const result = await resolveCarImageRequest({
    id: getQueryParam(req.query, 'id'),
    src: getQueryParam(req.query, 'src'),
  });

  if (!result.buffer || !result.mime) {
    res.status(result.status).send(result.error || 'Image not found');
    return;
  }

  res.setHeader('Content-Type', result.mime);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.status(200).send(result.buffer);
}
