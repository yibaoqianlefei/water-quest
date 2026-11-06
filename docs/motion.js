/* Short, optional UI feedback. This module never reads or changes study progress. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let previousPage = '', previousFeedback = '', celebrated = '';
  const enabled = () => !reduced.matches && !document.hidden;
  const animate = (element, frames, options = {}) => {
    if (!element || !enabled() || typeof element.animate !== 'function') return;
    return element.animate(frames, { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)', ...options });
  };
  function enter(element, delay = 0) {
    animate(element, [
      { opacity: 0, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 380, delay, fill: 'backwards' });
  }
  function celebrate(key) {
    if (!key || celebrated === key || !enabled()) return;
    celebrated = key;
    document.querySelector('.quest-confetti')?.remove();
    const layer = document.createElement('div');
    layer.className = 'quest-confetti';
    layer.setAttribute('aria-hidden', 'true');
    const colors = ['#63bde8', '#ffd568', '#ee9b91', '#83cbb2', '#b0a1e4'];
    for (let i = 0; i < 28; i++) {
      const piece = document.createElement('i');
      piece.style.cssText = `--x:${(Math.random() - .5) * 82}vw;--y:${42 + Math.random() * 35}vh;--spin:${(Math.random() - .5) * 1000}deg;--duration:${1300 + Math.random() * 650}ms;background:${colors[i % colors.length]};border-radius:${i % 3 ? '2px' : '50%'};animation-delay:${Math.random() * 90}ms`;
      layer.append(piece);
    }
    document.body.append(layer);
    setTimeout(() => layer.remove(), 2200);
  }
  function ripple(event) {
    if (!enabled() || (event.type === 'pointerdown' && event.button !== 0)) return;
    if (event.type === 'keydown' && (event.repeat || !['Enter', ' '].includes(event.key))) return;
    const button = event.target.closest?.('button.btn,button.option,button.stage-button,.nav button');
    if (!button || button.disabled) return;
    button.querySelector('.quest-ripple')?.remove();
    const box = button.getBoundingClientRect(), circle = document.createElement('span');
    const diameter = Math.max(box.width, box.height) * 2;
    const x = event.type === 'pointerdown' ? event.clientX - box.left : box.width / 2;
    const y = event.type === 'pointerdown' ? event.clientY - box.top : box.height / 2;
    circle.className = 'quest-ripple';
    circle.setAttribute('aria-hidden', 'true');
    circle.style.cssText = `width:${diameter}px;height:${diameter}px;left:${x}px;top:${y}px`;
    button.append(circle);
    setTimeout(() => circle.remove(), 550);
  }
  document.addEventListener('pointerdown', ripple, { passive: true });
  document.addEventListener('keydown', ripple);
  reduced.addEventListener?.('change', () => {
    if (!reduced.matches) return;
    document.querySelectorAll('.quest-confetti,.quest-ripple').forEach(element => element.remove());
    document.getAnimations?.().forEach(animation => animation.cancel());
  });
  window.WATER_MOTION = {
    render({ page, celebrate: celebration }) {
      if (page !== previousPage) {
        previousPage = page;
        previousFeedback = '';
        document.querySelector('.quest-confetti')?.remove();
        enter(document.querySelector('.page-title'));
        enter(document.querySelector('.hero,.quiz-card,.result,.materials-intro,.reader-toolbar'), 45);
        document.querySelectorAll('.stage-card,.stat,.material-card,.note-card').forEach((card, i) => enter(card, Math.min(i, 7) * 35 + 65));
        document.querySelectorAll('.progress-track i').forEach(bar => animate(bar, [
          { transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }
        ], { duration: 550, delay: 100, fill: 'backwards' }));
      }
      const feedback = document.querySelector('.feedback,.definition-review');
      const feedbackKey = feedback ? `${page}:${feedback.className}` : '';
      if (feedbackKey && feedbackKey !== previousFeedback) enter(feedback);
      previousFeedback = feedbackKey;
      celebrate(celebration);
    },
    choose(element) {
      animate(element, [{ transform: 'scale(1)' }, { transform: 'scale(.985)' }, { transform: 'scale(1)' }], { duration: 220 });
      animate(element?.querySelector('.letter'), [{ transform: 'scale(.8)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 260 });
    }
  };
})();
