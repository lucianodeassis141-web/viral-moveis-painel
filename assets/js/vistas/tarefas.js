/* ==========================================================================
   Lista de tarefas - tabela com filtros e ordenacao.
   ========================================================================== */

import * as st from '../estado.js';
import { STATUS, PRIORIDADES, ORDEM_STATUS, ORDEM_PRIORIDADES } from '../dados-iniciais.js';
import { esc } from '../utils.js';
import { seletorStatus, seletorPrioridade, barra, situacaoPrazo, tagArea, janela } from '../componentes.js';
import { abrirFicha } from '../ficha.js';
import { botaoNova, ligarNova } from '../nova.js';

const filtros = { responsavel: 'todos', area: 'todas', status: 'todos', prioridade: 'todas', busca: '' };
let ordem = { campo: 'id', desc: false };

export function render(alvo) {
  const todas = st.tarefasDoEscopo();
  const lista = ordenar(filtrar(todas));

  const responsaveis = [...new Set(st.obter().tarefas.map((t) => t.responsavel))];
  const areas = [...new Set(st.obter().tarefas.map((t) => t.area))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  alvo.innerHTML = `
  <section class="secao">
    <header>
      <h2>Lista de tarefas</h2>
      <span class="nota">${lista.length} de ${todas.length} no escopo atual · clique na linha para abrir a ficha</span>
      <div style="margin-left:auto">${botaoNova()}</div>
    </header>

    <div class="filtros">
      <div class="campo busca">
        <label>Buscar</label>
        <input type="text" id="f-busca" placeholder="ID ou nome da tarefa" value="${esc(filtros.busca)}">
      </div>
      <div class="campo">
        <label>Responsável</label>
        <select id="f-resp">
          <option value="todos">Todos</option>
          ${responsaveis.map((r) => `<option value="${esc(r)}"${filtros.responsavel === r ? ' selected' : ''}>${esc(r)}</option>`).join('')}
        </select>
      </div>
      <div class="campo">
        <label>Fase</label>
        <select id="f-area">
          <option value="todas">Todas</option>
          ${areas.map((a) => `<option value="${esc(a)}"${filtros.area === a ? ' selected' : ''}>${esc(a)}</option>`).join('')}
        </select>
      </div>
      <div class="campo">
        <label>Status</label>
        <select id="f-status">
          <option value="todos">Todos</option>
          ${ORDEM_STATUS.map((s) => `<option value="${s}"${filtros.status === s ? ' selected' : ''}>${STATUS[s].rotulo}</option>`).join('')}
          <option value="bloqueadas"${filtros.status === 'bloqueadas' ? ' selected' : ''}>Somente bloqueadas</option>
        </select>
      </div>
      <div class="campo">
        <label>Prioridade</label>
        <select id="f-prio">
          <option value="todas">Todas</option>
          ${ORDEM_PRIORIDADES.map((p) => `<option value="${p}"${filtros.prioridade === p ? ' selected' : ''}>${PRIORIDADES[p].rotulo}</option>`).join('')}
        </select>
      </div>
      <button class="btn fantasma" id="f-limpar">Limpar filtros</button>
    </div>

    <div class="envolve-tabela">
      <table class="tabela">
        <thead>
          <tr>
            ${cabecalho('id', 'ID')}
            <th>Tarefa</th>
            <th>Área</th>
            <th>Responsável</th>
            <th>Status</th>
            ${cabecalho('prioridade', 'Prioridade')}
            <th>Janela</th>
            ${cabecalho('prazo', 'Prazo')}
            <th>Dependência</th>
            <th>Progresso</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(linha).join('') || '<tr><td colspan="10" style="padding:26px;text-align:center;color:var(--on-dark-dim)">Nenhuma tarefa com esses filtros.</td></tr>'}
        </tbody>
      </table>
    </div>
  </section>`;

  ligar(alvo);
}

function cabecalho(campo, rotulo) {
  const ativo = ordem.campo === campo;
  return `<th class="ordenavel" data-ordenar="${campo}">${rotulo}${ativo ? `<span class="seta">${ordem.desc ? '▼' : '▲'}</span>` : ''}</th>`;
}

function linha(t) {
  const travas = st.bloqueios(t);
  const prazo = situacaoPrazo(t);
  const prog = st.progressoTarefa(t);
  return `
  <tr data-id="${t.id}">
    <td class="cod">${t.id}</td>
    <td class="nome">
      ${esc(t.titulo)}
      ${travas.length ? `<span class="dep">BLOQUEADA — aguardando ${travas.map((d) => d.id).join(', ')}</span>` : ''}
    </td>
    <td>${tagArea(t.area)}</td>
    <td class="dim2">${esc(t.responsavel)}</td>
    <td data-parar>${seletorStatus(t)}</td>
    <td data-parar>${seletorPrioridade(t)}</td>
    <td class="dim2" style="white-space:nowrap">${janela(t)}</td>
    <td class="${prazo.vencido ? '' : 'dim2'}" style="${prazo.vencido ? 'color:var(--alerta);font-weight:700' : ''};white-space:nowrap">
      ${prazo.planejado ? '<span class="dim">—</span>' : prazo.texto}
    </td>
    <td class="dim2" style="white-space:nowrap">
      ${(t.dependencias || []).length
        ? t.dependencias.map((d) => `<span class="tag linha" style="margin-right:3px">${d}</span>`).join('')
        : '<span class="dim">—</span>'}
    </td>
    <td>
      <div class="mini-progresso">${barra(prog, true)}<span>${prog}%</span></div>
    </td>
  </tr>`;
}

function filtrar(lista) {
  const busca = filtros.busca.trim().toLowerCase();
  return lista.filter((t) => {
    if (filtros.responsavel !== 'todos' && t.responsavel !== filtros.responsavel) return false;
    if (filtros.area !== 'todas' && t.area !== filtros.area) return false;
    if (filtros.status === 'bloqueadas') { if (!st.estaBloqueada(t)) return false; }
    else if (filtros.status !== 'todos' && t.status !== filtros.status) return false;
    if (filtros.prioridade !== 'todas' && t.prioridade !== filtros.prioridade) return false;
    if (busca && !(`${t.id} ${t.titulo}`.toLowerCase().includes(busca))) return false;
    return true;
  });
}

function ordenar(lista) {
  const dir = ordem.desc ? -1 : 1;
  return [...lista].sort((a, b) => {
    let r = 0;
    if (ordem.campo === 'prioridade') {
      // a ordem natural aqui e da mais urgente para a menos urgente
      r = PRIORIDADES[b.prioridade].peso - PRIORIDADES[a.prioridade].peso;
      if (r === 0) r = a.diaInicio - b.diaInicio;
    } else if (ordem.campo === 'prazo') {
      const pa = st.prazoDaTarefa(a) || String(a.diaFim).padStart(4, '0');
      const pb = st.prazoDaTarefa(b) || String(b.diaFim).padStart(4, '0');
      r = pa < pb ? -1 : pa > pb ? 1 : 0;
      if (r === 0) r = a.diaFim - b.diaFim;
    } else {
      r = a.id.localeCompare(b.id, 'pt-BR', { numeric: true });
    }
    return r * dir;
  });
}

function ligar(alvo) {
  ligarNova(alvo);
  const busca = alvo.querySelector('#f-busca');
  busca.addEventListener('input', (e) => {
    filtros.busca = e.target.value;
    const pos = e.target.selectionStart;
    render(alvo);
    const novo = alvo.querySelector('#f-busca');
    novo.focus();
    novo.setSelectionRange(pos, pos);
  });

  const liga = (sel, campo) => alvo.querySelector(sel).addEventListener('change', (e) => {
    filtros[campo] = e.target.value;
    render(alvo);
  });
  liga('#f-resp', 'responsavel');
  liga('#f-area', 'area');
  liga('#f-status', 'status');
  liga('#f-prio', 'prioridade');

  alvo.querySelector('#f-limpar').addEventListener('click', () => {
    Object.assign(filtros, { responsavel: 'todos', area: 'todas', status: 'todos', prioridade: 'todas', busca: '' });
    render(alvo);
  });

  alvo.querySelectorAll('[data-ordenar]').forEach((th) => {
    th.addEventListener('click', () => {
      const campo = th.dataset.ordenar;
      ordem = { campo, desc: ordem.campo === campo ? !ordem.desc : false };
      render(alvo);
    });
  });

  alvo.querySelectorAll('tbody tr[data-id]').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('[data-parar]')) return;
      abrirFicha(tr.dataset.id);
    });
  });

  alvo.querySelectorAll('select[data-acao]').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      const { acao, id } = sel.dataset;
      if (acao === 'status') st.definirStatus(id, e.target.value);
      if (acao === 'prioridade') st.definirPrioridade(id, e.target.value);
    });
    sel.addEventListener('click', (e) => e.stopPropagation());
  });
}
