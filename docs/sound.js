/* Original, synthesized study cues. No audio downloads or background playback. */
(() => {
  'use strict';
  const KEY = 'water-quest-sound-v1';
  const Audio = window.AudioContext || window.webkitAudioContext;
  const supported = typeof Audio === 'function';
  let enabled = false, volume = 35, context, master, serial = 0, lastTap = -Infinity;
  const voices = new Set();
  // frequency, start, duration, ending frequency, relative level
  const cues = {
    tap: [[880, 0, .07, 660, .65]],
    choose: [[620, 0, .11, 930, .8]],
    correct: [[659, 0, .17], [880, .09, .19], [1175, .18, .23]],
    incorrect: [[330, 0, .16, 294, .75], [247, .12, .2, 220, .65]],
    complete: [[523, 0, .2], [659, .1, .2], [784, .2, .24], [1047, .33, .36]],
    reward: [[784, 0, .15], [988, .08, .18], [1319, .19, .31]],
    review: [[587, 0, .17], [784, .11, .22]]
  };
  function read(raw) {
    try {
      const value = JSON.parse(raw);
      enabled = supported && value?.enabled === true;
      volume = typeof value?.volume === 'number' && Number.isFinite(value.volume)
        ? Math.min(100, Math.max(0, Math.round(value.volume))) : 35;
    } catch (_) { enabled = false; volume = 35; }
  }
  try { read(localStorage.getItem(KEY)); } catch (_) {}
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ enabled, volume })); } catch (_) {}
  }
  function stop() {
    serial++;
    for (const voice of [...voices]) {
      try { voice.osc.stop(); } catch (_) {}
      voice.osc.disconnect(); voice.gain.disconnect(); voices.delete(voice);
    }
  }
  function level() {
    if (context && master) master.gain.setTargetAtTime(enabled ? volume / 100 : 0, context.currentTime, .015);
  }
  function hint(message) {
    const node = document.getElementById('sound-hint');
    if (node) node.textContent = message;
  }
  function sync() {
    document.querySelectorAll('[data-sound-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(enabled));
      button.setAttribute('aria-label', enabled ? '关闭音效' : '开启音效');
      button.querySelector('[data-sound-label]').textContent = '音效：' + (enabled ? '开' : '关');
    });
    const slider = document.getElementById('sound-volume');
    if (slider) slider.value = String(volume);
    const output = document.getElementById('sound-volume-value');
    if (output) output.textContent = volume + '%';
    const preview = document.querySelector('[data-action="sound-preview"]');
    if (preview) preview.disabled = !enabled || volume === 0;
    hint(!supported ? '当前浏览器不支持音效。' : !enabled ? '开启后，答题和闯关会有轻柔提示音。' : volume === 0 ? '音量为 0，当前不会发声。' : '轻柔水滴与铃声 · 设置自动保存在本机。');
  }
  async function play(kind) {
    if (!enabled || !volume || !supported || document.hidden || !cues[kind]) return false;
    if (kind === 'tap' || kind === 'choose') {
      const now = performance.now();
      if (now - lastTap < 65) return false;
      lastTap = now;
    }
    stop();
    const ticket = serial;
    try {
      if (!context || context.state === 'closed') {
        context = new Audio(); master = context.createGain();
        master.gain.setValueAtTime(volume / 100, context.currentTime);
        master.connect(context.destination);
      }
      if (context.state !== 'running') await context.resume();
      if (ticket !== serial || !enabled || !volume || document.hidden) return false;
      if (context.state !== 'running') { hint('浏览器尚未允许播放，请再点一次试听。'); return false; }
      const start = context.currentTime + .008;
      for (const [frequency, delay, duration, end = frequency, strength = 1] of cues[kind]) {
        const osc = context.createOscillator(), gain = context.createGain();
        const at = start + delay, voice = { osc, gain };
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, at);
        osc.frequency.exponentialRampToValueAtTime(end, at + duration);
        gain.gain.setValueAtTime(.0001, at);
        gain.gain.exponentialRampToValueAtTime(.17 * strength, at + .009);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        osc.connect(gain); gain.connect(master); voices.add(voice);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); voices.delete(voice); };
        osc.start(at); osc.stop(at + duration + .025);
      }
      return true;
    } catch (_) { stop(); hint('暂时无法播放音效，仍可正常答题。'); return false; }
  }
  function toggle() {
    if (!supported) return;
    enabled = !enabled; stop(); level(); save(); sync();
    if (enabled) return play('choose');
    return false;
  }
  function setVolume(value) {
    const n = Number(value); if (!Number.isFinite(n)) return;
    volume = Math.min(100, Math.max(0, Math.round(n)));
    if (!volume) stop();
    level(); save(); sync();
  }
  const speaker = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
  function control() {
    return `<div class="sound-tools"><button type="button" class="sound-toggle" data-action="sound-toggle" data-sound-toggle aria-pressed="${enabled}" aria-label="${enabled ? '关闭音效' : '开启音效'}" ${supported ? '' : 'disabled'}>${speaker}<span data-sound-label>音效：${enabled ? '开' : '关'}</span></button><details class="sound-settings"><summary aria-label="音效设置" title="音效设置"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 17h16"/><path d="M8 4v6m8 4v6"/></svg></summary><div class="sound-panel"><strong>一点声音，一点鼓励</strong><label for="sound-volume">音量 <output id="sound-volume-value" for="sound-volume">${volume}%</output></label><input type="range" id="sound-volume" min="0" max="100" step="5" value="${volume}" ${supported ? '' : 'disabled'}><button type="button" class="btn small secondary" data-action="sound-preview" ${enabled && volume ? '' : 'disabled'}>试听答对音效 ♪</button><p id="sound-hint" role="status">${supported ? '默认静音，开启后生效；设置保存在本机。' : '当前浏览器不支持音效。'}</p></div></details></div>`;
  }
  document.addEventListener('click', event => {
    const button = event.target.closest?.('button,a.brand');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'sound-toggle') { toggle(); return; }
    if (action === 'sound-preview') { void play('correct'); return; }
    if (!event.isTrusted || ['submit', 'definition-grade', 'sweet-redeem', 'sweet-review'].includes(action)) return;
    void play(button.classList.contains('option') ? 'choose' : 'tap');
  }, true);
  document.addEventListener('input', event => {
    if (event.target.id === 'sound-volume') setVolume(event.target.value);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelector('.sound-settings')?.removeAttribute('open');
  });
  document.addEventListener('click', event => {
    if (!event.target.closest?.('.sound-tools')) document.querySelector('.sound-settings')?.removeAttribute('open');
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    stop();
    if (context?.state === 'running') context.suspend().catch(() => {});
  });
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    stop(); read(event.newValue); level(); sync();
  });
  window.WATER_SOUND = { control, sync, play, toggle, setVolume };
})();
