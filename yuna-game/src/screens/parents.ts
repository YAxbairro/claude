import gsap from 'gsap';
import { h, onTap } from '../core/dom.ts';
import { applyVolumes, sfx } from '../core/audio.ts';
import { progress, save, resetProgress, totalStars } from '../core/store.ts';
import { between, shuffle } from '../core/rng.ts';

/** Grown-ups area behind a small sum, so little fingers don't reset progress by accident. */
export function openParents(onChange?: () => void) {
  const a = between(3, 9), b = between(2, 8);
  const answer = a + b;
  const opts = shuffle([answer, answer + 1, answer - 2, answer + 3]);
  const box = h('div.parents');
  const layer = h('div.modal-layer', box);
  const closeBtn = () => {
    const c = h('button.round-btn.close', { 'aria-label': 'Fechar' }, '✕');
    onTap(c, () => gsap.to(layer, { opacity: 0, duration: 0.2, onComplete: () => layer.remove() }));
    return c;
  };
  box.append(h('div.album-head', h('h2', 'Área dos adultos'), closeBtn()),
    h('p', `Para continuar, responde: quanto é ${a} + ${b}?`),
    h('div.gate', ...opts.map((o) => {
      const btn = h('button.btn', String(o));
      onTap(btn, () => (o === answer ? settings() : gsap.fromTo(btn, { x: -8 }, { x: 0, duration: 0.3, ease: 'elastic.out' })));
      return btn;
    })));
  document.body.append(layer);
  gsap.from(box, { y: 60, opacity: 0, duration: 0.35, ease: 'back.out' });

  function slider(label: string, key: 'music' | 'voice' | 'sfx') {
    const input = h('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(progress[key]) }) as HTMLInputElement;
    input.addEventListener('input', () => { progress[key] = Number(input.value); applyVolumes(); save(); });
    input.addEventListener('change', () => sfx('tap'));
    return h('label.row', h('span', label), input);
  }

  function settings() {
    box.innerHTML = '';
    const unlock = h('input', { type: 'checkbox' }) as HTMLInputElement;
    unlock.checked = progress.unlockAll;
    unlock.addEventListener('change', () => { progress.unlockAll = unlock.checked; save(); onChange?.(); });
    const reset = h('button.btn.danger', 'Apagar progresso');
    onTap(reset, () => {
      if (reset.dataset.confirm) { resetProgress(); layer.remove(); onChange?.(); return; }
      reset.dataset.confirm = '1';
      reset.textContent = 'Tem a certeza? Toque outra vez';
    });
    box.append(
      h('div.album-head', h('h2', 'Área dos adultos'), closeBtn()),
      h('div.stats', h('div', h('b', String(totalStars())), h('small', 'estrelas')), h('div', h('b', String(progress.played)), h('small', 'exercícios')), h('div', h('b', `${progress.stickers.length}/20`), h('small', 'ilhas completas'))),
      slider('Música', 'music'), slider('Voz da narradora', 'voice'), slider('Efeitos', 'sfx'),
      h('label.row', h('span', 'Desbloquear todas as ilhas'), unlock),
      h('p.note', 'O progresso fica guardado neste aparelho. Cada fase tem 10 exercícios escolhidos ao acaso entre as mecânicas da ilha, por isso cada partida é diferente.'),
      reset,
      h('p.note.small', 'Ilustrações, voz e música geradas com IA para a Yuna. Voz: ElevenLabs · Música: Lyria · Imagens: FLUX e Nano Banana.'));
  }
}
