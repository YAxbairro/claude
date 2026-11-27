// Djobe search: BM25 over article-level chunks of Cape Verdean law.
// Kept as a plain file so the same code runs in the page and in the Node tests.
(function (root) {
  const STOP = new Set(("a o e é de da do das dos em no na nos nas um uma uns umas para por com sem se que " +
    "ao aos à às ou os as mais menos como qual quais quando onde quem eu tu ele ela nós vós eles elas me te lhe " +
    "meu minha meus minhas teu tua seu sua seus suas isso isto esse essa este esta pelo pela pelos pelas sobre " +
    "entre até já não sim ser ter há foi são está estou posso pode podem devo deve tenho tem quanto quanta " +
    "quantos quantas muito muita fazer faz mim ti si lá aqui então mas porque pois nem cada todo toda todos todas " +
    "n nº artigo alínea número presente lei decreto").split(/\s+/));

  function fold(s) {
    return String(s).toLowerCase().normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
  }
  function stem(w) {
    // Light Portuguese stemming: plural and common derivational endings, then cap at 7 letters.
    w = w.replace(/(coes|soes)$/, "c").replace(/(cao|sao)$/, "c")
      .replace(/(mente|idades|idade|ismos|ismo|istas|ista)$/, "")
      .replace(/(adores|adora|ador|antes|ante|encia|ancia)$/, "")
      .replace(/(ares|eres|ires|ais|eis|ois|ns)$/, "")
      .replace(/(ar|er|ir|as|es|os|is|us|a|e|o|s)$/, "");
    return w.length > 7 ? w.slice(0, 7) : w;
  }
  function tokens(s) {
    const out = [];
    for (const w of fold(s).split(/[^a-z0-9]+/)) {
      if (w.length < 2 || STOP.has(w)) continue;
      if (/^\d+$/.test(w) && w.length > 6) continue;
      out.push(stem(w));
    }
    return out;
  }

  // Everyday words -> words the law uses. Added to the query with a lower weight.
  const SYN = {
    carro: "veiculo viatura", revistar: "revista busca", revistam: "revista busca", policia: "orgao policia criminal autoridade",
    juiz: "judiciaria juiz", patrao: "empregador entidade empregadora", salario: "remuneracao retribuicao salario",
    despedido: "despedimento", despedir: "despedimento", renda: "renda arrendamento", senhorio: "senhorio arrendatario",
    reforma: "pensao velhice reforma", reformar: "pensao velhice reforma", baixa: "doenca incapacidade temporaria",
    preso: "detencao prisao detido", detido: "detencao detido", esquadra: "detido detencao", imposto: "imposto tributo taxa",
    casa: "habitacao domicilio", ferias: "ferias", gravida: "maternidade", gravidez: "maternidade", filho: "filho descendente",
    bater: "ofensa integridade fisica violencia", violencia: "violencia", mulher: "genero", empresa: "empresa sociedade",
    multa: "coima multa", carta: "titulo conducao", irps: "taxa irps rendimento", desconto: "contribuicao cotizacao desconto",
    descontos: "contribuicao cotizacao desconto", inps: "previdencia social contribuicao"
  };

  function build(chunks, docs) {
    const N = chunks.length;
    const df = new Map();
    const tf = new Array(N);
    const len = new Float64Array(N);
    let total = 0;
    for (let i = 0; i < N; i++) {
      const c = chunks[i];
      const d = docs[c.d] || {};
      const toks = tokens(c.t).concat(tokens(c.h), tokens(c.h), tokens(c.h), tokens(d.short || ""), tokens(d.area || ""));
      const m = new Map();
      for (const t of toks) m.set(t, (m.get(t) || 0) + 1);
      tf[i] = m;
      len[i] = toks.length;
      total += toks.length;
      for (const t of m.keys()) df.set(t, (df.get(t) || 0) + 1);
    }
    return { chunks, docs, N, df, tf, len, avg: total / Math.max(1, N) };
  }

  function search(index, query, opts) {
    opts = opts || {};
    const k1 = 1.4, b = 0.7;
    const base = [...new Set(tokens(query))];
    const extra = [];
    for (const w of fold(query).split(/[^a-z0-9]+/)) if (SYN[w]) extra.push(...tokens(SYN[w]));
    const weight = new Map(base.map(t => [t, 1]));
    for (const t of extra) if (!weight.has(t)) weight.set(t, 0.6);
    const q = [...weight.keys()];
    const docFilter = opts.doc ? new Set([].concat(opts.doc)) : null;
    const scores = [];
    for (let i = 0; i < index.N; i++) {
      const c = index.chunks[i];
      if (docFilter && !docFilter.has(index.docs[c.d].id)) continue;
      const m = index.tf[i];
      let s = 0, hits = 0;
      for (const t of q) {
        const f = m.get(t);
        if (!f) continue;
        const wgt = weight.get(t);
        if (wgt === 1) hits++;
        const n = index.df.get(t) || 0;
        const idf = Math.log(1 + (index.N - n + 0.5) / (n + 0.5));
        s += wgt * idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * index.len[i] / index.avg));
      }
      if (s > 0) scores.push([s * (1 + 0.15 * hits), i]);
    }
    scores.sort((a, b) => b[0] - a[0]);
    return scores.slice(0, opts.k || 8).map(([s, i]) => ({ score: s, chunk: index.chunks[i] }));
  }

  const api = { build, search, tokens };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DjobeSearch = api;
})(typeof window !== "undefined" ? window : globalThis);
