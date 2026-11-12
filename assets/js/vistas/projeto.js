/* ==========================================================================
   Projeto - status geral, dados do plano, backup e restauracao.
   ========================================================================== */

import * as st from '../estado.js';
import { STATUS_PROJETO, CHAVE_ARMAZENAMENTO } from '../dados-iniciais.js';
import { esc, baixarJson } from '../utils.js';
import { avisar } from '../componentes.js';

export function render(alvo) {
  const e = st.obter();
  const p = e.projeto;

  alvo.innerHTML = `
  <section class="secao">
    <header>
      <h2>O plano</h2>
      <span class="nota">os campos salvam sozinhos ao sair</span>
    </header>
    <div class="cartao topo-vermelho">
      <div class="grade g-3" style="gap:15px">
        <div class="campo">
          <label for="p-status">Status do plano</label>
          <select id="p-status">
            ${Object.entries(STATUS_PROJETO).map(([k, v]) =>
              `<option value="${k}"${p.status === k ? ' selected' : ''}>${v.rotulo}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label for="p-reuniao">Data da reunião</label>
          <input type="date" id="p-reuniao" value="${esc(p.dataReuniao || '')}">
        </div>
        <div class="campo">
          <label for="p-contato">Contato</label>
          <input type="text" id="p-contato" value="${esc(p.contato || '')}" placeholder="Quem responde pelo plano">
        </div>
      </div>
    </div>
  </section>

  <section class="secao">
    <header>
      <h2>Backup e troca de dados</h2>
      <span class="nota">tudo fica neste navegador · para o outro ver suas mudanças, exporte e mande o arquivo</span>
    </header>
    <div class="cartao">
      <div style="display:flex;gap:9px;flex-wrap:wrap">
        <button class="btn primario" id="b-exportar">Exportar dados (JSON)</button>
        <button class="btn" id="b-importar">Importar dados</button>
        <input type="file" id="b-arquivo" accept="application/json,.json" style="display:none">
        <button class="btn perigo" id="b-zerar" style="margin-left:auto">Apagar tudo deste navegador</button>
      </div>
      <div class="grade g-3" style="margin-top:16px;gap:14px">
        ${info('Atividades', String(e.tarefas.length))}
        ${info('Pendências do time', String(e.materiais.length))}
        ${info('Registros', String(e.registros.length))}
      </div>
      <p class="dim" style="font-size:11.5px;margin-top:12px">
        O arquivo leva tudo: atividades, checklist, observações, pendências e registro
        (a chave <code>${CHAVE_ARMAZENAMENTO}</code> inteira). Importar junta o arquivo com o que já está aqui.
      </p>
    </div>
  </section>`;

  ligar(alvo);
}

function info(rotulo, valor) {
  return `
    <div>
      <div class="eyebrow" style="color:var(--on-dark-dim)">${esc(rotulo)}</div>
      <div style="font-size:13.5px;font-weight:600;margin-top:5px;word-break:break-word">${esc(valor)}</div>
    </div>`;
}

function ligar(alvo) {
  alvo.querySelector('#p-status').addEventListener('change', (ev) =>
    st.atualizarProjeto({ status: ev.target.value }));
  alvo.querySelector('#p-reuniao').addEventListener('change', (ev) =>
    st.atualizarProjeto({ dataReuniao: ev.target.value }));
  alvo.querySelector('#p-contato').addEventListener('change', (ev) =>
    st.atualizarProjeto({ contato: ev.target.value.trim() }));

  alvo.querySelector('#b-exportar').addEventListener('click', () => {
    const carimbo = new Date().toISOString().slice(0, 10);
    baixarJson(`plano-viral-${carimbo}.json`, st.exportar());
    avisar('Arquivo gerado. Mande para quem precisa ver as mudanças.');
  });

  const arquivo = alvo.querySelector('#b-arquivo');
  alvo.querySelector('#b-importar').addEventListener('click', () => arquivo.click());
  arquivo.addEventListener('change', () => {
    const f = arquivo.files[0];
    if (!f) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        st.importar(JSON.parse(leitor.result));
        avisar('Plano importado.');
      } catch (err) {
        avisar('Não deu para importar: ' + err.message, true);
      }
      arquivo.value = '';
    };
    leitor.readAsText(f);
  });

  const zerar = alvo.querySelector('#b-zerar');
  zerar.addEventListener('click', () => {
    if (!zerar.dataset.confirmar) {
      zerar.dataset.confirmar = '1';
      zerar.textContent = 'Clique de novo para apagar';
      return;
    }
    st.zerar();
    avisar('Dados deste navegador apagados.');
  });
}
