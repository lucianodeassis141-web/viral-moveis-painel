/* ==========================================================================
   O que precisa vir do time da Viral para o plano andar.
   ========================================================================== */

import * as st from '../estado.js';
import { STATUS_MATERIAL, ORDEM_STATUS_MATERIAL } from '../dados-iniciais.js';
import { esc, fmtData } from '../utils.js';
import { abrirFicha } from '../ficha.js';

const CORES = { pendente: 'pendente', solicitado: 'revisao', recebido: 'andamento', validado: 'concluido' };

export function render(alvo) {
  const e = st.obter();
  const contagem = ORDEM_STATUS_MATERIAL.reduce((acc, s) => {
    acc[s] = e.materiais.filter((m) => m.status === s).length;
    return acc;
  }, {});
  const criticosAbertos = e.materiais.filter((m) => m.critico && m.status !== 'recebido' && m.status !== 'validado');

  alvo.innerHTML = `
  <section class="secao">
    <header>
      <h2>O que precisa vir do time</h2>
      <span class="nota">${contagem.validado + contagem.recebido} de ${e.materiais.length} já chegaram</span>
    </header>

    <div class="grade g-4" style="margin-bottom:16px">
      ${ORDEM_STATUS_MATERIAL.map((s) => `
        <div class="cartao indicador" style="--cor:var(--st-${CORES[s]})">
          <div class="rotulo">${STATUS_MATERIAL[s].rotulo}</div>
          <div class="valor">${contagem[s]}</div>
        </div>`).join('')}
    </div>

    ${criticosAbertos.length ? `
      <div class="aviso" style="margin-bottom:16px">
        <b>ENQUANTO ISTO NÃO CHEGAR, A FASE 1 NÃO ANDA</b><br>
        ${criticosAbertos.map((m) => esc(m.nome)).join(' · ')}.
      </div>` : `
      <div class="aviso ok" style="margin-bottom:16px">
        <b>O ESSENCIAL JÁ CHEGOU</b><br>
        Nada do lado do time está travando a Fase 1.
      </div>`}

    ${e.materiais.map(cartao).join('')}

    <p class="dim" style="font-size:11.5px;margin-top:14px">
      <b>Pendente</b> = ainda não foi pedido ou não houve resposta ·
      <b>Solicitado</b> = já pedido, aguardando ·
      <b>Recebido</b> = chegou, ainda não conferido ·
      <b>Validado</b> = conferido e utilizável.
    </p>
  </section>`;

  ligar(alvo);
}

function cartao(m) {
  const ok = m.status === 'recebido' || m.status === 'validado';
  return `
  <div class="material${ok ? ' ok' : (m.critico ? ' critico' : '')}">
    <div>
      <h3>
        ${esc(m.nome)}
        ${m.critico ? '<span class="tag" data-prio="critica">TRAVA O PRAZO</span>' : ''}
      </h3>
      <p class="nota">${esc(m.nota)}</p>
      ${(m.bloqueia || []).length ? `
        <div class="bloqueia">
          <span>Necessário para:</span>
          ${m.bloqueia.map((id) => {
            const t = st.tarefa(id);
            return t ? `<span class="tag linha" data-abrir="${id}" style="cursor:pointer">${id} · ${esc(t.responsavel)}</span>` : '';
          }).join('')}
        </div>` : ''}
    </div>
    <div class="campo">
      <label>Status</label>
      <select data-material="${m.id}">
        ${ORDEM_STATUS_MATERIAL.map((s) => `<option value="${s}"${m.status === s ? ' selected' : ''}>${STATUS_MATERIAL[s].rotulo}</option>`).join('')}
      </select>
      ${m.atualizadoEm ? `<span class="dim" style="font-size:10.5px">desde ${fmtData(m.atualizadoEm)}</span>` : ''}
    </div>
    <div class="campo obs">
      <label>Observação</label>
      <textarea data-obs="${m.id}" style="min-height:56px"
        placeholder="Quem ficou de mandar, quando, o que veio incompleto…">${esc(m.observacao)}</textarea>
    </div>
  </div>`;
}

function ligar(alvo) {
  alvo.querySelectorAll('[data-material]').forEach((sel) => {
    sel.addEventListener('change', (e) => st.definirStatusMaterial(sel.dataset.material, e.target.value));
  });
  alvo.querySelectorAll('[data-obs]').forEach((ta) => {
    ta.addEventListener('blur', () => st.definirObsMaterial(ta.dataset.obs, ta.value));
  });
  alvo.querySelectorAll('[data-abrir]').forEach((el) => {
    el.addEventListener('click', () => abrirFicha(el.dataset.abrir));
  });
}
