/* ==========================================================================
   Nova atividade - formulario curto aberto pelo botao do kanban e da lista.
   ========================================================================== */

import * as st from './estado.js';
import { FASES, TRILHAS, PRIORIDADES, ORDEM_PRIORIDADES } from './dados-iniciais.js';
import { esc } from './utils.js';
import { abrirFicha } from './ficha.js';

export function botaoNova() {
  return '<button class="btn primario" data-nova>+ Nova atividade</button>';
}

export function ligarNova(alvo, faseInicial = 1) {
  const botao = alvo.querySelector('[data-nova]');
  if (botao) botao.addEventListener('click', () => abrir(faseInicial));
}

function abrir(faseInicial) {
  const raiz = document.getElementById('modal-raiz');
  raiz.innerHTML = `
  <div class="fundo-modal" data-fechar-nova>
    <div class="modal" role="dialog" aria-modal="true" aria-label="Nova atividade" style="max-width:560px">
      <header>
        <div class="tit"><h2>Nova atividade</h2></div>
        <button class="btn fantasma" type="button" data-fechar-nova aria-label="Fechar">✕</button>
      </header>
      <form class="corpo-modal" id="form-nova">
        <div class="campo"><label for="n-titulo">Atividade</label>
          <input type="text" id="n-titulo" required maxlength="200" placeholder="O que precisa ser feito"></div>
        <div class="campos" style="margin-top:12px">
          <div class="campo"><label for="n-fase">Fase</label>
            <select id="n-fase">${Object.entries(FASES).map(([k, v]) => `<option value="${k}"${Number(k) === faseInicial ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
          <div class="campo"><label for="n-trilha">De quem é</label>
            <select id="n-trilha">${Object.entries(TRILHAS).map(([k, v]) => `<option value="${k}"${k === 'ambos' ? ' selected' : ''}>${esc(v.rotulo)}</option>`).join('')}</select></div>
          <div class="campo"><label for="n-resp">Responsável</label>
            <input type="text" id="n-resp" maxlength="60" placeholder="Nome (opcional)"></div>
          <div class="campo"><label for="n-prio">Prioridade</label>
            <select id="n-prio">${ORDEM_PRIORIDADES.map((p) => `<option value="${p}"${p === 'media' ? ' selected' : ''}>${PRIORIDADES[p].rotulo}</option>`).join('')}</select></div>
        </div>
        <div style="display:flex;gap:9px;margin-top:16px">
          <button class="btn primario" type="submit">Criar</button>
          <button class="btn fantasma" type="button" data-fechar-nova>Cancelar</button>
        </div>
      </form>
    </div>
  </div>`;
  document.body.style.overflow = 'hidden';
  const fechar = () => { raiz.innerHTML = ''; document.body.style.overflow = ''; };
  raiz.querySelectorAll('[data-fechar-nova]').forEach((el) => el.addEventListener('click', (e) => {
    if (el.classList.contains('fundo-modal') && e.target !== el) return;
    fechar();
  }));
  raiz.querySelector('#n-titulo').focus();
  raiz.querySelector('#form-nova').addEventListener('submit', (e) => {
    e.preventDefault();
    const titulo = raiz.querySelector('#n-titulo').value.trim();
    if (!titulo) return;
    const id = st.novaTarefa({
      titulo,
      fase: raiz.querySelector('#n-fase').value,
      trilha: raiz.querySelector('#n-trilha').value,
      responsavel: raiz.querySelector('#n-resp').value,
      prioridade: raiz.querySelector('#n-prio').value,
    });
    fechar();
    abrirFicha(id);
  });
}
