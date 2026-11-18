// Học từ nội dung thật: tách từ chưa biết trong bài báo/phụ đề. Logic thuần, không gọi mạng.
const STOPWORDS = new Set(`a about above after again against all also am an and any are as at be because been before being below
between both but by can could did do does doing down during each few for from further had has have having he her here hers herself
him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours
ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those
through to too under until up very was we were what when where which while who whom why will with would you your yours yourself
yourselves said says say get got go goes went make made one two three new like well also many much may might must shall yes okay
oh mr mrs ms its let lets us via per etc`.split(/\s+/));

const DOUBLE = /([bdgklmnprt])\1$/;
const ADD_E = /(c|v|z|at|ut|iz|dg|rg|bl|pl|tl|gl|kl|ur|us|as|os|is)$/;

/** Dạng gốc dễ đoán nhất của một từ (studies->study, debated->debate, running->run). */
export function lemma(word) {
  const w = word.toLowerCase();
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && /(ches|shes|sses|xes|zes)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  if (w.length > 4 && w.endsWith('ied')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && w.endsWith('ed')) {
    const stem = w.slice(0, -2);
    if (DOUBLE.test(stem)) return stem.slice(0, -1);
    return ADD_E.test(stem) ? stem + 'e' : stem;
  }
  if (w.length > 5 && w.endsWith('ing')) {
    const stem = w.slice(0, -3);
    if (DOUBLE.test(stem)) return stem.slice(0, -1);
    if (ADD_E.test(stem) || /^[^aeiou]*[aeiou][^aeiouwxy]$/.test(stem)) return stem + 'e';
    return stem;
  }
  return w;
}

/** Các dạng có thể là gốc (để so với danh sách từ đã biết). */
export function baseForms(word) {
  const w = word.toLowerCase();
  const forms = [w, lemma(w)];
  if (w.endsWith('es')) forms.push(w.slice(0, -2));
  if (w.endsWith('s')) forms.push(w.slice(0, -1));
  if (w.endsWith('ed')) forms.push(w.slice(0, -2), w.slice(0, -1));
  if (w.endsWith('ing')) forms.push(w.slice(0, -3), w.slice(0, -3) + 'e');
  return [...new Set(forms)];
}

/** [{word, count, sentence}] - từ chưa biết, xuất hiện nhiều trước. `known` là Set từ (chữ thường) người học đã có. */
export function extractCandidates(text, known = new Set(), { limit = 60 } = {}) {
  const source = String(text || '');
  if (!source.trim()) return [];
  const sentences = source.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  const found = new Map();
  let order = 0;
  for (const sentence of sentences) {
    for (const m of sentence.matchAll(/[A-Za-z]+(?:'[A-Za-z]+)?/g)) {
      const raw = m[0].toLowerCase();
      if (raw.includes("'") || raw.length < 3 || STOPWORDS.has(raw)) continue;
      const base = lemma(raw);
      if (base.length < 3 || STOPWORDS.has(base)) continue;
      if (baseForms(raw).some((f) => known.has(f))) continue;
      const item = found.get(base);
      if (item) item.count += 1;
      else found.set(base, { word: base, count: 1, sentence: sentence.slice(0, 220), order: order++ });
    }
  }
  return [...found.values()]
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, limit)
    .map(({ word, count, sentence }) => ({ word, count, sentence }));
}
