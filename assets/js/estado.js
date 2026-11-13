/* ==========================================================================
   Estado do painel - unica fonte de verdade, persistida em localStorage.
   Toda alteracao passa por uma acao daqui: assim o registro de atividades
   e a gravacao no navegador acontecem sempre, sem depender da tela.
   ========================================================================== */

import {
  VERSAO_DADOS, CHAVE_ARMAZENAMENTO, TAREFAS, MATERIAIS, MARCOS, RISCOS,
  SKUS, ETAPAS_ANUNCIO, PROJETO_PADRAO, STATUS, PRIORIDADES, STATUS_PROJETO,
  STATUS_MATERIAL, SITUACOES_RISCO, CONDICOES, FASES, TRILHAS,
} from './dados-iniciais.js';
import { novoId, agoraLegivel, hojeIso, somaDias, diaParaData, difDias, pct } from './utils.js';

const USUARIO_PADRAO = 'Luciano';

/* ----------------------------- montagem inicial ----------------------------- */

function estadoNovo() {
  return {
    versao: VERSAO_DADOS,
    projeto: { ...PROJETO_PADRAO },
    tarefas: TAREFAS.map(semear),
    materiais: MATERIAIS.map((m) => ({
      ...m, status: m.statusInicial || 'pendente', observacao: m.observacao || '', atualizadoEm: '',
    })),
    marcos: MARCOS.map((p) => ({ ...p, concluido: false })),
    riscos: RISCOS.map((r) => ({ ...r, situacao: 'vigiando', observacao: '' })),
    anuncios: SKUS.map((s) => ({
      skuId: s.id,
      // o nome viaja junto com o anuncio: assim o backup se basta sozinho
      nome: s.nome,
      nicho: s.nicho,
      giro: s.giro,
      retificado: !!s.retificado,
      semCusto: !!s.semCusto,
      condicao: s.retificado ? 'retificado' : '',
      observacao: '',
      etapas: Object.fromEntries(ETAPAS_ANUNCIO.map((e) => [e.id, false])),
    })),
    registros: [],
    ui: { escopo: 'completo' },
  };
}

function semear(t) {
  return {
    ...t,
    status: t.statusInicial || 'pendente',
    dataInicioReal: '',
    dataConclusao: '',
    prazo: '',            // vazio = usa o dia planejado do cronograma
    observacoes: '',
    checklist: (t.checklist || []).map((c) => ({ ...c })),
    dependencias: [...(t.dependencias || [])],
  };
}

/** Entradas que existem no backup e NAO na semente. Sao adotadas inteiras.
 *  E o que faz o painel publicado - que sobe com a semente vazia - encher
 *  quando voce importa o JSON: sem isso, mesclar() so devolveria a semente. */
function adotar(baseLista, salvaLista, chave, preparar) {
  const conhecidos = new Set(baseLista.map((x) => x[chave]));
  return (salvaLista || [])
    .filter((x) => x && x[chave] !== undefined && x[chave] !== null && !conhecidos.has(x[chave]))
    .map(preparar);
}

function adotarTarefa(t) {
  return {
    ...t,
    status: t.status || 'pendente',
    prioridade: t.prioridade || 'media',
    dataInicioReal: t.dataInicioReal || '',
    dataConclusao: t.dataConclusao || '',
    prazo: t.prazo || '',
    observacoes: t.observacoes || '',
    checklist: Array.isArray(t.checklist) ? t.checklist.map((c) => ({ ...c })) : [],
    dependencias: Array.isArray(t.dependencias) ? [...t.dependencias] : [],
  };
}

function adotarMaterial(m) {
  return { ...m, status: m.status || m.statusInicial || 'pendente', observacao: m.observacao || '', atualizadoEm: m.atualizadoEm || '' };
}

function adotarMarco(p) {
  return { ...p, concluido: !!p.concluido };
}

function adotarRisco(r) {
  return { ...r, situacao: r.situacao || 'vigiando', observacao: r.observacao || '' };
}

function adotarAnuncio(a) {
  return {
    ...a,
    condicao: a.condicao || '',
    observacao: a.observacao || '',
    etapas: { ...Object.fromEntries(ETAPAS_ANUNCIO.map((e) => [e.id, false])), ...(a.etapas || {}) },
  };
}

/** Reconcilia o que esta salvo com a semente: nunca perde dado do usuario,
 *  adota tarefas/materiais/SKUs novos que passem a existir na semente, e
 *  adota tambem os que so existem no backup. */
function mesclar(salvo) {
  const base = estadoNovo();
  if (!salvo || typeof salvo !== 'object') return base;

  const projeto = { ...base.projeto, ...(salvo.projeto || {}) };

  const porId = new Map((salvo.tarefas || []).map((t) => [t.id, t]));
  const tarefas = base.tarefas.map((padrao) => {
    const s = porId.get(padrao.id);
    if (!s) return padrao;
    return {
      ...padrao,
      status: s.status || padrao.status,
      prioridade: s.prioridade || padrao.prioridade,
      dataInicioReal: s.dataInicioReal || '',
      dataConclusao: s.dataConclusao || '',
      prazo: s.prazo || '',
      observacoes: s.observacoes || '',
      checklist: Array.isArray(s.checklist) ? s.checklist : padrao.checklist,
      dependencias: Array.isArray(s.dependencias) ? s.dependencias : padrao.dependencias,
      titulo: s.titulo || padrao.titulo,
      descricao: s.descricao !== undefined && s.descricao !== '' ? s.descricao : padrao.descricao,
      estimativaDias: s.estimativaDias ?? padrao.estimativaDias,
    };
  });

  const matPorId = new Map((salvo.materiais || []).map((m) => [m.id, m]));
  const materiais = base.materiais.map((padrao) => {
    const s = matPorId.get(padrao.id);
    return s
      ? { ...padrao, status: s.status || padrao.status, observacao: s.observacao || padrao.observacao || '', atualizadoEm: s.atualizadoEm || '' }
      : padrao;
  });

  const marcoPorId = new Map((salvo.marcos || []).map((p) => [p.id, p]));
  const marcos = base.marcos.map((padrao) => {
    const s = marcoPorId.get(padrao.id);
    return s ? { ...padrao, concluido: !!s.concluido } : padrao;
  });

  const riscoPorId = new Map((salvo.riscos || []).map((r) => [r.id, r]));
  const riscos = base.riscos.map((padrao) => {
    const s = riscoPorId.get(padrao.id);
    return s ? { ...padrao, situacao: s.situacao || 'vigiando', observacao: s.observacao || '' } : padrao;
  });

  const anPorId = new Map((salvo.anuncios || []).map((a) => [a.skuId, a]));
  const anuncios = base.anuncios.map((padrao) => {
    const s = anPorId.get(padrao.skuId);
    if (!s) return padrao;
    return {
      ...padrao,
      nome: padrao.nome || s.nome || '',
      nicho: padrao.nicho || s.nicho || '',
      giro: padrao.giro !== undefined ? padrao.giro : s.giro,
      condicao: s.condicao !== undefined ? s.condicao : padrao.condicao,
      observacao: s.observacao || '',
      // etapas novas na semente entram como false sem apagar as marcadas
      etapas: { ...padrao.etapas, ...(s.etapas || {}) },
    };
  });

  return {
    versao: VERSAO_DADOS,
    projeto,
    tarefas: tarefas.concat(adotar(base.tarefas, salvo.tarefas, 'id', adotarTarefa)),
    materiais: materiais.concat(adotar(base.materiais, salvo.materiais, 'id', adotarMaterial)),
    marcos: marcos.concat(adotar(base.marcos, salvo.marcos, 'id', adotarMarco)),
    riscos: riscos.concat(adotar(base.riscos, salvo.riscos, 'id', adotarRisco)),
    anuncios: anuncios.concat(adotar(base.anuncios, salvo.anuncios, 'skuId', adotarAnuncio)),
    registros: Array.isArray(salvo.registros) ? salvo.registros : [],
    ui: { ...base.ui, ...(salvo.ui || {}) },
  };
}

function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (!bruto) {
      const novo = estadoNovo();
      novo.registros.push(criarRegistro({
        usuario: 'Sistema', tipo: 'sistema',
        atividade: 'Painel iniciado com o plano de ação',
        observacao: novo.tarefas.length + ' atividades em 4 fases.',
        auto: true,
      }));
      return novo;
    }
    return mesclar(JSON.parse(bruto));
  } catch (e) {
    console.error('Falha ao ler os dados salvos; recomeçando do zero.', e);
    return estadoNovo();
  }
}

let estado = carregar();
const ouvintes = new Set();

let aoSalvarNaNuvem = null;
export function ligarNuvem(fn) { aoSalvarNaNuvem = fn; }

function salvar() {
  salvarLocal();
  if (aoSalvarNaNuvem) aoSalvarNaNuvem(estado);
}

function salvarLocal() {
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(estado));
  } catch (e) {
    console.error('Não foi possível salvar no navegador.', e);
  }
}

function notificar() {
  salvar();
  ouvintes.forEach((fn) => fn(estado));
}

/** Estado que chegou do banco: substitui o local e redesenha, sem mandar de volta. */
export function substituirDaNuvem(bruto) {
  estado = mesclar(bruto);
  salvarLocal();
  ouvintes.forEach((fn) => fn(estado));
}

export function obter() { return estado; }
export function assinar(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); }

/* -------------------------------- registro -------------------------------- */

function criarRegistro({ usuario, tipo, atividade, observacao = '', auto = false, data = '' }) {
  return {
    id: novoId('log'),
    quando: agoraLegivel(),
    data: data || hojeIso(),
    usuario: usuario || USUARIO_PADRAO,
    tipo,
    atividade,
    observacao,
    auto,
  };
}

function registrar(dados) {
  estado.registros.unshift(criarRegistro(dados));
  if (estado.registros.length > 500) estado.registros.length = 500;
}

export function adicionarRegistro({ data, usuario, atividade, observacao }) {
  if (!atividade || !atividade.trim()) return;
  registrar({ data, usuario, tipo: 'manual', atividade: atividade.trim(), observacao: (observacao || '').trim(), auto: false });
  notificar();
}

export function removerRegistro(id) {
  estado.registros = estado.registros.filter((r) => r.id !== id);
  notificar();
}

/* --------------------------------- tarefas --------------------------------- */

export function tarefa(id) { return estado.tarefas.find((t) => t.id === id); }

export function definirStatus(id, novoStatus) {
  const t = tarefa(id);
  if (!t || t.status === novoStatus) return;
  const anterior = t.status;
  t.status = novoStatus;

  if (novoStatus === 'andamento' && !t.dataInicioReal) t.dataInicioReal = hojeIso();
  if (novoStatus === 'concluido') {
    t.dataConclusao = t.dataConclusao || hojeIso();
  } else if (anterior === 'concluido') {
    t.dataConclusao = '';
  }

  registrar({
    tipo: novoStatus === 'concluido' ? 'conclusao' : 'status',
    usuario: t.responsavel,
    atividade: `${t.id} — ${t.titulo}: ${STATUS[anterior].rotulo} → ${STATUS[novoStatus].rotulo}`,
    auto: true,
  });

  // avisa quando a conclusao destrava outra tarefa
  if (novoStatus === 'concluido') {
    const liberadas = estado.tarefas.filter(
      (o) => o.dependencias.includes(id) && bloqueios(o).length === 0 && o.status !== 'concluido');
    if (liberadas.length) {
      registrar({
        tipo: 'desbloqueio', usuario: 'Sistema', auto: true,
        atividade: `Destravou ${liberadas.map((o) => o.id).join(', ')}`,
        observacao: liberadas.map((o) => `${o.id} — ${o.titulo}`).join(' · '),
      });
    }
    estado.marcos.forEach((p) => {
      if (p.gatilho === id && !p.concluido) {
        p.concluido = true;
        registrar({
          tipo: 'marco', usuario: 'Sistema', auto: true,
          atividade: `Ponto de encontro do D${p.dia} cumprido: ${p.titulo}`,
        });
      }
    });
  } else if (anterior === 'concluido') {
    estado.marcos.forEach((p) => {
      if (p.gatilho === id && p.concluido) p.concluido = false;
    });
  }
  notificar();
}

export function definirPrioridade(id, prioridade) {
  const t = tarefa(id);
  if (!t || t.prioridade === prioridade) return;
  const antes = t.prioridade;
  t.prioridade = prioridade;
  registrar({
    tipo: 'prioridade', usuario: t.responsavel, auto: true,
    atividade: `${t.id} — prioridade ${PRIORIDADES[antes].rotulo} → ${PRIORIDADES[prioridade].rotulo}`,
  });
  notificar();
}

export function atualizarTarefa(id, campos) {
  const t = tarefa(id);
  if (!t) return;
  const rotulos = {
    prazo: 'prazo', dataInicioReal: 'data de início', dataConclusao: 'data de conclusão',
    estimativaDias: 'estimativa', observacoes: 'observações', descricao: 'descrição',
    dependencias: 'dependências', titulo: 'nome',
  };
  Object.entries(campos).forEach(([campo, valor]) => {
    const antes = t[campo];
    const igual = Array.isArray(valor) ? JSON.stringify(antes) === JSON.stringify(valor) : antes === valor;
    if (igual) return;
    t[campo] = valor;
    if (campo === 'prazo' || campo === 'estimativaDias' || campo === 'dependencias') {
      registrar({
        tipo: campo === 'prazo' ? 'prazo' : 'edicao', usuario: t.responsavel, auto: true,
        atividade: `${t.id} — ${rotulos[campo]} alterado`,
        observacao: Array.isArray(valor) ? (valor.join(', ') || 'sem dependências') : String(valor || '—'),
      });
    }
  });
  notificar();
}

/** Cria uma atividade nova e devolve o id (V20, V21...). */
export function novaTarefa({ titulo, fase = 1, trilha = 'ambos', responsavel = '', prioridade = 'media' }) {
  const nums = estado.tarefas.map((t) => Number(String(t.id).replace(/\D/g, '')) || 0);
  const id = 'V' + (Math.max(0, ...nums) + 1);
  const f = Number(fase) || 1;
  estado.tarefas.push(adotarTarefa({
    id, titulo: (titulo || 'Nova atividade').trim(), fase: f, area: FASES[f].split(' · ')[1],
    trilha, responsavel: (responsavel || '').trim() || TRILHAS[trilha].responsavel, prioridade,
    estimativaDias: null, diaInicio: f, diaFim: f, descricao: '', checklist: [], dependencias: [],
  }));
  registrar({ tipo: 'edicao', usuario: USUARIO_PADRAO, auto: true, atividade: `${id} criada: ${titulo}` });
  notificar();
  return id;
}

export function removerTarefa(id) {
  const t = tarefa(id);
  if (!t) return;
  estado.tarefas = estado.tarefas.filter((x) => x.id !== id);
  estado.tarefas.forEach((x) => { x.dependencias = (x.dependencias || []).filter((d) => d !== id); });
  registrar({ tipo: 'edicao', usuario: USUARIO_PADRAO, auto: true, atividade: `${id} excluída: ${t.titulo}` });
  notificar();
}

/** Troca a fase e mantem area e ordenacao coerentes. */
export function definirFase(id, fase) {
  const t = tarefa(id);
  const f = Number(fase);
  if (!t || !FASES[f] || t.fase === f) return;
  t.fase = f; t.area = FASES[f].split(' · ')[1]; t.diaInicio = f; t.diaFim = f;
  registrar({ tipo: 'edicao', usuario: USUARIO_PADRAO, auto: true, atividade: `${t.id} movida para a ${FASES[f]}` });
  notificar();
}

/* -------------------------------- checklist -------------------------------- */

export function addItemChecklist(idTarefa, texto) {
  const t = tarefa(idTarefa);
  if (!t || !texto.trim()) return;
  t.checklist.push({ id: novoId('c'), texto: texto.trim(), feito: false });
  notificar();
}

export function alternarItemChecklist(idTarefa, idItem) {
  const t = tarefa(idTarefa);
  const item = t && t.checklist.find((c) => c.id === idItem);
  if (!item) return;
  item.feito = !item.feito;
  notificar();
}

export function editarItemChecklist(idTarefa, idItem, texto) {
  const t = tarefa(idTarefa);
  const item = t && t.checklist.find((c) => c.id === idItem);
  if (!item) return;
  if (!texto.trim()) return removerItemChecklist(idTarefa, idItem);
  item.texto = texto.trim();
  notificar();
}

export function removerItemChecklist(idTarefa, idItem) {
  const t = tarefa(idTarefa);
  if (!t) return;
  t.checklist = t.checklist.filter((c) => c.id !== idItem);
  notificar();
}

/* -------------------------------- materiais -------------------------------- */

export function definirStatusMaterial(id, status) {
  const m = estado.materiais.find((x) => x.id === id);
  if (!m || m.status === status) return;
  const antes = m.status;
  m.status = status;
  m.atualizadoEm = hojeIso();
  registrar({
    tipo: status === 'recebido' || status === 'validado' ? 'material-ok' : 'material',
    usuario: USUARIO_PADRAO, auto: true,
    atividade: `Pendência "${m.nome}": ${STATUS_MATERIAL[antes].rotulo} → ${STATUS_MATERIAL[status].rotulo}`,
  });
  notificar();
}

export function definirObsMaterial(id, texto) {
  const m = estado.materiais.find((x) => x.id === id);
  if (!m || m.observacao === texto) return;
  m.observacao = texto;
  notificar();
}

/* ---------------------------------- riscos ---------------------------------- */

export function definirSituacaoRisco(id, situacao) {
  const r = estado.riscos.find((x) => x.id === id);
  if (!r || r.situacao === situacao) return;
  const antes = r.situacao;
  r.situacao = situacao;
  registrar({
    tipo: 'risco', usuario: USUARIO_PADRAO, auto: true,
    atividade: `Risco ${r.id} — ${r.titulo}: ${SITUACOES_RISCO[antes].rotulo} → ${SITUACOES_RISCO[situacao].rotulo}`,
  });
  notificar();
}

export function definirObsRisco(id, texto) {
  const r = estado.riscos.find((x) => x.id === id);
  if (!r || r.observacao === texto) return;
  r.observacao = texto;
  notificar();
}

/* --------------------------------- anuncios --------------------------------- */

export function anuncio(skuId) {
  return estado.anuncios.find((a) => a.skuId === Number(skuId));
}

export function alternarEtapaAnuncio(skuId, etapa) {
  const a = anuncio(skuId);
  if (!a || !(etapa in a.etapas)) return;
  a.etapas[etapa] = !a.etapas[etapa];
  if (etapa === 'publicado') {
    registrar({
      tipo: 'anuncio', usuario: USUARIO_PADRAO, auto: true,
      atividade: `SKU ${skuId} — ${a.nome || ''}: ${a.etapas.publicado ? 'publicado' : 'despublicado'}`,
    });
  }
  notificar();
}

export function definirCondicaoSku(skuId, condicao) {
  const a = anuncio(skuId);
  if (!a || a.condicao === condicao) return;
  a.condicao = condicao;
  registrar({
    tipo: 'anuncio', usuario: USUARIO_PADRAO, auto: true,
    atividade: `SKU ${skuId} — ${a.nome || ''}: condição declarada = ${CONDICOES[condicao].rotulo}`,
  });
  notificar();
}

export function definirObsSku(skuId, texto) {
  const a = anuncio(skuId);
  if (!a || a.observacao === texto) return;
  a.observacao = texto;
  notificar();
}

/** Quantas etapas do anuncio ja estao marcadas. */
export function progressoAnuncio(a) {
  const total = Object.keys(a.etapas).length;
  const feitas = Object.values(a.etapas).filter(Boolean).length;
  return { feitas, total, percentual: pct(feitas, total) };
}

/** Os SKUs como a tela precisa - lidos do estado, nao da semente. */
export function skus() {
  return estado.anuncios.map((a) => ({
    id: a.skuId,
    nome: a.nome || `SKU ${a.skuId}`,
    nicho: a.nicho || '—',
    giro: a.giro,
    retificado: !!a.retificado,
    semCusto: !!a.semCusto,
  }));
}

export function resumoAnuncios() {
  const lista = estado.anuncios;
  const total = lista.length;
  const publicados = lista.filter((a) => a.etapas.publicado).length;
  const prontos = lista.filter((a) => Object.values(a.etapas).every(Boolean)).length;
  const iniciados = lista.filter((a) => Object.values(a.etapas).some(Boolean)).length;
  const semCondicao = lista.filter((a) => !a.condicao).length;
  const soma = lista.reduce((acc, a) => acc + progressoAnuncio(a).percentual, 0);
  return {
    total, publicados, prontos, iniciados, semCondicao,
    percentual: total ? Math.round(soma / total) : 0,
  };
}

/* ---------------------------------- marcos ---------------------------------- */

export function alternarMarco(id) {
  const p = estado.marcos.find((x) => x.id === id);
  if (!p) return;
  p.concluido = !p.concluido;
  registrar({
    tipo: 'marco', usuario: USUARIO_PADRAO, auto: true,
    atividade: `Ponto de encontro do D${p.dia} — ${p.titulo}: ${p.concluido ? 'cumprido' : 'reaberto'}`,
  });
  notificar();
}

/* --------------------------------- projeto --------------------------------- */

export function atualizarProjeto(campos) {
  const rotulos = {
    status: 'status do projeto', dataAssinatura: 'data da assinatura',
    dataInicio: 'data oficial de início', prazoContratualDias: 'prazo contratual',
    dataEntregaPrevista: 'data prevista de entrega', dataPublicacao: 'data da publicação (go-live)',
    diasExecucao: 'dias de execução planejados', diasAcompanhamento: 'dias de acompanhamento',
  };
  Object.entries(campos).forEach(([campo, valor]) => {
    if (estado.projeto[campo] === valor) return;
    estado.projeto[campo] = valor;
    const legivel = campo === 'status' ? STATUS_PROJETO[valor].rotulo : (valor || '—');
    registrar({
      tipo: campo === 'status' ? 'projeto-status' : 'projeto-data', usuario: USUARIO_PADRAO, auto: true,
      atividade: `${rotulos[campo] || campo}: ${legivel}`,
    });
  });
  notificar();
}

export function definirEscopo(escopo) {
  estado.ui.escopo = escopo;
  notificar();
}

/* -------------------------------- derivados -------------------------------- */

/** Tarefas que impedem esta de comecar (dependencias ainda nao concluidas). */
export function bloqueios(t) {
  return (t.dependencias || [])
    .map((id) => tarefa(id))
    .filter((d) => d && d.status !== 'concluido');
}

export function estaBloqueada(t) {
  return t.status !== 'concluido' && bloqueios(t).length > 0;
}

/** Tarefas que dependem desta. */
export function dependentes(id) {
  return estado.tarefas.filter((t) => (t.dependencias || []).includes(id));
}

export function tarefasDoEscopo() {
  return estado.ui.escopo === 'minha-trilha'
    ? estado.tarefas.filter((t) => t.trilha === '1' || t.trilha === 'ambos')
    : estado.tarefas;
}

/** True quando a tarefa esta na janela de implantacao (D1..D30). */
export function naImplantacao(t) {
  return t.diaFim <= estado.projeto.diasExecucao;
}

export function contagens(lista) {
  const base = { pendente: 0, andamento: 0, revisao: 0, concluido: 0 };
  lista.forEach((t) => { base[t.status] += 1; });
  return {
    ...base,
    total: lista.length,
    bloqueadas: lista.filter(estaBloqueada).length,
    percentual: pct(base.concluido, lista.length),
  };
}

export function progressoPorArea(lista) {
  const mapa = new Map();
  lista.forEach((t) => {
    if (!mapa.has(t.area)) mapa.set(t.area, { area: t.area, total: 0, concluidas: 0 });
    const a = mapa.get(t.area);
    a.total += 1;
    if (t.status === 'concluido') a.concluidas += 1;
  });
  return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
}

/** Progresso considerando o andamento parcial: em revisao vale 0,75; andamento 0,4. */
export function progressoPonderado(lista) {
  if (!lista.length) return 0;
  const peso = { pendente: 0, andamento: 0.4, revisao: 0.75, concluido: 1 };
  const soma = lista.reduce((acc, t) => acc + peso[t.status], 0);
  return Math.round((soma / lista.length) * 100);
}

/** Progresso de uma tarefa: checklist quando existe, senao o proprio status. */
export function progressoTarefa(t) {
  if (t.status === 'concluido') return 100;
  if (t.checklist && t.checklist.length) {
    return pct(t.checklist.filter((c) => c.feito).length, t.checklist.length);
  }
  return { pendente: 0, andamento: 40, revisao: 75 }[t.status] || 0;
}

/** Prazo efetivo: o manual quando existe, senao a data do dia planejado. */
export function prazoDaTarefa(t) {
  if (t.prazo) return t.prazo;
  return diaParaData(estado.projeto.dataInicio, t.diaFim);
}

export function dataEntregaPrevista() {
  const p = estado.projeto;
  if (p.dataEntregaPrevista) return p.dataEntregaPrevista;
  if (!p.dataInicio) return '';
  return somaDias(p.dataInicio, p.prazoContratualDias - 1);
}

/** Fim da janela de acompanhamento e da garantia: 60 dias da publicacao. */
export function fimDoAcompanhamento() {
  const p = estado.projeto;
  if (!p.dataPublicacao) return '';
  return somaDias(p.dataPublicacao, p.diasAcompanhamento);
}

/** Dias corridos entre hoje e a entrega prevista. Null enquanto nao ha inicio. */
export function diasRestantes() {
  const entrega = dataEntregaPrevista();
  if (!entrega) return null;
  return difDias(hojeIso(), entrega);
}

/** Dias que faltam para fechar a garantia de 60 dias. Null antes do go-live. */
export function diasDeGarantia() {
  const fim = fimDoAcompanhamento();
  if (!fim) return null;
  return difDias(hojeIso(), fim);
}

/** Numero do dia do plano em que estamos hoje (D1..). Null antes do inicio. */
export function diaAtual() {
  const p = estado.projeto;
  if (!p.dataInicio) return null;
  const d = difDias(p.dataInicio, hojeIso());
  return d === null ? null : d + 1;
}

/* ------------------------- exportar / importar / zerar ------------------------- */

export function exportar() {
  return {
    aplicacao: 'Plano de Ação — Viral Móveis',
    exportadoEm: new Date().toISOString(),
    versao: VERSAO_DADOS,
    dados: estado,
  };
}

export function importar(objeto) {
  const bruto = objeto && objeto.dados ? objeto.dados : objeto;
  if (!bruto || !Array.isArray(bruto.tarefas)) {
    throw new Error('Arquivo inválido: não parece um backup deste painel.');
  }
  estado = mesclar(bruto);
  registrar({
    tipo: 'sistema', usuario: USUARIO_PADRAO, auto: true,
    atividade: 'Backup importado',
    observacao: `${estado.tarefas.length} atividades, ${estado.materiais.length} pendências, ${estado.registros.length} registros.`,
  });
  notificar();
}

export function zerar() {
  estado = estadoNovo();
  registrar({ tipo: 'sistema', usuario: USUARIO_PADRAO, auto: true, atividade: 'Painel restaurado aos dados iniciais' });
  notificar();
}
