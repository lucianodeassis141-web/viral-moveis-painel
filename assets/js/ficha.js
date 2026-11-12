/* ==========================================================================
   Ficha da tarefa - modal com todos os campos, checklist e observacoes.
   ========================================================================== */

import { STATUS, PRIORIDADES, ORDEM_STATUS, ORDEM_PRIORIDADES, FASES, TRILHAS } from './dados-iniciais.js';
import { esc, fmtData, $, $$ } from './utils.js';
import * as st from './estado.js';
import { tagArea, tagTrilha, tagStatus, tagPrioridade, barra, situacaoPrazo, janela } from './componentes.js';

let idAberta = null;
const raiz = () => document.getElementById('modal-raiz');

export function fichaAberta() { return idAberta; }

export function abrirFicha(id) {
  idAberta = id;
  desenhar();
}

export function fecharFicha() {
  idAberta = null;
  raiz().innerHTML = '';
  document.body.style.overflow = '';
}

/** Redesenha o modal se ele estiver aberto (chamado a cada mudanca de estado). */
export function atualizarFicha() {
  if (idAberta) desenhar();
}

function desenhar() {
  const t = st.tarefa(idAberta);
  if (!t) return fecharFicha();

  const trava = st.bloqueios(t);
  const dependem = st.dependentes(t.id);
  const prazo = situacaoPrazo(t);
  const prog = st.progressoTarefa(t);
  const feitos = t.checklist.filter((c) => c.feito).length;

  const outras = st.obter().tarefas.filter((o) => o.id !== t.id);

  raiz().innerHTML = `
  <div class="fundo-modal" data-fechar="fundo">
    <div class="modal" role="dialog" aria-modal="true" aria-label="Ficha da tarefa ${t.id}">
      <header>
        <span class="id">${t.id}</span>
        <div class="tit">
          <h2><input class="titulo-editavel" data-campo="titulo" value="${esc(t.titulo)}" aria-label="Nome da atividade"></h2>
          <div class="metas">
            ${tagStatus(t.status)}${tagPrioridade(t.prioridade)}${tagArea(t.area)}${tagTrilha(t.trilha)}
            ${st.estaBloqueada(t) ? '<span class="tag bloqueio">BLOQUEADA</span>' : ''}
          </div>
        </div>
        <button class="btn fantasma" data-fechar="botao" aria-label="Fechar">✕</button>
      </header>

      <div class="corpo-modal">

        ${trava.length ? `
        <div class="bloco">
          <div class="aviso">
            <b>BLOQUEADA</b><br>
            Aguardando: ${trava.map((d) => `<b>${d.id}</b> — ${esc(d.titulo)} <span class="dim">(${STATUS[d.status].rotulo})</span>`).join('<br>Aguardando: ')}
          </div>
        </div>` : ''}

        ${dependem.length ? `
        <div class="bloco">
          <div class="aviso info">
            <b>ESTA TAREFA DESTRAVA OUTRAS</b><br>
            ${dependem.map((d) => `<b>${d.id}</b> — ${esc(d.titulo)} <span class="dim">(${d.responsavel})</span>`).join('<br>')}
          </div>
        </div>` : ''}

        <div class="bloco">
          <h3>Descrição</h3>
          <textarea data-campo="descricao" style="min-height:80px" placeholder="O que é esta atividade e o que conta como pronta.">${esc(t.descricao)}</textarea>
        </div>

        <div class="bloco">
          <h3>Situação</h3>
          <div class="campos">
            <div class="campo">
              <label>Status</label>
              <select data-campo="status">
                ${ORDEM_STATUS.map((s) => `<option value="${s}"${s === t.status ? ' selected' : ''}>${STATUS[s].rotulo}</option>`).join('')}
              </select>
            </div>
            <div class="campo">
              <label>Prioridade</label>
              <select data-campo="prioridade">
                ${ORDEM_PRIORIDADES.map((p) => `<option value="${p}"${p === t.prioridade ? ' selected' : ''}>${PRIORIDADES[p].rotulo}</option>`).join('')}
              </select>
            </div>
            <div class="campo">
              <label>Fase</label>
              <select data-campo="fase">
                ${Object.entries(FASES).map(([k, v]) => `<option value="${k}"${Number(k) === t.fase ? ' selected' : ''}>${esc(v)}</option>`).join('')}
              </select>
            </div>
            <div class="campo">
              <label>De quem é</label>
              <select data-campo="trilha">
                ${Object.entries(TRILHAS).map(([k, v]) => `<option value="${k}"${k === t.trilha ? ' selected' : ''}>${esc(v.rotulo)}</option>`).join('')}
              </select>
            </div>
            <div class="campo">
              <label>Responsável</label>
              <input type="text" data-campo="responsavel" value="${esc(t.responsavel)}" placeholder="Nome">
            </div>
          </div>
        </div>

        <div class="bloco">
          <h3>Datas e esforço</h3>
          <div class="campos">
            <div class="campo">
              <label>Data de início</label>
              <input type="date" data-campo="dataInicioReal" value="${t.dataInicioReal}">
            </div>
            <div class="campo">
              <label>Prazo</label>
              <input type="date" data-campo="prazo" value="${t.prazo}">
            </div>
            <div class="campo">
              <label>Data de conclusão</label>
              <input type="date" data-campo="dataConclusao" value="${t.dataConclusao}">
            </div>

          </div>
        </div>

        <div class="bloco">
          <h3>Dependências</h3>
          <div class="campo">
            <label>Esta tarefa só pode começar depois de</label>
            <select data-campo="dependencias" multiple size="5">
              ${outras.map((o) => `<option value="${o.id}"${t.dependencias.includes(o.id) ? ' selected' : ''}>${o.id} — ${esc(o.titulo)}</option>`).join('')}
            </select>
            <span class="dim" style="font-size:11px">Ctrl+clique para marcar ou desmarcar. Sem seleção = sem bloqueio.</span>
          </div>
        </div>

        <div class="bloco">
          <h3>Checklist — ${feitos}/${t.checklist.length} ${t.checklist.length ? `(${st.progressoTarefa(t)}%)` : ''}</h3>
          ${t.checklist.length ? barra(prog, true) : ''}
          <div style="margin-top:10px">
            ${t.checklist.map((c) => `
              <div class="check-item${c.feito ? ' feito' : ''}">
                <input type="checkbox" data-check="${c.id}"${c.feito ? ' checked' : ''}>
                <span class="texto" contenteditable="true" data-edit="${c.id}">${esc(c.texto)}</span>
                <button class="btn fantasma pequeno apagar" data-remove-check="${c.id}" title="Remover">✕</button>
              </div>`).join('') || '<p class="dim" style="font-size:12.5px">Nenhum item ainda.</p>'}
          </div>
          <div class="novo-check">
            <input type="text" id="novo-item" placeholder="Novo item do checklist e Enter">
            <button class="btn" data-add-check>Adicionar</button>
          </div>
        </div>

        <div class="bloco">
          <h3>Observações</h3>
          <textarea data-campo="observacoes" placeholder="Decisões, problemas, pendências, o que o cliente respondeu, links e notas.">${esc(t.observacoes)}</textarea>
          <p class="dim" style="font-size:11px;margin-top:5px">Salva sozinho ao sair do campo.</p>
        </div>

        <div style="display:flex;gap:9px;flex-wrap:wrap">
          ${t.status !== 'concluido'
            ? '<button class="btn primario" data-concluir>Marcar como concluída</button>'
            : '<button class="btn" data-reabrir>Reabrir tarefa</button>'}
          <button class="btn fantasma" data-fechar="botao">Fechar</button>
          <button class="btn perigo" data-excluir style="margin-left:auto">Excluir atividade</button>
        </div>
      </div>
    </div>
  </div>`;

  document.body.style.overflow = 'hidden';
  ligar(t);
}

function ligar(t) {
  const modal = $('.modal', raiz());

  raiz().querySelectorAll('[data-fechar]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (el.dataset.fechar === 'fundo' && e.target !== el) return;
      fecharFicha();
    });
  });

  $('[data-campo="status"]', modal).addEventListener('change', (e) => st.definirStatus(t.id, e.target.value));
  $('[data-campo="prioridade"]', modal).addEventListener('change', (e) => st.definirPrioridade(t.id, e.target.value));

  ['dataInicioReal', 'prazo', 'dataConclusao'].forEach((campo) => {
    $(`[data-campo="${campo}"]`, modal).addEventListener('change', (e) => {
      st.atualizarTarefa(t.id, { [campo]: e.target.value });
    });
  });

  ['titulo', 'descricao', 'responsavel'].forEach((campo) => {
    const el = $(`[data-campo="${campo}"]`, modal);
    el.addEventListener('blur', () => {
      const v = el.value.trim();
      if (campo === 'titulo' && !v) { el.value = t.titulo; return; }
      st.atualizarTarefa(t.id, { [campo]: v });
    });
    if (el.tagName === 'INPUT') el.addEventListener('keydown', (e) => { if (e.key === 'Enter') el.blur(); });
  });
  $('[data-campo="fase"]', modal).addEventListener('change', (e) => st.definirFase(t.id, e.target.value));
  $('[data-campo="trilha"]', modal).addEventListener('change', (e) => st.atualizarTarefa(t.id, { trilha: e.target.value }));

  const excluir = $('[data-excluir]', modal);
  excluir.addEventListener('click', () => {
    if (excluir.dataset.confirmar) { const id = t.id; fecharFicha(); st.removerTarefa(id); return; }
    excluir.dataset.confirmar = '1';
    excluir.textContent = 'Clique de novo para excluir';
  });

  $('[data-campo="dependencias"]', modal).addEventListener('change', (e) => {
    const ids = Array.from(e.target.selectedOptions).map((o) => o.value);
    st.atualizarTarefa(t.id, { dependencias: ids });
  });

  const obs = $('[data-campo="observacoes"]', modal);
  obs.addEventListener('blur', () => st.atualizarTarefa(t.id, { observacoes: obs.value }));

  $$('[data-check]', modal).forEach((el) => {
    el.addEventListener('change', () => st.alternarItemChecklist(t.id, el.dataset.check));
  });
  $$('[data-edit]', modal).forEach((el) => {
    el.addEventListener('blur', () => st.editarItemChecklist(t.id, el.dataset.edit, el.textContent));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
  });
  $$('[data-remove-check]', modal).forEach((el) => {
    el.addEventListener('click', () => st.removerItemChecklist(t.id, el.dataset.removeCheck));
  });

  const novo = $('#novo-item', modal);
  const adicionar = () => {
    if (!novo.value.trim()) return;
    st.addItemChecklist(t.id, novo.value);
  };
  $('[data-add-check]', modal).addEventListener('click', adicionar);
  novo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); adicionar(); } });

  const concluir = $('[data-concluir]', modal);
  if (concluir) concluir.addEventListener('click', () => st.definirStatus(t.id, 'concluido'));
  const reabrir = $('[data-reabrir]', modal);
  if (reabrir) reabrir.addEventListener('click', () => st.definirStatus(t.id, 'andamento'));
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && idAberta) fecharFicha();
});
