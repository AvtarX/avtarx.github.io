export const createUIManager = ({
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
}) => {
  let isRainbowOn = 0;

  const setDrawerState = (open) => {
    drawer?.classList.toggle('open', open);
    overlay?.classList.toggle('open', open);
    drawer?.setAttribute('aria-hidden', String(!open));
    overlay?.setAttribute('aria-hidden', String(!open));
    hamburgerBtn?.setAttribute('aria-expanded', String(open));
    drawerClose?.setAttribute('aria-expanded', String(open));
  };

  const applyRainbow = () => {
    const enabled = isRainbowOn === 1;
    rainbowTexts.forEach((el) => el.classList.toggle('rainbow-mode-text', enabled));
    if (!rainbowBtn) return;
    rainbowBtn.textContent = enabled ? 'RGB: ON' : 'RGB: OFF';
    rainbowBtn.classList.toggle('btn-primary', enabled);
    rainbowBtn.classList.toggle('btn-outline', !enabled);
  };

  const setRainbow = (value) => {
    isRainbowOn = value ? 1 : 0;
    applyRainbow();
  };

  const bindDrawer = () => {
    hamburgerBtn?.addEventListener('click', () => setDrawerState(true));
    drawerClose?.addEventListener('click', () => setDrawerState(false));
    overlay?.addEventListener('click', () => setDrawerState(false));
  };

  const bindExamples = (promptInput) => {
    document.querySelectorAll('.ex-prompt').forEach((el) => {
      el.addEventListener('click', () => {
        const addition = el.dataset.add || '';
        if (!addition) return;
        promptInput.value = promptInput.value ? `${promptInput.value}, ${addition}` : addition;
      });
    });
  };

  const bindAdvancedControls = ({ stepsInput, stepsVal, randomizeSeed, seedInput }) => {
    stepsInput?.addEventListener('input', (e) => {
      if (stepsVal) stepsVal.textContent = e.target.value;
    });
    randomizeSeed?.addEventListener('change', (e) => {
      if (seedInput) seedInput.disabled = e.target.checked;
    });
  };

  const bindStyleModifiers = () => {
    let activeModifiers = ['cinematic'];
    document.querySelectorAll('.style-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const val = pill.dataset.val;
        if (!val) return;
        const exists = activeModifiers.includes(val);
        activeModifiers = exists ? activeModifiers.filter((m) => m !== val) : [...activeModifiers, val];
        pill.classList.toggle('active', !exists);
      });
    });
    return () => activeModifiers;
  };

  const applyCacheButtonState = (enabled) => {
    if (!cacheBtn) return;
    cacheBtn.textContent = enabled ? 'Cache: ON' : 'Cache: OFF';
    cacheBtn.classList.toggle('btn-outline', enabled);
    cacheBtn.classList.toggle('btn-ghost', !enabled);
  };

  const setLoadingState = (loading, text) => {
    if (!genBtn) return;
    genBtn.textContent = text;
    genBtn.disabled = loading;
    genBtn.classList.toggle('loading', loading);
  };

  const showGeneratedResult = async (imgUrl) => {
    // Show image
    if (genImage) genImage.src = imgUrl;
    if (resultPanel) resultPanel.style.display = 'block';

    // Remove any previous download button
    const old = resultPanel?.querySelector('.dl-btn-wrap');
    if (old) old.remove();

    // Create wrapper
    const wrap = document.createElement('div');
    wrap.className = 'dl-btn-wrap result-actions';
    wrap.style.cssText = 'display:flex;gap:12px;justify-content:center;margin-top:20px;';

    // Create download button (disabled while fetching blob)
    const btn = document.createElement('a');
    btn.className = 'btn btn-primary';
    btn.textContent = '⏳ Preparing Download...';
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';

    // Regenerate button
    const regenBtn = document.createElement('button');
    regenBtn.className = 'btn btn-ghost';
    regenBtn.textContent = 'Regenerate';
    regenBtn.addEventListener('click', () => {
      resultPanel.style.display = 'none';
    });

    wrap.appendChild(btn);
    wrap.appendChild(regenBtn);
    resultPanel?.appendChild(wrap);

    // Fetch blob and wire up real download
    try {
      const blob = await fetch(imgUrl).then(r => r.blob());
      const blobUrl = URL.createObjectURL(blob);
      btn.href = blobUrl;
      btn.download = `AvtarX-${Date.now()}.png`;
      btn.textContent = '⬇ Download PNG';
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
    } catch {
      // Fallback: direct link (may open in browser tab on some browsers)
      btn.href = imgUrl;
      btn.target = '_blank';
      btn.download = `AvtarX-${Date.now()}.png`;
      btn.textContent = '⬇ Download PNG';
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
    }
  };

  const initRandomPopup = () => {
    if (sessionStorage.getItem('avtarx_popup_shown')) return;
    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'random-popup-overlay';
    popupOverlay.id = 'random-popup';
    popupOverlay.innerHTML = `
      <div class="random-popup-box">
        <div class="random-popup-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </div>
        <h3 class="random-popup-title">Professional Invoicing</h3>
        <p class="random-popup-desc">Need a secure, enterprise-grade invoicing solution? Try RupaX — the perfectly matched billing companion for your freelance projects.</p>
        <div class="random-popup-actions">
          <button class="btn btn-ghost" id="popup-close">Dismiss</button>
          <a href="https://rupax-invoice.github.io/" target="_blank" class="btn btn-primary" id="popup-visit">Visit RupaX</a>
        </div>
      </div>
    `;
    document.body.appendChild(popupOverlay);
    const closeBtn = document.getElementById('popup-close');
    const visitBtn = document.getElementById('popup-visit');
    const closePopup = () => {
      popupOverlay.classList.remove('show');
      setTimeout(() => popupOverlay.remove(), 400);
      sessionStorage.setItem('avtarx_popup_shown', 'true');
    };
    closeBtn?.addEventListener('click', closePopup);
    visitBtn?.addEventListener('click', closePopup);
    const randomDelay = Math.floor(Math.random() * (25000 - 5000 + 1) + 5000);
    setTimeout(() => popupOverlay.classList.add('show'), randomDelay);
  };

  return {
    bindDrawer,
    setRainbow,
    bindExamples,
    bindAdvancedControls,
    bindStyleModifiers,
    applyCacheButtonState,
    setLoadingState,
    showGeneratedResult,
    initRandomPopup
  };
};

