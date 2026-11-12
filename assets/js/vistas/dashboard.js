/* ==========================================================================
   Painel - visao geral do plano de acao
   ========================================================================== */

import * as st from '../estado.js';
import { STATUS_MATERIAL, FASES } from '../dados-iniciais.js';
import { esc, pct } from '../utils.js';
import { barra, tagStatus, tagPrioridade, tagTrilha, situacaoPrazo } from '../componentes.js';
import { abrirFicha } from '../ficha.js';
import { botaoNova, ligarNova } from '../nova.js';

const f = (t) => t.status === 'concluido';

export function render(alvo) {
  const e = st.obter();
  const lista = st.tarefasDoEscopo();
  const c = st.contagens(lista);
  const todas = st.contagens(e.tarefas);

  const emAndamento = lista.filter((t) => t.status === 'andamento' || t.status === 'revisao');
  const atrasadas = lista.filter((t) => situacaoPrazo(t).vencido);
  const matPendentes = e.materiais.filter((m) => m.status === 'pendente' || m.status === 'solicitado');
  const matCriticos = matPendentes.filter((m) => m.critico);

  // a fase atual e a primeira que ainda tem atividade aberta
  const faseAtual = Object.keys(FASES).map(Number)
    .find((n) => e.tarefas.some((t) => t.fase === n && t.status !== 'concluido')) || null;

  const doLuciano = e.tarefas.filter((t) => t.trilha === '1');
  const doTime = e.tarefas.filter((t) => t.trilha === '2');
  const juntas = e.tarefas.filter((t) => t.trilha === 'ambos');

  alvo.innerHTML = `
  <section class="secao">
    <div class="grade g-4">
      ${indicador('Plano concluído', todas.percentual + '<span style="font-size:20px">%</span>', `${todas.concluido} de ${todas.total} atividades`, 'var(--vermelho)', true)}
      ${indicador('Em andamento', c.andamento + c.revisao, `${c.revisao} em revisão`, 'var(--st-andamento)')}
      ${indicador('Fase atual', faseAtual ? faseAtual : '—', faseAtual ? esc(FASES[faseAtual].split(' · ')[1]) : 'tudo concluído', 'var(--st-revisao)')}
      ${indicador('Pendências do time', matPendentes.length, matPendentes.length ? 'ainda não chegaram' : 'tudo em mãos', 'var(--alerta)')}
    </div>
  </section>

  ${matCriticos.length ? `
  <section class="secao">
    <div class="aviso">
      <b>A FASE 1 ESPERA POR ISTO</b><br>
      ${matCriticos.map((m) => esc(m.nome)).join(' · ')}
    </div>
  </section>` : ''}

  <section class="secao">
    <header>
      <h2>As 4 fases</h2>
      <span class="nota">primeiro o comercial, depois a gestão, o portal e a escala</span>
    </header>
    <div class="grade g-4">
      ${Object.entries(FASES).map(([n, nome]) => cartaoFase(Number(n), nome, e.tarefas, faseAtual)).join('')}
    </div>
  </section>

  <section class="secao">
    <header>
      <h2>O que está em jogo agora</h2>
      <span class="nota">${e.ui.escopo === 'completo' ? 'plano completo' : 'só o que é seu ou dos dois'}</span>
      <div style="margin-left:auto">${botaoNova()}</div>
    </header>
    <div class="grade g-3">
      ${painelTarefas('Em andamento', emAndamento, 'Nada em andamento. Mova uma atividade para EM ANDAMENTO no Kanban.')}
      ${painelProximas(lista, faseAtual)}
      ${painelTarefas('Prazo vencido', atrasadas, 'Nenhuma atividade com prazo vencido.')}
    </div>
  </section>

  <section class="secao">
    <header><h2>Quem faz o quê</h2><span class="nota">atividades concluídas por lado</span></header>
    <div class="cartao topo-vermelho" style="display:flex;flex-direction:column;gap:10px">
      ${linha('Luciano', doLuciano.filter(f).length, doLuciano.length)}
      ${linha('Time Viral', doTime.filter(f).length, doTime.length)}
      ${linha('Os dois juntos', juntas.filter(f).length, juntas.length)}
    </div>
  </section>

  <section class="secao">
    <header>
      <h2>O que precisa vir do time</h2>
      <span class="nota">${matPendentes.length} de ${e.materiais.length} ainda não chegaram</span>
    </header>
    <div class="cartao">
      <div class="grade g-3">
        ${e.materiais.map((m) => `
          <div style="display:flex;align-items:flex-start;gap:9px;font-size:12.5px">
            <span class="tag ponto" data-status="${mapaMaterial(m.status)}">${STATUS_MATERIAL[m.status].rotulo.toUpperCase()}</span>
            <span class="${m.status === 'pendente' ? '' : 'dim2'}">${esc(m.nome)}</span>
          </div>`).join('') || '<p class="dim" style="font-size:12.5px">Nenhuma pendência cadastrada.</p>'}
      </div>
    </div>
  </section>`;

  alvo.querySelectorAll('[data-abrir]').forEach((el) => {
    el.addEventListener('click', () => abrirFicha(el.dataset.abrir));
  });
  ligarNova(alvo, faseAtual || 1);
}

/* -------------------------------- pedacos -------------------------------- */

function indicador(rotulo, valor, apoio, cor, destaque = false) {
  return `
    <div class="cartao indicador" style="--cor:${cor}">
      <div class="rotulo">${esc(rotulo)}</div>
      <div class="valor"${destaque ? ` style="color:${cor}"` : ''}>${valor}</div>
      <div class="apoio">${apoio}</div>
    </div>`;
}

function cartaoFase(n, nome, tarefas, faseAtual) {
  const da = tarefas.filter((t) => t.fase === n);
  const feitas = da.filter(f).length;
  const p = pct(feitas, da.length);
  const atual = n === faseAtual;
  return `
    <div class="cartao${atual ? ' topo-vermelho' : ''}">
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
        <span class="eyebrow"${atual ? '' : ' style="color:var(--on-dark-dim)"'}>Fase ${n}${atual ? ' · agora' : ''}</span>
        <span class="num" style="font-size:20px;margin-left:auto">${p}%</span>
      </div>
      <div style="font-weight:600;font-size:14px;margin-bottom:10px">${esc(nome.split(' · ')[1])}</div>
      ${barra(p, true)}
      <p class="dim" style="font-size:11.5px;margin-top:8px">${feitas} de ${da.length} concluídas</p>
    </div>`;
}

function linha(rotulo, feitas, total) {
  return `
    <div class="linha-progresso">
      <span class="rot">${esc(rotulo)}</span>
      ${barra(pct(feitas, total), true)}
      <span class="frac">${feitas} / ${total}</span>
    </div>`;
}

function itemTarefa(t, extra = '') {
  return `
    <div data-abrir="${t.id}" style="display:flex;gap:9px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--borda-suave);cursor:pointer">
      <span class="num" style="color:var(--vermelho);font-size:14px;min-width:34px">${t.id}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12.5px;font-weight:600">${esc(t.titulo)}</div>
        <div style="display:flex;gap:5px;margin-top:5px;flex-wrap:wrap">
          ${tagStatus(t.status)}${tagPrioridade(t.prioridade)}${tagTrilha(t.trilha)}
        </div>
        ${extra}
      </div>
    </div>`;
}

function painelTarefas(titulo, tarefas, vazio) {
  return `
  <div class="cartao">
    <div class="eyebrow" style="margin-bottom:10px">${esc(titulo)} ${tarefas.length ? `· ${tarefas.length}` : ''}</div>
    ${tarefas.length
      ? tarefas.map((t) => {
          const p = situacaoPrazo(t);
          return itemTarefa(t, p.planejado ? '' : `<div style="font-size:11px;margin-top:5px;${p.vencido ? 'color:var(--alerta)' : 'color:var(--on-dark-dim)'}">prazo ${p.texto}</div>`);
        }).join('')
      : `<p class="dim" style="font-size:12.5px">${esc(vazio)}</p>`}
  </div>`;
}

function painelProximas(lista, faseAtual) {
  const peso = { critica: 4, alta: 3, media: 2, baixa: 1 };
  const proximas = lista
    .filter((t) => t.status === 'pendente' && !st.estaBloqueada(t))
    .sort((a, b) => (a.fase - b.fase) || (peso[b.prioridade] - peso[a.prioridade]))
    .slice(0, 5);
  return `
  <div class="cartao">
    <div class="eyebrow" style="margin-bottom:10px">Próximas a começar</div>
    ${proximas.length
      ? proximas.map((t) => itemTarefa(t, `<div style="font-size:11px;color:var(--on-dark-dim);margin-top:5px">Fase ${t.fase}${t.responsavel ? ' · ' + esc(t.responsavel) : ''}</div>`)).join('')
      : '<p class="dim" style="font-size:12.5px">Nada pendente e livre.</p>'}
  </div>`;
}

function mapaMaterial(status) {
  return { pendente: 'pendente', solicitado: 'revisao', recebido: 'andamento', validado: 'concluido' }[status];
}
