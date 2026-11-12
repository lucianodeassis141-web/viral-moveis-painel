/* ==========================================================================
   Kanban - quatro colunas, cartao arrastavel e troca rapida de status.
   ========================================================================== */

import * as st from '../estado.js';
import { STATUS, ORDEM_STATUS, ORDEM_PRIORIDADES, PRIORIDADES, FASES } from '../dados-iniciais.js';
import { botaoNova, ligarNova } from '../nova.js';
import { cartaoTarefa, avisar } from '../componentes.js';
import { abrirFicha } from '../ficha.js';

let filtroPrioridade = 'todas';
let filtroFase = 'todas';

export function render(alvo) {
  const lista = ordenar(aplicarFiltro(st.tarefasDoEscopo()));

  alvo.innerHTML = `
  <section class="secao">
    <header>
      <h2>Kanban</h2>
      <span class="nota">arraste os cartões entre as colunas ou clique para abrir a ficha</span>
      <div style="margin-left:auto;display:flex;gap:9px;align-items:flex-end">
        <div class="campo">
          <label>Fase</label>
          <select id="f-fase">
            <option value="todas"${filtroFase === 'todas' ? ' selected' : ''}>Todas</option>
            ${Object.entries(FASES).map(([k, v]) => `<option value="${k}"${filtroFase === k ? ' selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label>Prioridade</label>
          <select id="f-prio">
            <option value="todas"${filtroPrioridade === 'todas' ? ' selected' : ''}>Todas</option>
            ${ORDEM_PRIORIDADES.map((p) => `<option value="${p}"${filtroPrioridade === p ? ' selected' : ''}>${PRIORIDADES[p].rotulo}</option>`).join('')}
          </select>
        </div>
        ${botaoNova()}
      </div>
    </header>

    <div class="kanban">
      ${ORDEM_STATUS.map((s) => {
        const doStatus = lista.filter((t) => t.status === s);
        return `
        <div class="coluna" data-col="${s}">
          <header>
            <span class="titulo">${STATUS[s].curto}</span>
            <span class="qtd">${doStatus.length}</span>
          </header>
          <div class="lista-coluna">
            ${doStatus.map(cartaoTarefa).join('') || '<p class="dim" style="font-size:11.5px;padding:8px 4px">Vazio</p>'}
          </div>
        </div>`;
      }).join('')}
    </div>
  </section>`;

  ligar(alvo);
}

function aplicarFiltro(lista) {
  return lista.filter((t) => {
    if (filtroPrioridade !== 'todas' && t.prioridade !== filtroPrioridade) return false;
    if (filtroFase !== 'todas' && String(t.fase) !== filtroFase) return false;
    return true;
  });
}

function ordenar(lista) {
  return [...lista].sort((a, b) => {
    const pa = PRIORIDADES[b.prioridade].peso - PRIORIDADES[a.prioridade].peso;
    if (pa !== 0) return pa;
    return a.diaInicio - b.diaInicio;
  });
}

function ligar(alvo) {
  ligarNova(alvo, filtroFase === 'todas' ? 1 : Number(filtroFase));
  alvo.querySelector('#f-prio').addEventListener('change', (e) => {
    filtroPrioridade = e.target.value;
    render(alvo);
  });
  alvo.querySelector('#f-fase').addEventListener('change', (e) => {
    filtroFase = e.target.value;
    render(alvo);
  });

  alvo.querySelectorAll('.cartao-tarefa').forEach((cartao) => {
    cartao.addEventListener('click', () => abrirFicha(cartao.dataset.id));
    cartao.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirFicha(cartao.dataset.id); }
    });
    cartao.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', cartao.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
      cartao.classList.add('arrastando');
    });
    cartao.addEventListener('dragend', () => cartao.classList.remove('arrastando'));
  });

  alvo.querySelectorAll('.coluna').forEach((coluna) => {
    coluna.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      coluna.classList.add('alvo');
    });
    coluna.addEventListener('dragleave', (e) => {
      if (!coluna.contains(e.relatedTarget)) coluna.classList.remove('alvo');
    });
    coluna.addEventListener('drop', (e) => {
      e.preventDefault();
      coluna.classList.remove('alvo');
      const id = e.dataTransfer.getData('text/plain');
      const destino = coluna.dataset.col;
      const t = st.tarefa(id);
      if (!t || t.status === destino) return;
      if (destino !== 'pendente' && st.estaBloqueada(t)) {
        const travas = st.bloqueios(t).map((d) => d.id).join(', ');
        avisar(`${t.id} está bloqueada — aguardando ${travas}. Movida assim mesmo.`, true);
      }
      st.definirStatus(id, destino);
    });
  });
}
