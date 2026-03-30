import { enhancePrompt } from './prompt-enhancer.js';
import { createUIManager } from './uiManager.js';
import { clearCacheData, getUiFlag, isCachingEnabled, loadCacheData, saveCacheData, setCachingEnabled, setUiFlag } from './storageManager.js';
import { generateAvatar } from './apiClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  const rainbowBtn = document.getElementById('rainbow-toggle');
  const cacheBtn = document.getElementById('cache-toggle');
  const avatarForm = document.getElementById('avatar-form');
  const genBtn = document.getElementById('gen-btn');
  const resultPanel = document.getElementById('result-container');
  const genImage = document.getElementById('generated-image');
  const promptInput = document.getElementById('prompt');
  const sizeSelect = document.getElementById('size');
  const hamburgerBtn = document.getElementById('hamburger-open');
  const drawerClose = document.getElementById('drawer-close');
  const drawer = document.getElementById('mob-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const rainbowTexts = document.querySelectorAll('.rainbow-text, .accent-text');
  const stepsInput = document.getElementById('steps');
  const stepsVal = document.getElementById('steps-val');
  const randomizeSeed = document.getElementById('randomize-seed');
  const seedInput = document.getElementById('seed');
  const promptClearBtn = document.getElementById('prompt-clear');

  document.querySelectorAll('.auto-age').forEach((el) => {
    el.textContent = new Date().getFullYear() - 2011;
  });

  const ui = createUIManager({
    rainbowBtn,
    cacheBtn,
    hamburgerBtn,
    drawerClose,
    drawer,
    overlay,
    rainbowTexts,
    resultPanel,
    genImage,
    genBtn
  });

  ui.bindDrawer();
  if (promptInput) {
    ui.bindExamples(promptInput);
  }
  ui.bindAdvancedControls({ stepsInput, stepsVal, randomizeSeed, seedInput });
  const getActiveModifiers = ui.bindStyleModifiers();

  let rainbowState = parseInt(getUiFlag('avtarx_rainbow', '0'), 10);
  if (Number.isNaN(rainbowState)) rainbowState = 0;
  ui.setRainbow(rainbowState);

  rainbowBtn?.addEventListener('click', () => {
    rainbowState = rainbowState === 1 ? 0 : 1;
    ui.setRainbow(rainbowState);
    setUiFlag('avtarx_rainbow', String(rainbowState));
  });

  let cachingOn = isCachingEnabled();
  let lastGeneratedImage = '';
  ui.applyCacheButtonState(cachingOn);
  if (cachingOn && promptInput && sizeSelect) {
    try {
      const cached = await loadCacheData();
      if (typeof cached.prompt === 'string') promptInput.value = cached.prompt;
      if (typeof cached.size === 'string') sizeSelect.value = cached.size;
      if (typeof cached.image === 'string' && cached.image.trim()) {
        lastGeneratedImage = cached.image;
        ui.showGeneratedResult(cached.image, false);
      }
    } catch (error) {
      console.error(error);
    }
  }

  cacheBtn?.addEventListener('click', async () => {
    cachingOn = !cachingOn;
    setCachingEnabled(cachingOn);
    ui.applyCacheButtonState(cachingOn);
    if (!cachingOn) {
      try {
        await clearCacheData();
      } catch (error) {
        console.error(error);
      }
    }
  });

  const persistCache = async () => {
    if (!cachingOn || !promptInput || !sizeSelect) return;
    try {
      await saveCacheData({
        prompt: promptInput.value,
        size: sizeSelect.value,
        image: lastGeneratedImage
      });
    } catch (error) {
      console.error(error);
    }
  };

  promptInput?.addEventListener('input', persistCache);
  sizeSelect?.addEventListener('change', persistCache);
  promptClearBtn?.addEventListener('click', async () => {
    if (!promptInput) return;
    promptInput.value = '';
    promptInput.focus();
    await persistCache();
  });

  avatarForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!promptInput || !sizeSelect) return;
    let prompt = promptInput.value.trim();
    if (!prompt) return;
    const modifiers = getActiveModifiers();
    if (modifiers.length > 0) {
      prompt += `, ${modifiers.join(', ')}`;
    }
    const params = {
      prompt: enhancePrompt(prompt),
      height: parseInt(sizeSelect.value || '512', 10),
      width: parseInt(sizeSelect.value || '512', 10),
      num_inference_steps: parseInt(stepsInput?.value || '9', 10),
      seed: parseInt(seedInput?.value || '42', 10),
      randomize_seed: randomizeSeed ? randomizeSeed.checked : true
    };

    ui.setLoadingState(true, '⏳ Connecting to inference engine...');
    try {
      const imageUrl = await generateAvatar(params, (status) => {
        ui.setLoadingState(true, `⏳ ${status}`);
      });
      lastGeneratedImage = imageUrl;
      ui.showGeneratedResult(imageUrl);
      await persistCache();
    } catch (error) {
      console.error(error);
      const message = typeof error?.message === 'string' ? error.message : 'Network limitation or API error';
      alert(`Generation Failed: ${message}`);
    } finally {
      ui.setLoadingState(false, '⚡   Initiate Generation Sequence');
    }
  });

  ui.initRandomPopup();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((error) => console.error(error));
    });
  }
});
