// The photograph window: a native <dialog>, sized to the picture's own ratio.
export function initLightbox(root) {
  const dlg = document.querySelector('.window');
  const img = dlg.querySelector('img');
  const cap = dlg.querySelector('figcaption');
  const closeBtn = dlg.querySelector('.window-close');
  let opener = null;

  function open(btn) {
    opener = btn;
    const thumb = btn.querySelector('img');
    const w = +btn.dataset.w || 4, h = +btn.dataset.h || 3;
    img.style.setProperty('--ar', (w / h).toFixed(5));
    img.width = w; img.height = h;
    img.alt = thumb?.alt || '';
    cap.textContent = img.alt;
    img.src = btn.dataset.large;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    document.documentElement.classList.add('window-open');
    closeBtn.focus({ preventScroll: true });
  }
  function close() { if (dlg.open) dlg.close(); }

  dlg.addEventListener('close', () => {
    document.documentElement.classList.remove('window-open');
    img.removeAttribute('src');
    opener?.focus({ preventScroll: true });
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  closeBtn.addEventListener('click', close);

  // Swipe down to close on touch.
  let y0 = null;
  dlg.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') y0 = e.clientY; });
  dlg.addEventListener('pointerup', (e) => { if (y0 !== null && e.clientY - y0 > 90) close(); y0 = null; });
  dlg.addEventListener('pointercancel', () => { y0 = null; });

  root.addEventListener('click', (e) => {
    const b = e.target.closest('.fr button');
    if (b) open(b);
  });
}
