/* ==========================================================================
   Casca do painel - navegacao, cabecalho e redesenho a cada mudanca.
   ========================================================================== */

import * as st from './estado.js';
import { STATUS_PROJETO } from './dados-iniciais.js';
import { $ } from './utils.js';
import { atualizarFicha } from './ficha.js';

import * as dashboard from './vistas/dashboard.js';
import * as kanban from './vistas/kanban.js';
import * as tarefas from './vistas/tarefas.js';
import * as materiais from './vistas/materiais.js';
import * as registro from './vistas/registro.js';
import * as projeto from './vistas/projeto.js';

const VISTAS = [
  { id: 'painel',    rotulo: 'Painel',      modulo: dashboard, titulo: 'Plano de ação' },
  { id: 'kanban',    rotulo: 'Kanban',      modulo: kanban,    titulo: 'Kanban' },
  { id: 'tarefas',   rotulo: 'Atividades',  modulo: tarefas,   titulo: 'Lista de atividades' },
  { id: 'materiais', rotulo: 'Pendências',  modulo: materiais, titulo: 'O que precisa vir do time' },
  { id: 'registro',  rotulo: 'Registro',    modulo: registro,  titulo: 'Log de atividades' },
  { id: 'projeto',   rotulo: 'Projeto',     modulo: projeto,   titulo: 'Projeto e backup' },
];

let atual = (location.hash || '#painel').slice(1);
if (!VISTAS.some((v) => v.id === atual)) atual = 'painel';

function contadores() {
  const e = st.obter();
  const escopo = st.tarefasDoEscopo();
  return {
    kanban: escopo.length,
    tarefas: escopo.length,
    materiais: e.materiais.filter((m) => m.status === 'pendente' || m.status === 'solicitado').length,
    registro: e.registros.length,
  };
}

function desenharLateral() {
  const c = contadores();
  $('#nav').innerHTML = VISTAS.map((v) => `
    <button data-vista="${v.id}" class="${v.id === atual ? 'ativo' : ''}">
      ${v.rotulo}
      ${c[v.id] !== undefined && c[v.id] > 0 ? `<span class="conta">${c[v.id]}</span>` : ''}
    </button>`).join('');

  $('#nav').querySelectorAll('[data-vista]').forEach((b) => {
    b.addEventListener('click', () => ir(b.dataset.vista));
  });
}

function desenharTopo() {
  const e = st.obter();
  const vista = VISTAS.find((v) => v.id === atual);
  const escopo = e.ui.escopo;

  $('#topo').innerHTML = `
    <div class="titulo-bloco">
      <div class="eyebrow">Viral Móveis</div>
      <h1 class="display">${vista.titulo}</h1>
    </div>

    <div class="segmentado" id="escopo">
      <button data-escopo="minha-trilha" class="${escopo === 'minha-trilha' ? 'ativo' : ''}">Minha parte</button>
      <button data-escopo="completo" class="${escopo === 'completo' ? 'ativo' : ''}">Plano completo</button>
    </div>

    <div class="campo" style="min-width:172px">
      <label>Status do projeto</label>
      <select id="status-projeto">
        ${Object.entries(STATUS_PROJETO).map(([k, v]) =>
          `<option value="${k}"${e.projeto.status === k ? ' selected' : ''}>${v.rotulo}</option>`).join('')}
      </select>
    </div>`;

  $('#escopo').querySelectorAll('[data-escopo]').forEach((b) => {
    b.addEventListener('click', () => st.definirEscopo(b.dataset.escopo));
  });
  $('#status-projeto').addEventListener('change', (ev) => st.atualizarProjeto({ status: ev.target.value }));
}

/** O painel publicado sobe sem dados de propria: o conteudo real entra por
 *  importacao de backup, e fica so no navegador de quem importou. */
function avisoSemDados() {
  if (st.obter().tarefas.length) return '';
  const naTelaCerta = atual === 'projeto';
  return `
    <section class="secao">
      <header>
        <h2>Painel vazio</h2>
        <span class="nota">o app está publicado, os dados não</span>
      </header>
      <p style="padding:0 18px 4px;max-width:66ch;line-height:1.55">
        Nenhuma tarefa carregada. Os dados deste painel não viajam junto com a página:
        eles ficam no <strong>localStorage do seu navegador</strong>. Para encher a tela,
        abra ${naTelaCerta ? '<strong>Importar dados</strong> logo abaixo' : 'a aba <strong>Projeto</strong>'}
        e carregue o arquivo do plano (JSON).
      </p>
      ${naTelaCerta ? '' : '<div style="padding:0 18px 16px"><button class="btn primario" id="ir-importar">Ir para Projeto → Importar dados</button></div>'}
    </section>`;
}

function desenharVista() {
  const vista = VISTAS.find((v) => v.id === atual);
  const alvo = $('#conteudo');
  alvo.scrollTop = 0;
  vista.modulo.render(alvo);

  const aviso = avisoSemDados();
  if (!aviso) return;
  alvo.insertAdjacentHTML('afterbegin', aviso);
  const botao = alvo.querySelector('#ir-importar');
  if (botao) botao.addEventListener('click', () => ir('projeto'));
}

function desenharTudo() {
  desenharLateral();
  desenharTopo();
  desenharVista();
  atualizarFicha();
}

function ir(id) {
  if (!VISTAS.some((v) => v.id === id)) return;
  atual = id;
  history.replaceState(null, '', '#' + id);
  desenharTudo();
  window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (id && id !== atual) ir(id);
});

st.assinar(() => desenharTudo());

desenharTudo();
