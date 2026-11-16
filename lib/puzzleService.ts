import sharp from 'sharp';
import { INDIAN_CARS_CATALOG, type IndianCarCatalogEntry } from '../src/data/indianCarsCatalog.ts';

const USER_AGENT = 'CardleIndia/1.0 (https://cardle-india.app; contact@cardle-india.app)';
const MAX_VERCEL_SAFE_ORIGINAL_BYTES = 3.8 * 1024 * 1024;

export type EraFilter = 'All' | 'Classic' | '2000s' | 'Modern';

export interface OnlinePuzzlePayload {
  id: string;
  make: string;
  model: string;
  year: number;
  generation: string;
  era: 'Classic' | '2000s' | 'Modern';
  bodyType: string;
  image: string;
  focalX: number;
  focalY: number;
  funFact: string;
  source: 'online';
}

interface CachedImage {
  buffer: Buffer;
  mime: string;
}

const imageCache = new Map<string, CachedImage>();
const dailyPuzzleCache = new Map<string, OnlinePuzzlePayload>();
const noImageCache = new Map<string, number>();
const NO_IMAGE_TTL_MS = 30 * 60 * 1000;

function cacheImage(id: string, buffer: Buffer, mime: string): void {
  if (imageCache.size >= 48) {
    const oldestKey = imageCache.keys().next().value;
    if (oldestKey) imageCache.delete(oldestKey);
  }
  imageCache.set(id, { buffer, mime });
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createSeededRng(seedStr: string): () => number {
  let a = hashString(seedStr) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deriveEra(entry: IndianCarCatalogEntry): 'Classic' | '2000s' | 'Modern' {
  if (entry.yearEnd <= 2002 || entry.yearStart < 1995) return 'Classic';
  if (entry.yearEnd <= 2017) return '2000s';
  return 'Modern';
}

function filterCatalogByEra(era: EraFilter): IndianCarCatalogEntry[] {
  if (era === 'All') return INDIAN_CARS_CATALOG;
  if (era === 'Classic') return INDIAN_CARS_CATALOG.filter((c) => c.yearStart < 2000);
  if (era === '2000s') {
    return INDIAN_CARS_CATALOG.filter((c) => c.yearEnd >= 2000 && c.yearStart <= 2014);
  }
  return INDIAN_CARS_CATALOG.filter((c) => c.yearEnd >= 2015);
}

const BAD_FILENAME_RE =
  /(interior|dashboard|cockpit|cabin|steering|engine|motor_?bay|logo|emblem|badge|crest|diagram|chart|flag|plaque|brochure|sketch|render|speedometer|odometer|cluster|trunk|boot|seat|crash|wreck|salvage|scrap|museum_sign|wordmark|tail_?light|head_?light|wheel_only|map|route|atlas|globe|locator|topographic|relief|book|scan|poster|flyer|advert|stamp|coin|banknote|screenshot|blueprint|schematic|chandrayaan|lander|railway|locomotive|\.svg|\.gif|\.pdf|\.webm)/i;

const NON_CAR_RE =
  /(\b(?:map|maps|route\s*map|locator\s*map|atlas|globe|topographic|relief\s*map|diagram|schematic|blueprint|illustration|drawing|painting|engraving|etching|woodcut|lithograph|internet\s*archive|flickr's\s*'the\s*commons'|book\s*images|scanned\s*book|newspaper|magazine\s*cover|postage\s*stamp|banknote|screenshot|dealership\s*sign|showroom\s*exterior|factory\s*gate|assembly\s*line|chandrayaan|lunar\s*rover|pragyan|spacecraft|railway|locomotive|traffic\s*jam|street\s*scene|skyline|panorama)\b)/i;

const MODIFIED_CAR_RE =
  /(\b(?:modified|customised|customized|custom\s+(?:build|car|paint|job|interior|wheels?|rims?|bumper|exhaust|grille|suv|jeep|thar|gypsy|ambassador)|tuned|tuning|body\s*kit|bodykit|wide\s*body|widebody|aftermarket|replica|kit\s*car|restomod|rally\s+(?:car|spec|edition|build|raid)|race\s*car|racing\s+car|drift\s*car|drag\s*car|concept\s*car|prototype|art\s*car|wedding\s*car|decorated|flower\s*decoration|police|ambulance|patrol\s*car|fire\s*brigade|camper|motorhome|lifted|lowered|slammed|stanced|bull\s*bar|bullbar|light\s*bar|led\s*bar|snorkel|roll\s*cage|matte\s*wrap|vinyl\s*wrap|wrapped\s+in|stickers|livery|decal|stunt|ola\s+cab|uber\s+cab)\b)/i;

const AUTO_CONTEXT_RE =
  /\b(automobiles?|cars?|vehicles?|suvs?|sedans?|hatchbacks?|mpvs?|coupes?|convertibles?|roadsters?|crossovers?|station\s*wagons?|auto\s*expo|bharat\s*mobility|motor\s*show|motorsport|spotting|car\s*spotting|maruti|suzuki|tata\s*motors|mahindra|hyundai|honda|toyota|kia|skoda|volkswagen|renault|nissan|ford|fiat|jeep|land\s*rover|range\s*rover|jaguar|bmw|mercedes|audi|volvo|porsche|lamborghini|ferrari|rolls-royce|bentley|maserati|aston\s*martin|mclaren|mg\s*motor|citroen|byd|isuzu|mitsubishi|hindustan|premier|chevrolet|opel|datsun|daewoo|tesla)\b/i;

const FOREIGN_LOCATION_RE =
  /(\b(?:in|at|from|near)\s+(?:china|japan|south korea|korea|germany|france|the united kingdom|united kingdom|uk|england|scotland|wales|ireland|italy|spain|portugal|russia|thailand|indonesia|malaysia|singapore|vietnam|the philippines|philippines|taiwan|brazil|argentina|chile|australia|new zealand|canada|mexico|poland|netherlands|the netherlands|belgium|sweden|norway|denmark|finland|switzerland|austria|czech|hungary|romania|greece|turkey|ukraine|south africa|egypt|nigeria|kenya|morocco|saudi arabia|uae|united arab emirates|dubai|abu dhabi|qatar|oman|kuwait|bahrain|pakistan|bangladesh|sri lanka|nepal|bhutan|myanmar|the united states|united states|usa|america)\b|\b(?:guangzhou|shanghai|beijing|chengdu|shenzhen|wuhan|chongqing|hong kong|tokyo|osaka|yokohama|nagoya|seoul|busan|bangkok|pattaya|jakarta|surabaya|kuala lumpur|penang|manila|taipei|berlin|munich|stuttgart|frankfurt|cologne|wolfsburg|hamburg|geneva|zurich|paris|lyon|marseille|london|birmingham|manchester|glasgow|rome|milan|turin|madrid|barcelona|moscow|st petersburg|toronto|vancouver|montreal|sydney|melbourne|brisbane|auckland|karachi|lahore|islamabad|rawalpindi|dhaka|chittagong|colombo|kathmandu|new york|los angeles|chicago|detroit|miami|houston|san francisco|california|texas|florida|ontario|alberta|giias|auto china|iaa mobility|geneva motor show|tokyo motor show|paris motor show|bangkok international motor show)\b)/i;

const INDIA_LOCATION_RE =
  /\b(india|indian|bharat|auto expo|bharat mobility|mumbai|bombay|new delhi|delhi|ncr|bengaluru|bangalore|chennai|madras|kolkata|calcutta|hyderabad|pune|poona|ahmedabad|jaipur|goa|panaji|kochi|cochin|kerala|thiruvananthapuram|trivandrum|chandigarh|gurugram|gurgaon|noida|greater noida|faridabad|ghaziabad|surat|vadodara|baroda|rajkot|nagpur|nashik|aurangabad|indore|bhopal|lucknow|kanpur|varanasi|agra|patna|ranchi|bhubaneswar|cuttack|guwahati|coimbatore|madurai|mysuru|mysore|mangaluru|mangalore|visakhapatnam|vizag|vijayawada|shimla|manali|leh|ladakh|srinagar|jammu|dehradun|rishikesh|haridwar|udaipur|jodhpur|jaisalmer|amritsar|ludhiana|jalandhar|raipur|bilaspur|pondicherry|puducherry|shillong|gangtok|maharashtra|karnataka|tamil nadu|gujarat|rajasthan|west bengal|uttar pradesh|haryana|punjab|telangana|andhra pradesh|odisha|madhya pradesh|bihar|jharkhand|assam|himachal pradesh|uttarakhand|chhattisgarh|uttarpara|manesar|sriperumbudur|chakan|sanand|halol|oragadam|hosur|vellore|tirupati|hampi|ooty|munnar|kovalam|alappuzha|thrissur|kozhikode|calicut|maruti\s+suzuki|hindustan\s+ambassador|premier\s+padmini|tata\s+motors\s+india)\b/i;

function stripHtml(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function isInsideIndiaBBox(latRaw: string | undefined, lonRaw: string | undefined): boolean | null {
  if (!latRaw || !lonRaw) return null;
  const lat = Number.parseFloat(latRaw);
  const lon = Number.parseFloat(lonRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return lat >= 6.5 && lat <= 37.2 && lon >= 68.0 && lon <= 97.5;
}

function buildSearchTerms(entry: IndianCarCatalogEntry): string[] {
  const queries: string[] = [];
  if (entry.make === 'Maruti Suzuki') {
    queries.push(`"Maruti ${entry.model}" India filetype:bitmap`);
    queries.push(`"Suzuki ${entry.model}" India filetype:bitmap`);
  } else if (entry.make === 'Hindustan Motors') {
    queries.push(`"Hindustan ${entry.model}" India filetype:bitmap`);
  } else if (entry.make === 'DC Design') {
    queries.push(`"DC Avanti" India filetype:bitmap`);
  } else {
    queries.push(`"${entry.make} ${entry.model}" India filetype:bitmap`);
    queries.push(`"${entry.make}" "${entry.model}" India filetype:bitmap`);
  }
  return queries;
}

function getMakeAliases(make: string): string[] {
  const m = make.toLowerCase();
  if (m === 'maruti suzuki') return ['maruti', 'suzuki'];
  if (m === 'hindustan motors') return ['hindustan'];
  if (m === 'mercedes-benz') return ['mercedes', 'maybach'];
  if (m === 'volkswagen') return ['volkswagen', 'vw'];
  if (m === 'land rover') return ['land rover', 'range rover'];
  if (m === 'rolls-royce') return ['rolls-royce', 'rolls royce'];
  if (m === 'aston martin') return ['aston martin'];
  if (m === 'dc design') return ['dc avanti', 'dc design'];
  if (m === 'mg') return ['mg', 'morris garages'];
  if (m === 'force') return ['force', 'tempo'];
  return [m];
}

interface CandidateImage {
  title: string;
  downloadUrl: string;
  width: number;
  height: number;
  mime: string;
  score: number;
  detectedYear: number | null;
}

function extractMatchingYear(text: string, yearStart: number, yearEnd: number): number | null {
  const matches = text.match(/\b(19[5-9]\d|20[0-2]\d)\b/g);
  if (!matches) return null;
  for (const m of matches) {
    const yr = Number(m);
    if (yr >= yearStart - 1 && yr <= yearEnd + 1) {
      return Math.max(yearStart, Math.min(yearEnd, yr));
    }
  }
  return null;
}

function extractStrictDateTimeYear(
  rawDateTime: string | undefined,
  yearStart: number,
  yearEnd: number
): number | null {
  if (!rawDateTime) return null;
  const m = rawDateTime.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  if (!m) return null;
  const yr = Number(m[1]);
  if (yr >= yearStart && yr <= yearEnd) {
    return yr;
  }
  return null;
}

function failsModelVariantGuard(model: string, metadataLower: string): boolean {
  const m = model.toLowerCase();

  if (m === 'brezza' && metadataLower.includes('vitara brezza')) return true;
  if (m === 'vitara brezza' && !metadataLower.includes('vitara')) return true;

  if (m === 'dzire' && metadataLower.includes('swift dzire')) return true;
  if (m === 'swift dzire' && !metadataLower.includes('swift')) return true;

  if (m === 'scorpio' && (metadataLower.includes('scorpio-n') || metadataLower.includes('scorpio n') || metadataLower.includes('getaway'))) return true;
  if (m === 'scorpio-n' && !metadataLower.includes('scorpio-n') && !metadataLower.includes('scorpio n')) return true;

  if (m === 'thar' && metadataLower.includes('roxx')) return true;
  if (m === 'thar roxx' && !metadataLower.includes('roxx')) return true;

  if (m === 'alto' && (metadataLower.includes('alto k10') || metadataLower.includes('alto 800'))) return true;
  if (m === 'i10' && metadataLower.includes('grand i10')) return true;
  if (m === 'grand i10' && metadataLower.includes('nios')) return true;
  if (m === 'i20' && (metadataLower.includes('n line') || metadataLower.includes('i20 active'))) return true;
  if (m === 'innova' && (metadataLower.includes('crysta') || metadataLower.includes('hycross'))) return true;
  if (m === 'fortuner' && metadataLower.includes('legender')) return true;

  const isEvModel = m.endsWith(' ev') || m.includes('electric') || m === 'ev6' || m === 'ev9' || m === 'ec3';
  if (isEvModel && !/\b(ev|electric|ec3)\b/i.test(metadataLower)) return true;
  if (
    !isEvModel &&
    /\b(nexon|punch|tiago|tigor|harrier|safari|altroz|curvv|sierra|creta)\s+(ev|electric)\b/i.test(
      metadataLower
    )
  ) {
    return true;
  }

  return false;
}

interface CommonsPageInfo {
  title: string;
  categories?: Array<{ title: string }>;
  imageinfo?: Array<{
    width: number;
    height: number;
    size?: number;
    mime: string;
    thumburl?: string;
    url?: string;
    extmetadata?: {
      ImageDescription?: { value?: string };
      ObjectName?: { value?: string };
      DateTimeOriginal?: { value?: string };
      GPSLatitude?: { value?: string };
      GPSLongitude?: { value?: string };
      Categories?: { value?: string };
    };
  }>;
}

function evaluateCommonsPage(
  page: CommonsPageInfo,
  entry: IndianCarCatalogEntry,
  fromWikiInfobox: boolean
): CandidateImage | null {
  const info = page.imageinfo?.[0];
  if (!info) return null;

  const mime = info.mime || '';
  if (!mime.startsWith('image/') || mime === 'image/svg+xml' || mime === 'image/gif') {
    return null;
  }

  if (info.width < 1000 || info.height < 560 || info.width < info.height * 1.05) {
    return null;
  }

  if (BAD_FILENAME_RE.test(page.title)) {
    return null;
  }

  const cleanTitle = page.title
    .replace(/^File:/i, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ');
  const desc = stripHtml(info.extmetadata?.ImageDescription?.value);
  const objName = stripHtml(info.extmetadata?.ObjectName?.value);
  const extCats = stripHtml(info.extmetadata?.Categories?.value);
  const pageCats = (page.categories || []).map((c) => c.title.replace(/^Category:/i, '')).join(' | ');
  const titleAndCats = `${cleanTitle} | ${pageCats} | ${extCats}`;
  const combinedText = `${cleanTitle} | ${objName} | ${desc} | ${pageCats} | ${extCats}`;
  const lowerCombined = combinedText.toLowerCase();
  const lowerTitleAndCats = titleAndCats.toLowerCase();

  if (
    NON_CAR_RE.test(titleAndCats) ||
    NON_CAR_RE.test(desc) ||
    MODIFIED_CAR_RE.test(titleAndCats) ||
    MODIFIED_CAR_RE.test(desc)
  ) {
    return null;
  }

  const gpsInsideIndia = isInsideIndiaBBox(
    info.extmetadata?.GPSLatitude?.value,
    info.extmetadata?.GPSLongitude?.value
  );
  if (gpsInsideIndia === false) {
    return null;
  }
  if (gpsInsideIndia !== true && FOREIGN_LOCATION_RE.test(titleAndCats)) {
    return null;
  }
  if (
    gpsInsideIndia !== true &&
    /\b(?:taken|photographed|spotted|seen|parked|displayed|showcased)\s+(?:in|at|near)\s+(?:china|japan|south korea|korea|germany|france|uk|united kingdom|england|italy|spain|russia|thailand|indonesia|malaysia|singapore|vietnam|philippines|taiwan|brazil|australia|canada|mexico|uae|dubai|pakistan|bangladesh|sri lanka|nepal|usa|united states)\b/i.test(
      desc
    )
  ) {
    return null;
  }
  const hasIndiaProof = gpsInsideIndia === true || INDIA_LOCATION_RE.test(combinedText);
  if (!hasIndiaProof) {
    return null;
  }

  if (failsModelVariantGuard(entry.model, lowerCombined)) {
    return null;
  }

  const makeAliases = getMakeAliases(entry.make);
  const hasMakeInTitleOrCats = makeAliases.some((alias) => lowerTitleAndCats.includes(alias));
  if (!hasMakeInTitleOrCats) {
    return null;
  }

  const normalizedModel = entry.model.toLowerCase().replace(/[-_]+/g, ' ');
  const modelTokens = normalizedModel.split(/\s+/).filter((t) => t.length >= 2);
  const hasExactModelInTitleOrCats =
    lowerTitleAndCats.includes(normalizedModel) ||
    (modelTokens.length > 0 && modelTokens.every((t) => lowerTitleAndCats.includes(t)));
  if (!hasExactModelInTitleOrCats) {
    return null;
  }

  if (!AUTO_CONTEXT_RE.test(titleAndCats)) {
    return null;
  }

  // Keep payload safe for Vercel Serverless (< 4.5 MB) while staying 2K–4K crisp
  const isWebRaster = mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp';
  const useOriginal = Boolean(
    info.url && isWebRaster && info.size && info.size <= MAX_VERCEL_SAFE_ORIGINAL_BYTES
  );
  const downloadUrl = useOriginal ? info.url! : info.thumburl || info.url;
  if (!downloadUrl) return null;

  const lowerTitle = cleanTitle.toLowerCase();
  const matchedInTitle = modelTokens.filter((t) => lowerTitle.includes(t)).length;

  let score = fromWikiInfobox ? 25 : 20;
  score += matchedInTitle * 25;
  if (lowerTitle.includes(normalizedModel)) score += 30;
  if (makeAliases.some((alias) => lowerTitle.includes(alias))) score += 20;

  if (gpsInsideIndia === true) score += 20;
  if (/\b(india|mumbai|delhi|bengaluru|bangalore|chennai|pune|hyderabad|kolkata|auto expo|bharat mobility)\b/i.test(page.title)) {
    score += 18;
  }

  if (info.width >= 3000) score += 35;
  else if (info.width >= 1920) score += 25;
  else if (info.width >= 1280) score += 12;

  const detectedYear =
    extractMatchingYear(`${cleanTitle} | ${objName} | ${desc} | ${pageCats}`, entry.yearStart, entry.yearEnd) ??
    extractStrictDateTimeYear(info.extmetadata?.DateTimeOriginal?.value, entry.yearStart, entry.yearEnd);

  if (detectedYear !== null) {
    score += 45;
  }

  if (/\b(front|rear|side|3\/4|quarter|parked|spotted)\b/i.test(lowerCombined)) {
    score += 10;
  }

  return {
    title: page.title,
    downloadUrl,
    width: info.width,
    height: info.height,
    mime,
    score,
    detectedYear,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url: string, timeoutMs = 8000): Promise<unknown> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT },
      });
      if (res.status === 429 || res.status === 503) {
        clearTimeout(timer);
        if (attempt === 0) {
          await sleep(600);
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('Wikimedia request failed');
}

async function fetchCommonsPagesByTitle(titles: string[]): Promise<CommonsPageInfo[]> {
  if (titles.length === 0) return [];
  const joined = titles.map((t) => (t.startsWith('File:') ? t : `File:${t}`)).join('|');
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    joined
  )}&prop=imageinfo|categories&cllimit=30&iiprop=url|size|mime|extmetadata&iiurlwidth=2560&format=json`;
  try {
    const data = (await fetchJsonWithRetry(url)) as {
      query?: { pages?: Record<string, CommonsPageInfo> };
    };
    return Object.values(data.query?.pages || {});
  } catch {
    return [];
  }
}

async function searchWikiAndCommons(
  entry: IndianCarCatalogEntry
): Promise<{ candidates: CandidateImage[]; extract: string }> {
  const queries = buildSearchTerms(entry);
  const wikiQuery =
    entry.make === 'Maruti Suzuki'
      ? `Maruti ${entry.model} car`
      : `${entry.make} ${entry.model} car`;

  const merged = new Map<string, CandidateImage>();

  for (const q of queries) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=12&gsrsearch=${encodeURIComponent(
      q
    )}&prop=imageinfo|categories&cllimit=30&iiprop=url|size|mime|extmetadata&iiurlwidth=2560&format=json`;
    try {
      const data = (await fetchJsonWithRetry(url)) as {
        query?: { pages?: Record<string, CommonsPageInfo> };
      };
      for (const page of Object.values(data.query?.pages || {})) {
        const evaluated = evaluateCommonsPage(page, entry, false);
        if (evaluated) {
          const existing = merged.get(evaluated.downloadUrl);
          if (!existing || evaluated.score > existing.score) {
            merged.set(evaluated.downloadUrl, evaluated);
          }
        }
      }
      if (merged.size >= 3) break;
    } catch {
      // Continue to next query
    }
    await sleep(120);
  }

  let extract = '';
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      wikiQuery
    )}&gsrlimit=2&prop=pageimages|extracts&exintro=1&explaintext=1&exsentences=2&piprop=name&format=json`;
    const data = (await fetchJsonWithRetry(wikiUrl)) as {
      query?: {
        pages?: Record<
          string,
          {
            index: number;
            title: string;
            extract?: string;
            pageimage?: string;
          }
        >;
      };
    };
    const pages = Object.values(data.query?.pages || {}).sort((a, b) => a.index - b.index);
    const top = pages[0];
    if (top) {
      extract = top.extract?.trim() || '';
      const pageTitleLower = top.title.toLowerCase();
      const modelLower = entry.model.toLowerCase();
      const isRelevant =
        pageTitleLower.includes(modelLower) ||
        modelLower.split(/[\s-]+/).some((t) => t.length >= 3 && pageTitleLower.includes(t));

      if (isRelevant && top.pageimage) {
        const commonsPages = await fetchCommonsPagesByTitle([top.pageimage]);
        for (const cp of commonsPages) {
          const evaluated = evaluateCommonsPage(cp, entry, true);
          if (evaluated) {
            const existing = merged.get(evaluated.downloadUrl);
            if (!existing || evaluated.score > existing.score) {
              merged.set(evaluated.downloadUrl, evaluated);
            }
          }
        }
      }
    }
  } catch {
    // Ignore Wikipedia extract error
  }

  const sorted = Array.from(merged.values()).sort((a, b) => b.score - a.score);
  return { candidates: sorted, extract };
}

async function pickSensibleCarPartFocalPoint(
  imageBuffer: Buffer,
  rng: () => number
): Promise<{ focalX: number; focalY: number }> {
  try {
    const W = 320;
    const H = 180;
    const rawRgb = await sharp(imageBuffer)
      .resize(W, H, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer();

    const lum = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const idx = i * 3;
      lum[i] = 0.299 * rawRgb[idx] + 0.587 * rawRgb[idx + 1] + 0.114 * rawRgb[idx + 2];
    }

    const edge = new Float32Array(W * H);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const tl = lum[(y - 1) * W + (x - 1)];
        const tc = lum[(y - 1) * W + x];
        const tr = lum[(y - 1) * W + (x + 1)];
        const ml = lum[y * W + (x - 1)];
        const mr = lum[y * W + (x + 1)];
        const bl = lum[(y + 1) * W + (x - 1)];
        const bc = lum[(y + 1) * W + x];
        const br = lum[(y + 1) * W + (x + 1)];

        const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
        const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
        edge[y * W + x] = Math.min(255, Math.abs(gx) + Math.abs(gy));
      }
    }

    const patchW = 36;
    const patchH = 24;
    const halfW = Math.floor(patchW / 2);
    const halfH = Math.floor(patchH / 2);

    interface PartCandidate {
      focalX: number;
      focalY: number;
      score: number;
    }
    const candidates: PartCandidate[] = [];

    for (let fy = 34; fy <= 62; fy += 4) {
      for (let fx = 28; fx <= 72; fx += 4) {
        const cx = Math.round((fx / 100) * W);
        const cy = Math.round((fy / 100) * H);
        const x0 = Math.max(1, Math.min(W - patchW - 1, cx - halfW));
        const y0 = Math.max(1, Math.min(H - patchH - 1, cy - halfH));

        let sumEdge = 0;
        let strongEdges = 0;
        let sumL = 0;
        let sumL2 = 0;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let greenFoliage = 0;
        const count = patchW * patchH;

        for (let py = y0; py < y0 + patchH; py++) {
          for (let px = x0; px < x0 + patchW; px++) {
            const pIdx = py * W + px;
            const e = edge[pIdx];
            const l = lum[pIdx];
            sumEdge += e;
            if (e >= 55) strongEdges++;
            sumL += l;
            sumL2 += l * l;

            const rgbIdx = pIdx * 3;
            const r = rawRgb[rgbIdx];
            const g = rawRgb[rgbIdx + 1];
            const b = rawRgb[rgbIdx + 2];
            sumR += r;
            sumG += g;
            sumB += b;
            if (g > r + 12 && g > b + 12) greenFoliage++;
          }
        }

        const avgEdge = sumEdge / count;
        const strongRatio = strongEdges / count;
        const meanL = sumL / count;
        const stdevL = Math.sqrt(Math.max(0, sumL2 / count - meanL * meanL));
        const meanR = sumR / count;
        const meanG = sumG / count;
        const meanB = sumB / count;
        const greenRatio = greenFoliage / count;

        if (meanR > 215 && meanG > 215 && meanB > 215 && strongRatio < 0.25) continue;
        if (meanB > meanR + 22 && meanL > 145) continue;
        if (greenRatio > 0.32) continue;
        if (fy >= 60 && strongRatio < 0.18 && stdevL < 24) continue;
        if (strongRatio < 0.1) continue;

        const centralWeight = 1 - (Math.abs(fx - 50) / 50) * 0.15;
        const zoneWeight = fy >= 42 && fy <= 58 ? 1.15 : fy >= 30 && fy <= 40 ? 1.05 : 1.0;
        const score = (avgEdge * 1.3 + strongRatio * 140 + stdevL * 0.9) * centralWeight * zoneWeight;

        candidates.push({ focalX: fx, focalY: fy, score });
      }
    }

    if (candidates.length === 0) {
      return { focalX: 44, focalY: 50 };
    }

    candidates.sort((a, b) => b.score - a.score);
    const distinctPeaks: PartCandidate[] = [];
    for (const cand of candidates) {
      const tooClose = distinctPeaks.some(
        (p) => Math.hypot(p.focalX - cand.focalX, p.focalY - cand.focalY) < 12
      );
      if (!tooClose) {
        distinctPeaks.push(cand);
        if (distinctPeaks.length >= 4) break;
      }
    }

    const pool = distinctPeaks.length > 0 ? distinctPeaks : candidates.slice(0, 3);
    const chosen = pool[Math.floor(rng() * pool.length)];
    return { focalX: chosen.focalX, focalY: chosen.focalY };
  } catch {
    return { focalX: 44, focalY: 50 };
  }
}

async function buildPuzzleForEntry(
  entry: IndianCarCatalogEntry,
  rng: () => number
): Promise<OnlinePuzzlePayload | null> {
  const cacheKey = `${entry.make}::${entry.model}`;
  const failedAt = noImageCache.get(cacheKey);
  if (failedAt && Date.now() - failedAt < NO_IMAGE_TTL_MS) {
    return null;
  }

  const { candidates, extract } = await searchWikiAndCommons(entry);
  if (candidates.length === 0) {
    noImageCache.set(cacheKey, Date.now());
    return null;
  }

  const yearVerified = candidates.filter((c) => c.detectedYear !== null);
  const candidatePool = yearVerified.length > 0 ? yearVerified : candidates;
  const topPool = candidatePool.slice(0, Math.min(4, candidatePool.length));
  const chosen = topPool[Math.floor(rng() * topPool.length)];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14000);
  let imgBuf: Buffer;
  let mime = chosen.mime;
  try {
    const imgRes = await fetch(chosen.downloadUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!imgRes.ok) return null;
    const arrayBuf = await imgRes.arrayBuffer();
    imgBuf = Buffer.from(arrayBuf);
    mime = imgRes.headers.get('content-type') || chosen.mime;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }

  const { focalX, focalY } = await pickSensibleCarPartFocalPoint(imgBuf, rng);

  const imageId = `car_${hashString(`${entry.make}_${entry.model}_${chosen.downloadUrl}_${Date.now()}`).toString(36)}_${Math.floor(rng() * 1e5)}`;
  cacheImage(imageId, imgBuf, mime);

  const encodedSrc = Buffer.from(chosen.downloadUrl, 'utf8').toString('base64url');
  const year =
    chosen.detectedYear ??
    Math.round((entry.yearStart + Math.min(2025, entry.yearEnd)) / 2);

  const fallbackFact = `Sold in India from ${entry.yearStart} to ${
    entry.yearEnd === 2026 ? 'present' : entry.yearEnd
  } as a ${entry.bodyType.toLowerCase()}.`;

  return {
    id: `${entry.make}-${entry.model}-${year}-${imageId}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
    make: entry.make,
    model: entry.model,
    year,
    generation: `${entry.yearStart}–${entry.yearEnd === 2026 ? 'Present' : entry.yearEnd}`,
    era: deriveEra(entry),
    bodyType: entry.bodyType,
    image: `/api/car-image?id=${encodeURIComponent(imageId)}&src=${encodeURIComponent(encodedSrc)}`,
    focalX,
    focalY,
    funFact: extract || fallbackFact,
    source: 'online',
  };
}

export async function resolvePuzzleRequest(params: {
  mode?: string;
  era?: string;
  date?: string;
  exclude?: string;
}): Promise<{ status: number; body: OnlinePuzzlePayload | { error: string } }> {
  const mode = params.mode === 'daily' ? 'daily' : 'practice';
  const eraParam = (params.era || 'All') as EraFilter;
  const era: EraFilter = ['All', 'Classic', '2000s', 'Modern'].includes(eraParam)
    ? eraParam
    : 'All';
  const dateKey = String(params.date || new Date().toISOString().slice(0, 10));
  const excludedModels = new Set(
    String(params.exclude || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );

  if (mode === 'daily') {
    const existing = dailyPuzzleCache.get(dateKey);
    if (existing) {
      return { status: 200, body: existing };
    }

    const rng = createSeededRng(`cardle-india-daily-${dateKey}`);
    const startIndex = Math.floor(rng() * INDIAN_CARS_CATALOG.length);

    for (let offset = 0; offset < 20; offset++) {
      const entry = INDIAN_CARS_CATALOG[(startIndex + offset * 17) % INDIAN_CARS_CATALOG.length];
      const puzzle = await buildPuzzleForEntry(entry, rng);
      if (puzzle) {
        dailyPuzzleCache.set(dateKey, puzzle);
        return { status: 200, body: puzzle };
      }
    }

    return {
      status: 503,
      body: { error: 'Unable to fetch daily India-verified car image' },
    };
  }

  const pool = filterCatalogByEra(era);
  const filteredPool =
    pool.length > 5
      ? pool.filter((e) => !excludedModels.has(`${e.make}::${e.model}`))
      : pool;
  const finalPool = filteredPool.length > 0 ? filteredPool : pool;

  const rng = Math.random;
  const tried = new Set<number>();

  for (let attempt = 0; attempt < 18 && tried.size < finalPool.length; attempt++) {
    const idx = Math.floor(rng() * finalPool.length);
    if (tried.has(idx)) continue;
    tried.add(idx);

    const entry = finalPool[idx];
    const puzzle = await buildPuzzleForEntry(entry, rng);
    if (puzzle) {
      return { status: 200, body: puzzle };
    }
  }

  return {
    status: 503,
    body: { error: 'Unable to fetch India-verified car image from online archive' },
  };
}

function isAllowedWikimediaUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && parsed.hostname === 'upload.wikimedia.org';
  } catch {
    return false;
  }
}

export async function resolveCarImageRequest(params: {
  id?: string;
  src?: string;
}): Promise<{ status: number; buffer?: Buffer; mime?: string; error?: string }> {
  const id = String(params.id || '');
  if (id) {
    const cached = imageCache.get(id);
    if (cached) {
      return { status: 200, buffer: cached.buffer, mime: cached.mime };
    }
  }

  // Stateless fallback for cold Vercel serverless instances
  const srcParam = String(params.src || '');
  if (srcParam) {
    let decodedUrl = '';
    try {
      decodedUrl = Buffer.from(srcParam, 'base64url').toString('utf8');
    } catch {
      decodedUrl = '';
    }

    if (decodedUrl && isAllowedWikimediaUrl(decodedUrl)) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 14000);
      try {
        const res = await fetch(decodedUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': USER_AGENT },
        });
        if (!res.ok) {
          return { status: 502, error: 'Failed to retrieve upstream car image' };
        }
        const mime = res.headers.get('content-type') || 'image/jpeg';
        if (!mime.startsWith('image/')) {
          return { status: 415, error: 'Upstream resource is not an image' };
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        if (id) {
          cacheImage(id, buffer, mime);
        }
        return { status: 200, buffer, mime };
      } catch {
        return { status: 504, error: 'Timed out fetching car image' };
      } finally {
        clearTimeout(timer);
      }
    }
  }

  return { status: 404, error: 'Image expired or not found' };
}
