import { useEffect } from "react";

/**
 * Revela os elementos marcados com `.reveal` (e variantes) à medida que
 * entram no ecrã.
 *
 * Um único observador para a página inteira, em vez de um por bloco: os
 * elementos são encontrados pela classe, e cada um deixa de ser observado
 * assim que aparece — o efeito é de chegada, não de ida e volta.
 *
 * O observador é criado depois da primeira pintura, por isso apanha também
 * os blocos que já estão visíveis sem ser preciso rolar.
 */
export function useReveal() {
  useEffect(() => {
    const alvos = document.querySelectorAll<HTMLElement>(
      ".reveal, .reveal-left, .reveal-scale",
    );

    // Sem suporte a IntersectionObserver o site tem de continuar legível:
    // mostra-se tudo de uma vez em vez de deixar a página em branco.
    if (typeof IntersectionObserver === "undefined") {
      alvos.forEach((el) => el.setAttribute("data-visible", "true"));
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.setAttribute("data-visible", "true");
          observador.unobserve(entrada.target);
        });
      },
      // A margem inferior negativa atrasa a entrada até o bloco estar
      // mesmo à vista, e não ainda a espreitar pela borda do ecrã.
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    alvos.forEach((el) => observador.observe(el));
    return () => observador.disconnect();
  }, []);
}
