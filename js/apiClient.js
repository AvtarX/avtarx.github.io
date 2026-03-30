// Multiple public SDXL-Turbo / fast-gen spaces as fallbacks
const SPACES = [
  { id: 'mrfakename/Z-Image-Turbo',        api: '/generate_image' },
  { id: 'KingNish/Realtime-FLUX',           api: '/process_image' },
  { id: 'AP123/SDXL-Lightning-4-step',      api: '/predict' },
  { id: 'hysts/SDXL-Turbo',                 api: '/predict' },
  { id: 'diffusers/diffusers-gallery',      api: '/predict' },
];

const GRADIO_CLIENT_URL = 'https://esm.sh/@gradio/client@2.1.0';
const REQUEST_TIMEOUT_MS = 40000;

const withTimeout = async (promise, timeoutMessage) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const statusTextFromPayload = (payload) => {
  if (!payload) return '';
  const text = `${payload.status || ''} ${payload.stage || ''} ${payload.message || ''}`.toLowerCase();
  if (text.includes('sleep') || text.includes('asleep') || text.includes('cold')) return 'Waking up GPU cluster...';
  if (text.includes('queue')) return 'Request queued...';
  if (text.includes('generat') || text.includes('predict')) return 'Generating avatar...';
  if (text.includes('connect')) return 'Connecting to inference engine...';
  return '';
};

const extractImageUrl = (result) => {
  const first = result?.data?.[0];
  if (typeof first === 'string') return first;
  if (first?.url) return first.url;
  if (first?.path) return first.path;
  return '';
};

const isQuotaOrRateError = (error) => {
  const msg = String(error?.message || '').toLowerCase();
  return (
    msg.includes('rate limit') ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('too many') ||
    msg.includes('exceeded') ||
    msg.includes('sleep') ||
    msg.includes('asleep') ||
    msg.includes('cold')
  );
};

const trySpace = async ({ id, api }, params, onStatusUpdate) => {
  const { Client } = await import(GRADIO_CLIENT_URL);
  onStatusUpdate(`Connecting to inference engine...`);
  const client = await withTimeout(
    Client.connect(id, {
      status_callback: (status) => {
        const mapped = statusTextFromPayload(status);
        if (mapped) onStatusUpdate(mapped);
      }
    }),
    'Connection timed out.'
  );
  onStatusUpdate('Generating avatar...');
  const result = await withTimeout(
    client.predict(api, params),
    'Generation timed out.'
  );
  const imageUrl = extractImageUrl(result);
  if (!imageUrl) throw new Error('Generation completed without image output.');
  return imageUrl;
};

export const generateAvatar = async (params, onStatusUpdate) => {
  let lastError;

  for (let i = 0; i < SPACES.length; i++) {
    const space = SPACES[i];
    try {
      onStatusUpdate(
        i === 0
          ? 'Connecting to inference engine...'
          : `Primary space busy — trying fallback ${i}...`
      );
      return await trySpace(space, params, onStatusUpdate);
    } catch (error) {
      lastError = error;
      const shouldFallback = isQuotaOrRateError(error) || String(error?.message || '').includes('timed out');
      if (!shouldFallback) break; // Hard error — don't waste attempts
      console.warn(`Space ${space.id} failed:`, error.message);
    }
  }

  // All spaces exhausted
  throw new Error(
    lastError?.message?.includes('timed out')
      ? 'All inference engines timed out. Please try again in a moment.'
      : 'All inference engines are currently rate-limited. Please wait 30 seconds and retry.'
  );
};