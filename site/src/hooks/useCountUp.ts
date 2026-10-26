import { useEffect, useRef, useState } from "react";

/**
 * Faz um número subir de zero até ao valor final quando entra no ecrã.
 *
 * A contagem anda pelo relógio do ecrã (requestAnimationFrame) e não por um
 * intervalo fixo, para acompanhar a cadência do monitor em vez de saltar.
 * A curva é desacelerada no fim — sobe depressa e assenta devagar, que é o
 * que faz o número parecer travar em vez de parar a meio.
 */
export function useCountUp(valor: number, duracao = 1600) {
  const [atual, setAtual] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const jaCorreu = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const semMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (semMovimento || typeof IntersectionObserver === "undefined") {
      setAtual(valor);
      return;
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting || jaCorreu.current) return;
        jaCorreu.current = true;
        observador.disconnect();

        const inicio = performance.now();
        const passo = (agora: number) => {
          const t = Math.min((agora - inicio) / duracao, 1);
          const suave = 1 - Math.pow(1 - t, 3);
          setAtual(Math.round(valor * suave));
          if (t < 1) requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
      },
      { threshold: 0.4 },
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, [valor, duracao]);

  return { ref, atual };
}
