/* ==========================================================================
   Sincronizacao com o Supabase, sem login.

   O localStorage continua sendo onde as telas leem (rapido, e o painel abre
   mesmo sem internet). Esta camada fica por tras dele:

     carregar -> busca a linha do banco e substitui o estado local
     salvar   -> depois de cada mudanca, espera 1,2 s e envia o estado inteiro
     ouvir    -> a cada 15 s (e ao voltar para a aba) confere se alguem salvou

   Trava contra sobrescrita: a gravacao so vale se o banco ainda estiver na
   versao que este navegador conhece. Se alguem salvou no meio, nada e
   sobrescrito: o painel carrega a versao nova e avisa.

   Usa a API REST do Supabase direto (fetch), sem biblioteca externa.
   Sem url/chave em config-nuvem.js, nada disto roda e o painel fica local.
   ========================================================================== */

import { NUVEM } from './config-nuvem.js';

const ESPERA_ENVIO_MS = 1200;
const INTERVALO_LEITURA_MS = 15000;

let ganchos = null;        // { obter, substituir }
let versaoAtual = null;    // versao do banco que este navegador conhece
let sujo = false;
let enviando = false;
let timer = null;
let pronto = false;

export const ligada = () => Boolean(NUVEM.url && NUVEM.chavePublica);

const base = () => `${NUVEM.url.replace(/\/$/, '')}/rest/v1/painel_estado`;
const cabecalhos = (extra = {}) => ({
  apikey: NUVEM.chavePublica,
  Authorization: `Bearer ${NUVEM.chavePublica}`,
  'Content-Type': 'application/json',
  ...extra,
});

/* --------------------------------- selo --------------------------------- */

const CORES = { ok: '#2FA46B', sync: '#FFB020', erro: '#FF5A1F', local: '#8D90A0' };
let eSelo = null;

function selo(texto, tipo = 'ok') {
  if (!eSelo) {
    eSelo = document.createElement('div');
    eSelo.setAttribute('role', 'status');
    eSelo.style.cssText =
      'position:fixed;right:max(16px, env(safe-area-inset-right, 0px));bottom:max(16px, env(safe-area-inset-bottom, 0px));' +
      'z-index:9000;display:flex;align-items:center;gap:8px;padding:7px 12px;background:#1C1D25;' +
      'border:1px solid rgba(255,90,31,.38);border-radius:999px;' +
      "font:600 12px 'Poppins','Segoe UI',sans-serif;color:#C9CBD4;box-shadow:0 8px 24px rgba(0,0,0,.45)";
    document.body.appendChild(eSelo);
  }
  eSelo.innerHTML = '';
  const bola = document.createElement('span');
  bola.style.cssText = `width:8px;height:8px;border-radius:50%;flex:none;background:${CORES[tipo] || CORES.ok}`;
  const txt = document.createElement('span');
  txt.textContent = texto;
  eSelo.append(bola, txt);
}

function aviso(texto) {
  const caixa = document.createElement('div');
  caixa.setAttribute('role', 'alert');
  caixa.style.cssText =
    'position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:9001;width:min(560px,calc(100vw - 32px));' +
    'padding:14px 18px;background:#2A1309;border:1px solid #FF5A1F;border-radius:12px;color:#fff;' +
    "font:500 13.5px/1.5 'Poppins','Segoe UI',sans-serif;box-shadow:0 24px 64px rgba(0,0,0,.55);cursor:pointer";
  caixa.textContent = texto;
  caixa.title = 'Clique para fechar';
  caixa.addEventListener('click', () => caixa.remove());
  document.body.appendChild(caixa);
  setTimeout(() => caixa.remove(), 12000);
}

const hora = (iso) => {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  catch (_) { return ''; }
};

/* ------------------------------- banco ------------------------------- */

async function ler() {
  const r = await fetch(`${base()}?id=eq.${encodeURIComponent(NUVEM.idPainel)}&select=dados,versao,atualizado_em`, {
    headers: cabecalhos(), cache: 'no-store',
  });
  if (!r.ok) throw new Error('leitura ' + r.status);
  const linhas = await r.json();
  return linhas[0] || null;
}

async function criar(dados) {
  const r = await fetch(base(), {
    method: 'POST',
    headers: cabecalhos({ Prefer: 'return=representation' }),
    body: JSON.stringify({ id: NUVEM.idPainel, dados, versao: 1 }),
  });
  if (!r.ok) throw new Error('criacao ' + r.status);
  return (await r.json())[0];
}

/** Grava so se o banco ainda estiver na versao conhecida. Devolve a linha nova, ou null se perdeu a corrida. */
async function gravar(dados, versao) {
  const r = await fetch(`${base()}?id=eq.${encodeURIComponent(NUVEM.idPainel)}&versao=eq.${versao}`, {
    method: 'PATCH',
    headers: cabecalhos({ Prefer: 'return=representation' }),
    body: JSON.stringify({ dados, versao: versao + 1, atualizado_em: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error('gravacao ' + r.status);
  const linhas = await r.json();
  return linhas[0] || null;
}

/* ------------------------------- fluxo ------------------------------- */

async function enviar() {
  timer = null;
  if (!pronto || enviando || !sujo) return;
  enviando = true;
  sujo = false;
  selo('Salvando…', 'sync');
  try {
    const linha = await gravar(ganchos.obter(), versaoAtual);
    if (linha) {
      versaoAtual = linha.versao;
      selo('Salvo na nuvem', 'ok');
    } else {
      const atual = await ler();
      if (atual) { versaoAtual = atual.versao; ganchos.substituir(atual.dados); }
      aviso('Outra pessoa salvou o painel ao mesmo tempo. Carreguei a versão dela; refaça a sua última mudança.');
      selo('Atualizado da nuvem', 'ok');
    }
  } catch (e) {
    console.error(e);
    sujo = true;
    selo('Sem conexão. Salvo neste navegador', 'erro');
  } finally {
    enviando = false;
    if (sujo && !timer) timer = setTimeout(enviar, 5000);
  }
}

export function agendarEnvio() {
  if (!ligada() || !pronto) return;
  sujo = true;
  selo('Alterado…', 'sync');
  clearTimeout(timer);
  timer = setTimeout(enviar, ESPERA_ENVIO_MS);
}

async function conferirNovidade() {
  if (!pronto || enviando || sujo) return;
  try {
    const atual = await ler();
    if (atual && atual.versao !== versaoAtual) {
      versaoAtual = atual.versao;
      ganchos.substituir(atual.dados);
      selo('Atualizado às ' + hora(atual.atualizado_em), 'ok');
    }
  } catch (_) { /* tenta de novo no proximo ciclo */ }
}

export async function iniciar(g) {
  ganchos = g;
  if (!ligada()) { selo('Só neste navegador', 'local'); return; }
  selo('Conectando…', 'sync');
  try {
    let linha = await ler();
    const local = ganchos.obter();
    if (!linha) {
      // banco vazio: a primeira carga sobe o que este navegador tem
      linha = await criar(local);
    } else {
      if (local.tarefas && local.tarefas.length) {
        try { localStorage.setItem('viral-painel-backup-antes-da-nuvem', JSON.stringify(local)); } catch (_) {}
      }
      ganchos.substituir(linha.dados);
    }
    versaoAtual = linha.versao;
    pronto = true;
    selo('Salvo na nuvem', 'ok');
    setInterval(conferirNovidade, INTERVALO_LEITURA_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) conferirNovidade(); });
    window.addEventListener('beforeunload', (e) => { if (sujo) { e.preventDefault(); e.returnValue = ''; } });
  } catch (e) {
    console.error(e);
    selo('Sem conexão. Salvo neste navegador', 'erro');
    setTimeout(() => iniciar(g), 15000);
  }
}
