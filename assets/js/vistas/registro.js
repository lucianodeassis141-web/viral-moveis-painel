/* ==========================================================================
   Registro de atividades - automatico e manual.
   Historico do plano: o que mudou e as notas de cada um.
   ========================================================================== */

import * as st from '../estado.js';
import { esc, fmtData, hojeIso } from '../utils.js';

let filtro = 'todos';

export function render(alvo) {
  const e = st.obter();
  const lista = filtro === 'todos'
    ? e.registros
    : e.registros.filter((r) => (filtro === 'manual' ? !r.auto : r.auto));

  alvo.innerHTML = `
  <section class="secao">
    <header>
      <h2>Log de atividades</h2>
      <span class="nota">${e.registros.length} ${e.registros.length === 1 ? 'entrada' : 'entradas'} · mudanças de status, prioridade, prazo e pendências entram sozinhas</span>
      <div class="segmentado" style="margin-left:auto">
        <button data-filtro="todos" class="${filtro === 'todos' ? 'ativo' : ''}">Tudo</button>
        <button data-filtro="manual" class="${filtro === 'manual' ? 'ativo' : ''}">Minhas notas</button>
        <button data-filtro="auto" class="${filtro === 'auto' ? 'ativo' : ''}">Automáticas</button>
      </div>
    </header>

    <div class="cartao topo-vermelho" style="margin-bottom:18px">
      <div class="eyebrow" style="margin-bottom:11px">Registrar atividade</div>
      <div class="grade" style="grid-template-columns:150px 170px 1fr;gap:11px;margin-bottom:11px">
        <div class="campo">
          <label>Data</label>
          <input type="date" id="r-data" value="${hojeIso()}">
        </div>
        <div class="campo">
          <label>Usuário</label>
          <select id="r-usuario">
            <option>Luciano</option>
            <option>Parceiro</option>
            <option>Time Viral</option>
          </select>
        </div>
        <div class="campo">
          <label>Atividade</label>
          <input type="text" id="r-atividade" placeholder="Ex.: Acessos liberados.">
        </div>
      </div>
      <div class="campo" style="margin-bottom:11px">
        <label>Observação</label>
        <textarea id="r-obs" style="min-height:60px" placeholder="Detalhe, decisão tomada, link, número combinado…"></textarea>
      </div>
      <button class="btn primario" id="r-salvar">Registrar</button>
    </div>

    <div class="cartao">
      ${lista.length ? lista.map(item).join('') : '<p class="dim" style="font-size:12.5px">Nenhuma entrada com este filtro.</p>'}
    </div>
  </section>`;

  ligar(alvo);
}

function item(r) {
  return `
  <div class="registro" data-tipo="${r.tipo}">
    <span class="marcador"></span>
    <div class="corpo">
      <div class="cab">
        <span>${fmtData(r.data)}</span>
        <span class="quem">${esc(r.usuario)}</span>
        ${r.auto ? '<span class="dim">automático</span>' : ''}
        <span class="dim" style="margin-left:auto">${esc(r.quando)}</span>
      </div>
      <div class="txt">${esc(r.atividade)}</div>
      ${r.observacao ? `<div class="obs">${esc(r.observacao)}</div>` : ''}
    </div>
    <button class="btn fantasma pequeno apagar" data-apagar="${r.id}" title="Remover entrada">✕</button>
  </div>`;
}

function ligar(alvo) {
  alvo.querySelectorAll('[data-filtro]').forEach((b) => {
    b.addEventListener('click', () => { filtro = b.dataset.filtro; render(alvo); });
  });

  const salvar = () => {
    const atividade = alvo.querySelector('#r-atividade').value;
    if (!atividade.trim()) return;
    st.adicionarRegistro({
      data: alvo.querySelector('#r-data').value,
      usuario: alvo.querySelector('#r-usuario').value,
      atividade,
      observacao: alvo.querySelector('#r-obs').value,
    });
  };

  alvo.querySelector('#r-salvar').addEventListener('click', salvar);
  alvo.querySelector('#r-atividade').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); salvar(); }
  });

  alvo.querySelectorAll('[data-apagar]').forEach((b) => {
    b.addEventListener('click', () => st.removerRegistro(b.dataset.apagar));
  });
}
