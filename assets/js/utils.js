/* ==========================================================================
   Utilidades gerais - DOM, datas e formatacao
   ========================================================================== */

/** Cria um elemento a partir de uma string de HTML. */
export function html(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

/** Escapa texto vindo do usuario antes de injetar em HTML. */
export function esc(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const $  = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

/** Gera um id curto e unico o bastante para uso local. */
export function novoId(prefixo = 'id') {
  return prefixo + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

/* -------------------------------- datas -------------------------------- */

/** 'aaaa-mm-dd' -> Date local (evita o deslocamento de fuso do construtor ISO). */
export function paraData(iso) {
  if (!iso) return null;
  const [a, m, d] = String(iso).split('-').map(Number);
  if (!a || !m || !d) return null;
  return new Date(a, m - 1, d);
}

/** Date -> 'aaaa-mm-dd'. */
export function paraIso(data) {
  if (!data) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

/** 'aaaa-mm-dd' -> 'dd/mm/aaaa'. */
export function fmtData(iso) {
  const d = paraData(iso);
  if (!d) return '—';
  return d.toLocaleDateString('pt-BR');
}

/** 'aaaa-mm-dd' -> 'dd/mm'. */
export function fmtDataCurta(iso) {
  const d = paraData(iso);
  if (!d) return '—';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}`;
}

export function somaDias(iso, dias) {
  const d = paraData(iso);
  if (!d) return '';
  d.setDate(d.getDate() + dias);
  return paraIso(d);
}

/** Diferenca em dias corridos entre duas datas ISO (b - a). */
export function difDias(isoA, isoB) {
  const a = paraData(isoA), b = paraData(isoB);
  if (!a || !b) return null;
  return Math.round((b - a) / 86400000);
}

export function hojeIso() {
  return paraIso(new Date());
}

/** Data/hora legivel para o registro de atividades. */
export function agoraLegivel() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Converte o numero do dia do plano (D1..D90) na data real, se houver inicio. */
export function diaParaData(dataInicioIso, dia) {
  if (!dataInicioIso || !dia) return '';
  return somaDias(dataInicioIso, dia - 1);
}

/** Percentual inteiro, protegido contra divisao por zero. */
export function pct(parte, total) {
  if (!total) return 0;
  return Math.round((parte / total) * 100);
}

export function plural(n, singular, pluralForma) {
  return n === 1 ? singular : pluralForma;
}

/** Baixa um objeto como arquivo JSON. */
export function baixarJson(nomeArquivo, dados) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
