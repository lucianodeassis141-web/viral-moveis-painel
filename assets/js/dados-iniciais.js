/* Dados iniciais - VERSAO PUBLICADA. Gerado por publicar.py, nao edite.
   Sobe vazio de proposito: o plano entra por Projeto -> Importar dados
   e fica so no navegador de quem importou. */

export const VERSAO_DADOS = 1;
export const CHAVE_ARMAZENAMENTO = 'viral-painel-plano';

export const STATUS = {
  pendente:  { rotulo: 'Pendente',     curto: 'PENDENTE'  },
  andamento: { rotulo: 'Em andamento', curto: 'ANDAMENTO' },
  revisao:   { rotulo: 'Em revisão',   curto: 'REVISÃO'   },
  concluido: { rotulo: 'Concluído',    curto: 'CONCLUÍDO' },
};
export const ORDEM_STATUS = ['pendente', 'andamento', 'revisao', 'concluido'];

export const PRIORIDADES = {
  baixa:   { rotulo: 'Baixa',   peso: 1 },
  media:   { rotulo: 'Média',   peso: 2 },
  alta:    { rotulo: 'Alta',    peso: 3 },
  critica: { rotulo: 'Crítica', peso: 4 },
};
export const ORDEM_PRIORIDADES = ['critica', 'alta', 'media', 'baixa'];

export const STATUS_PROJETO = {
  'planejamento':   { rotulo: 'Planejamento'   },
  'em-execucao':    { rotulo: 'Em execução'    },
  'em-revisao':     { rotulo: 'Em revisão'     },
  'acompanhamento': { rotulo: 'Acompanhamento' },
  'concluido':      { rotulo: 'Concluído'      },
};

export const STATUS_MATERIAL = {
  pendente:   { rotulo: 'Pendente'   },
  solicitado: { rotulo: 'Solicitado' },
  recebido:   { rotulo: 'Recebido'   },
  validado:   { rotulo: 'Validado'   },
};
export const ORDEM_STATUS_MATERIAL = ['pendente', 'solicitado', 'recebido', 'validado'];

export const TRILHAS = {
  '1':     { rotulo: 'Luciano',                 curto: 'LUCIANO', responsavel: 'Luciano' },
  '2':     { rotulo: 'Time Viral',              curto: 'VIRAL',   responsavel: 'Viral'   },
  'ambos': { rotulo: 'Luciano e time juntos',   curto: 'JUNTOS',  responsavel: 'Luciano + Viral' },
};

export const FASES = {
  1: 'Fase 1 · Sistema de atendimento',
  2: 'Fase 2 · Ofertas e esteira',
  3: 'Fase 3 · Sistema do cliente',
  4: 'Fase 4 · Operação interna e cérebro',
};

export const SITUACOES_RISCO = {
  vigiando:     { rotulo: 'Vigiando'     },
  materializou: { rotulo: 'Materializou' },
  neutralizado: { rotulo: 'Neutralizado' },
};
export const ORDEM_SITUACAO_RISCO = ['vigiando', 'materializou', 'neutralizado'];

export const CONDICOES = { '': { rotulo: 'A definir' } };

export const TAREFAS = [];
export const MATERIAIS = [];
export const MARCOS = [];
export const RISCOS = [];
export const SKUS = [];
export const ETAPAS_ANUNCIO = [];

export const PROJETO_PADRAO = {
  nome: '', cliente: '', contato: '', status: 'planejamento', dataReuniao: '',
  dataAssinatura: '', dataInicio: '', dataPublicacao: '', prazoContratualDias: 30,
  diasExecucao: 30, diasAcompanhamento: 60, dataEntregaPrevista: '', valorImplantacao: '',
};
