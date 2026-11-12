/* ==========================================================================
   Pecas de interface reutilizadas pelas telas do painel.
   ========================================================================== */

import { STATUS, PRIORIDADES, TRILHAS, ORDEM_STATUS, ORDEM_PRIORIDADES } from './dados-iniciais.js';
import { esc, fmtData, fmtDataCurta, hojeIso, difDias } from './utils.js';
import { bloqueios, estaBloqueada, prazoDaTarefa, progressoTarefa } from './estado.js';

export function tagStatus(status) {
  return `<span class="tag ponto" data-status="${status}">${STATUS[status].curto}</span>`;
}

export function tagPrioridade(prio) {
  return `<span class="tag" data-prio="${prio}">${PRIORIDADES[prio].rotulo.toUpperCase()}</span>`;
}

export function tagTrilha(trilha) {
  if (!TRILHAS[trilha]) return '';
  return `<span class="tag trilha${trilha}">${TRILHAS[trilha].curto}</span>`;
}

export function tagArea(area) {
  return `<span class="tag linha">${esc(area).toUpperCase()}</span>`;
}

export function seletorStatus(t, classe = '') {
  const opcoes = ORDEM_STATUS
    .map((s) => `<option value="${s}"${s === t.status ? ' selected' : ''}>${STATUS[s].rotulo}</option>`)
    .join('');
  return `<select class="${classe}" data-acao="status" data-id="${t.id}">${opcoes}</select>`;
}

export function seletorPrioridade(t, classe = '') {
  const opcoes = ORDEM_PRIORIDADES
    .map((p) => `<option value="${p}"${p === t.prioridade ? ' selected' : ''}>${PRIORIDADES[p].rotulo}</option>`)
    .join('');
  return `<select class="${classe}" data-acao="prioridade" data-id="${t.id}">${opcoes}</select>`;
}

/** Janela planejada de uma tarefa, em D+x. */
export function janela(t) {
  return t.fase ? `Fase ${t.fase}` : '';
}

/** Situacao do prazo de uma tarefa, ja considerando se o projeto comecou. */
export function situacaoPrazo(t) {
  const prazo = prazoDaTarefa(t);
  if (!prazo) return { texto: 'sem prazo', vencido: false, planejado: true };
  const restam = difDias(hojeIso(), prazo);
  const vencido = t.status !== 'concluido' && restam !== null && restam < 0;
  return { texto: fmtDataCurta(prazo), vencido, planejado: false, restam };
}

export function barra(percentual, fina = false) {
  return `<div class="barra${fina ? ' fina' : ''}"><i style="width:${percentual}%"></i></div>`;
}

/** Cartao usado no kanban. */
export function cartaoTarefa(t) {
  const trava = bloqueios(t);
  const travada = estaBloqueada(t);
  const prazo = situacaoPrazo(t);
  return `
    <article class="cartao-tarefa${travada ? ' travada' : ''}" data-prio="${t.prioridade}"
             data-id="${t.id}" draggable="true" tabindex="0">
      <div class="topo-cartao">
        <span class="id">${t.id}</span>
        ${travada ? '<span class="tag bloqueio">BLOQUEADA</span>' : ''}
        ${tagPrioridade(t.prioridade)}
      </div>
      <p class="nome">${esc(t.titulo)}</p>
      <div class="metas">${tagArea(t.area)}${tagTrilha(t.trilha)}</div>
      <div class="pe">
        <span>${janela(t)}</span>
        <span class="dim">·</span>
        <span>${esc(t.responsavel)}</span>
        <span class="prazo${prazo.vencido ? ' vencido' : ''}">${prazo.planejado ? '' : prazo.texto}</span>
      </div>
      ${travada ? `
        <div class="aviso-bloqueio">
          <b>AGUARDANDO</b>
          ${trava.map((d) => `${d.id} — ${esc(d.titulo)}`).join('<br>')}
        </div>` : ''}
    </article>`;
}

/** Aviso flutuante rapido. */
export function avisar(mensagem, erro = false) {
  document.querySelectorAll('.notificacao').forEach((n) => n.remove());
  const el = document.createElement('div');
  el.className = 'notificacao' + (erro ? ' erro' : '');
  el.textContent = mensagem;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export { fmtData, progressoTarefa };
