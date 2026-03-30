const DB_NAME = 'avtarx-cache-db';
const STORE_NAME = 'kv';
const DB_VERSION = 1;
const canUseIndexedDB = typeof indexedDB !== 'undefined';

const openDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

const withStore = async (mode, action) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
};

export const getUiFlag = (key, fallback = null) => {
  const val = localStorage.getItem(key);
  return val === null ? fallback : val;
};

export const setUiFlag = (key, value) => {
  localStorage.setItem(key, value);
};

export const isCachingEnabled = () => getUiFlag('avtarx_caching') === 'enabled';

export const setCachingEnabled = (enabled) => {
  setUiFlag('avtarx_caching', enabled ? 'enabled' : 'disabled');
};

export const clearCacheData = async () => {
  if (!canUseIndexedDB) {
    localStorage.removeItem('avtarx_prompt');
    localStorage.removeItem('avtarx_size');
    localStorage.removeItem('avtarx_image');
    return;
  }
  await Promise.all([
    withStore('readwrite', (store) => store.delete('avtarx_prompt')),
    withStore('readwrite', (store) => store.delete('avtarx_size')),
    withStore('readwrite', (store) => store.delete('avtarx_image'))
  ]);
};

export const saveCacheData = async ({ prompt, size, image }) => {
  if (!canUseIndexedDB) {
    if (typeof prompt === 'string') localStorage.setItem('avtarx_prompt', prompt);
    if (typeof size === 'string') localStorage.setItem('avtarx_size', size);
    if (typeof image === 'string' && image.trim() && !image.startsWith('data:')) {
      localStorage.setItem('avtarx_image', image);
    }
    return;
  }
  if (typeof prompt === 'string') {
    await withStore('readwrite', (store) => store.put(prompt, 'avtarx_prompt'));
  }
  if (typeof size === 'string') {
    await withStore('readwrite', (store) => store.put(size, 'avtarx_size'));
  }
  if (typeof image === 'string' && image.trim()) {
    await withStore('readwrite', (store) => store.put(image, 'avtarx_image'));
  }
};

export const loadCacheData = async () => {
  if (!canUseIndexedDB) {
    return {
      prompt: localStorage.getItem('avtarx_prompt'),
      size: localStorage.getItem('avtarx_size'),
      image: localStorage.getItem('avtarx_image')
    };
  }
  const [prompt, size, image] = await Promise.all([
    withStore('readonly', (store) => store.get('avtarx_prompt')),
    withStore('readonly', (store) => store.get('avtarx_size')),
    withStore('readonly', (store) => store.get('avtarx_image'))
  ]);
  return { prompt, size, image };
};
