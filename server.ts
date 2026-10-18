import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

interface SearchRequestBody {
  query?: string;
  niche?: string;
  city?: string;
  state?: string;
  pageSize?: number;
  onlyWithoutWebsite?: boolean;
  apiKey?: string;
}

// Helper to calculate opportunity score & signals
function buildSignalsAndScore(place: {
  hasWebsite: boolean;
  rating: number;
  reviewCount: number;
  hasPhone: boolean;
}) {
  const signals = [
    {
      key: 'no_website',
      label: place.hasWebsite ? 'Possui site cadastrado' : 'Sem site cadastrado no Maps',
      points: place.hasWebsite ? 0 : 35,
      active: !place.hasWebsite,
      explanation: place.hasWebsite
        ? 'A empresa já possui presença web registrada.'
        : 'Empresas sem site têm alta urgência para contratar criação de website e cardápio/catálogo digital.',
    },
    {
      key: 'high_reviews',
      label: place.reviewCount > 20 ? 'Excelente volume de avaliações' : 'Poucas avaliações',
      points: place.reviewCount > 20 ? 25 : 10,
      active: place.reviewCount > 20,
      explanation: 'Alto volume de clientes ativos buscando no Google.',
    },
    {
      key: 'high_rating',
      label: place.rating >= 4.2 ? 'Boa reputação (nota 4.2+)' : 'Avaliação moderada',
      points: place.rating >= 4.2 ? 20 : 10,
      active: place.rating >= 4.2,
      explanation: 'Clientes satisfeitos indicam operação saudável e receita recorrente.',
    },
    {
      key: 'has_phone',
      label: place.hasPhone ? 'Telefone WhatsApp disponível' : 'Sem telefone público',
      points: place.hasPhone ? 20 : 0,
      active: place.hasPhone,
      explanation: 'Canal de fechamento direto e rápido pelo WhatsApp.',
    },
  ];

  const totalScore = signals
    .filter((s) => s.active)
    .reduce((acc, curr) => acc + curr.points, 0);

  let opportunityLevel: 'alta' | 'media' | 'baixa' = 'baixa';
  if (totalScore >= 70) opportunityLevel = 'alta';
  else if (totalScore >= 40) opportunityLevel = 'media';

  return { signals, score: Math.min(100, Math.max(20, totalScore)), opportunityLevel };
}

// Normalize Brazilian telephone numbers without inventing data
function normalizeBrazilianPhone(phoneRaw: string | undefined | null): {
  phone: string;
  rawPhone: string;
  isLandline: boolean;
} | null {
  if (!phoneRaw || typeof phoneRaw !== 'string') {
    return null;
  }
  const digits = phoneRaw.replace(/\D/g, '');
  if (!digits || digits.length < 8) {
    return null;
  }
  // Strip leading zeros
  let cleaned = digits.replace(/^0+/, '');
  // Add 55 if missing
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  // DDD (2 digits after 55) and local number
  const ddd = cleaned.slice(2, 4);
  const number = cleaned.slice(4);

  // If local number has 8 digits or 9 digits without leading 9, it's landline (fixo)
  const isLandline = number.length === 8 || (number.length === 9 && !number.startsWith('9'));

  let formatted = phoneRaw;
  if (number.length === 8) {
    formatted = `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
  } else if (number.length === 9) {
    formatted = `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
  }

  return {
    phone: formatted,
    rawPhone: cleaned,
    isLandline,
  };
}

// ============================================================
// APIFY INTEGRATION (MODO ECONÔMICO - BUSCA SEM SCORE)
// ============================================================

// GET /api/apify/status: Returns whether APIFY_TOKEN is configured without revealing it
app.get('/api/apify/status', (_req: Request, res: Response) => {
  const token = process.env.APIFY_TOKEN;
  const isConfigured = Boolean(token && token !== 'MY_APIFY_TOKEN' && token.trim().length > 10);
  res.json({
    configured: isConfigured,
  });
});

// POST /api/apify/test: Tests Apify token against https://api.apify.com/v2/users/me
app.post('/api/apify/test', async (_req: Request, res: Response) => {
  const token = process.env.APIFY_TOKEN;
  if (!token || token === 'MY_APIFY_TOKEN' || token.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'TOKEN_MISSING',
      message: 'Token do Apify não configurado no servidor. Configure a variável APIFY_TOKEN nos Secrets do AI Studio.',
    });
  }

  try {
    const response = await fetch('https://api.apify.com/v2/users/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Token do Apify inválido ou expirado. Verifique o valor em APIFY_TOKEN.',
        });
      }
      const errText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: 'APIFY_ERROR',
        message: `Falha na requisição ao Apify (${response.status}): ${errText}`,
      });
    }

    const data: any = await response.json();
    const username = data?.data?.username || data?.data?.email || data?.data?.name || 'Conectado';
    return res.json({
      success: true,
      username,
      message: `Conexão bem-sucedida! Usuário Apify: ${username}`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'NETWORK_ERROR',
      message: err.message || 'Erro de rede ao conectar com Apify.',
    });
  }
});

// POST /api/apify/search: Economical search using Actor compass/crawler-google-places
app.post('/api/apify/search', async (req: Request, res: Response) => {
  try {
    const token = process.env.APIFY_TOKEN;
    if (!token || token === 'MY_APIFY_TOKEN' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'TOKEN_MISSING',
        message: 'Token do Apify não configurado no servidor. Adicione a variável APIFY_TOKEN nos Secrets do AI Studio.',
      });
    }

    const {
      niche = 'Hamburgueria',
      city = 'Barueri',
      state = 'SP',
      pageSize = 20,
      onlyWithoutWebsite = true,
    } = req.body;

    const targetQuantity = Math.max(1, Math.min(200, pageSize));
    const locationQuery = `${city}, ${state}, Brasil`;
    // Limite de custo: quantidade x 0,008 + 0,02 dólar
    const maxTotalChargeUsd = Number((targetQuantity * 0.008 + 0.02).toFixed(4));

    // Input configurado para gastar o mínimo: sem reviews, sem imagens, sem place details, sem contatos extras
    const actorInput = {
      searchStringsArray: [niche],
      locationQuery,
      maxCrawledPlacesPerSearch: targetQuantity,
      language: 'pt-BR',
      countryCode: 'br',
      website: onlyWithoutWebsite ? 'withoutWebsite' : 'allPlaces',
      skipClosedPlaces: true,
      scrapePlaceDetailPage: false,
      scrapeContactDetails: false,
      scrapeReviews: false,
      maxReviews: 0,
      scrapeImages: 0,
      maxImages: 0,
    };

    // 1. Iniciar execução do Actor compass~crawler-google-places
    const runUrl = `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?maxTotalChargeUsd=${maxTotalChargeUsd}`;
    const startRes = await fetch(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify(actorInput),
    });

    if (!startRes.ok) {
      const errText = await startRes.text();
      console.error(`Apify run start failed (${startRes.status}):`, errText);
      if (startRes.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Token do Apify inválido ou expirado. Verifique APIFY_TOKEN nos Secrets.',
        });
      }
      if (startRes.status === 402 || errText.toLowerCase().includes('credit') || errText.toLowerCase().includes('insufficient')) {
        return res.status(402).json({
          success: false,
          error: 'CREDIT_EXHAUSTED',
          message: 'Crédito esgotado na sua conta do Apify. Recarregue seus créditos para continuar.',
        });
      }
      return res.status(startRes.status).json({
        success: false,
        error: 'APIFY_START_ERROR',
        message: `Erro ao iniciar busca no Apify: ${errText}`,
      });
    }

    const runInfo: any = await startRes.json();
    const runId = runInfo?.data?.id;
    const defaultDatasetId = runInfo?.data?.defaultDatasetId;

    if (!runId || !defaultDatasetId) {
      throw new Error('Apify não retornou runId ou datasetId válido.');
    }

    // 2. Polling até o status terminar (SUCCEEDED, FAILED, ABORTED, TIMED-OUT)
    const maxWaitMs = 180000; // 3 minutos limite
    const startTime = Date.now();
    let isFinished = false;
    let finalStatus = '';

    while (!isFinished && Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      });

      if (!statusRes.ok) {
        continue;
      }

      const statusData: any = await statusRes.json();
      finalStatus = statusData?.data?.status;

      if (finalStatus === 'SUCCEEDED') {
        isFinished = true;
      } else if (finalStatus === 'FAILED') {
        return res.status(500).json({
          success: false,
          error: 'APIFY_RUN_FAILED',
          message: 'A execução do robô de busca no Apify falhou. Tente novamente ou use outro termo.',
        });
      } else if (finalStatus === 'ABORTED') {
        return res.status(400).json({
          success: false,
          error: 'APIFY_RUN_ABORTED',
          message: 'A busca no Apify foi abortada (possível limite de orçamento atingido).',
        });
      } else if (finalStatus === 'TIMED-OUT') {
        return res.status(408).json({
          success: false,
          error: 'APIFY_TIMEOUT',
          message: 'Tempo limite excedido na execução da busca pelo Apify.',
        });
      }
    }

    if (!isFinished) {
      return res.status(408).json({
        success: false,
        error: 'SEARCH_TIMEOUT',
        message: 'Tempo limite de espera pela busca do Apify excedido (3 minutos).',
      });
    }

    // 3. Pegar resultados do Dataset
    const datasetRes = await fetch(`https://api.apify.com/v2/datasets/${defaultDatasetId}/items?clean=true`, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    });

    if (!datasetRes.ok) {
      throw new Error('Falha ao baixar resultados do dataset do Apify.');
    }

    const items: any[] = await datasetRes.json();
    const companies: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rawPhoneVal = item.phone || item.phoneNumber || item.phoneUnformatted;
      const phoneData = normalizeBrazilianPhone(rawPhoneVal);

      // Descartar empresas sem telefone válido
      if (!phoneData) {
        continue;
      }

      const name = item.title || item.name || `${niche} Local`;
      const placeId = item.placeId || item.id || `apify-${Date.now()}-${i}`;
      const mapsUrl = item.url || item.googleMapsUrl || item.link || (item.placeId ? `https://www.google.com/maps/place/?q=place_id:${item.placeId}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city} ${state}`)}`);
      const address = item.address || item.formattedAddress || `${city} - ${state}`;

      companies.push({
        id: `apify-${placeId}`,
        name,
        niche,
        city,
        state,
        phone: phoneData.phone,
        rawPhone: phoneData.rawPhone,
        isLandline: phoneData.isLandline,
        hasWebsite: false,
        websiteUrl: undefined,
        hasInstagram: false,
        instagramUrl: undefined,
        googleRating: null, // Não inventar nota!
        reviewCount: null,  // Não inventar contagem!
        score: 0,
        scored: false,      // Marcado explicitamente como sem score
        opportunityLevel: 'baixa' as const,
        stage: 'novo' as const,
        returnDate: null,
        returnStatus: 'none' as const,
        googleMapsUrl: mapsUrl,
        signals: [],
        notes: [],
        assignedUser: 'lucas' as const,
        address,
      });

      if (companies.length >= targetQuantity) {
        break;
      }
    }

    return res.json({
      success: true,
      source: 'apify',
      companies,
      total: companies.length,
      query: `${niche} em ${locationQuery}`,
    });
  } catch (error: any) {
    console.error('Error in /api/apify/search:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_APIFY_ERROR',
      message: error.message || 'Erro interno ao processar busca econômica no Apify.',
    });
  }
});

// ============================================================
// GOOGLE PLACES API (NEW) - MODO COM SCORE LIGADO
// ============================================================

// POST /api/places/search: Google Places API (New) Text Search Proxy
app.post('/api/places/search', async (req: Request<{}, {}, SearchRequestBody>, res: Response) => {
  try {
    const {
      niche = 'Barbearia',
      city = 'São Paulo',
      state = 'SP',
      pageSize = 25,
      onlyWithoutWebsite = false,
      apiKey: customKey,
    } = req.body;

    const apiKey =
      customKey ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY;

    const targetQuantity = Math.max(1, Math.min(200, pageSize));
    const searchQuery = `${niche} em ${city}, ${state}`.trim();

    // Sem chave configurada, responder com erro explicando o que falta (sem inventar dados)
    if (!apiKey || apiKey === 'MY_GOOGLE_MAPS_API_KEY' || apiKey.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'API_KEY_MISSING',
        message: 'Chave da Google Places API não configurada. Configure a variável GOOGLE_MAPS_API_KEY no servidor (ou em Configurações > Google Maps), ou desligue o Sistema de score para utilizar a busca econômica (Apify).',
      });
    }

    // Call Google Places API (New) - Text Search
    const endpoint = 'https://places.googleapis.com/v1/places:searchText';
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.nationalPhoneNumber',
      'places.internationalPhoneNumber',
      'places.websiteUri',
      'places.rating',
      'places.userRatingCount',
      'places.googleMapsUri',
      'nextPageToken',
    ].join(',');

    const collectedPlaces: any[] = [];
    let pageToken: string | undefined = undefined;
    let iteration = 0;
    const maxIterations = Math.ceil(targetQuantity / 20) + 3;

    while (collectedPlaces.length < targetQuantity && iteration < maxIterations) {
      iteration++;
      const requestPayload: any = {
        textQuery: searchQuery,
        pageSize: 20,
      };
      if (pageToken) {
        requestPayload.pageToken = pageToken;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Places API returned status ${response.status}:`, errorText);
        
        if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED')) {
          return res.status(429).json({
            success: false,
            error: 'QUOTA_EXCEEDED',
            message: 'Limite de requisições da Google Places API atingido. Verifique sua quota no Google Cloud Console.',
          });
        }

        if (response.status === 400 || response.status === 403) {
          return res.status(response.status).json({
            success: false,
            error: 'API_KEY_ERROR',
            message: 'Chave de API do Google Maps inválida ou sem permissão para Places API (New).',
            detail: errorText,
          });
        }

        throw new Error(`Google Places API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      const places = data.places || [];

      for (const place of places) {
        const hasWeb = Boolean(place.websiteUri && place.websiteUri.trim().length > 0);
        if (onlyWithoutWebsite && hasWeb) {
          continue;
        }
        collectedPlaces.push(place);
        if (collectedPlaces.length >= targetQuantity) break;
      }

      pageToken = data.nextPageToken;
      if (!pageToken || places.length === 0) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Convert into FisgAI Company format with score
    const companies = collectedPlaces.map((p, idx) => {
      const name = p.displayName?.text || `${niche} Local`;
      const hasWeb = Boolean(p.websiteUri && placeHasValidWeb(p.websiteUri));
      const rating = typeof p.rating === 'number' ? Number(p.rating.toFixed(1)) : null;
      const reviewCount = typeof p.userRatingCount === 'number' ? p.userRatingCount : null;
      const phoneData = normalizeBrazilianPhone(p.nationalPhoneNumber || p.internationalPhoneNumber);

      const { signals, score, opportunityLevel } = buildSignalsAndScore({
        hasWebsite: hasWeb,
        rating: rating || 0,
        reviewCount: reviewCount || 0,
        hasPhone: Boolean(phoneData),
      });

      return {
        id: `gmp-${p.id || Date.now() + '-' + idx}`,
        name,
        niche,
        city,
        state,
        phone: phoneData?.phone || '',
        rawPhone: phoneData?.rawPhone || '',
        isLandline: phoneData?.isLandline || false,
        scored: true,
        hasWebsite: hasWeb,
        websiteUrl: p.websiteUri || undefined,
        hasInstagram: false,
        instagramUrl: undefined,
        googleRating: rating,
        reviewCount,
        score,
        opportunityLevel,
        stage: 'novo' as const,
        returnDate: null,
        returnStatus: 'none' as const,
        googleMapsUrl: p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${p.formattedAddress || city}`)}`,
        signals,
        notes: [],
        assignedUser: 'lucas' as const,
        address: p.formattedAddress || `${city} - ${state}`,
      };
    });

    return res.json({
      success: true,
      source: 'google_places_api_new',
      companies,
      total: companies.length,
      query: searchQuery,
    });
  } catch (error: any) {
    console.error('Error in /api/places/search:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Erro interno ao consultar Google Places API.',
    });
  }
});

function placeHasValidWeb(uri: string | undefined): boolean {
  if (!uri) return false;
  const trimmed = uri.trim();
  return trimmed.length > 0 && trimmed.startsWith('http');
}

// GET /api/places/status: Check if Google Maps API key is configured
app.get('/api/places/status', (_req: Request, res: Response) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey !== 'MY_GOOGLE_MAPS_API_KEY' && apiKey.trim().length > 10);
  res.json({
    configured: isConfigured,
    keyPrefix: isConfigured && apiKey ? apiKey.substring(0, 6) + '...' : null,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`FisgAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
