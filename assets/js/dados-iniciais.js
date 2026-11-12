/* ==========================================================================
   Dados iniciais do painel - Viral Moveis (plano de acao de 12/11/2026)

   Fonte: o plano de acao combinado com o Lucas na reuniao de 12/11/2026
   (Desktop/Viral Moveis/Plano de acao - Lucas 12-11.md). Nada inventado:
   responsavel so onde ficou claro; prazo em branco ate voces definirem.

   ESTE ARQUIVO NAO VAI PARA O GITHUB. O site publicado sobe vazio e o plano
   entra por Projeto -> Importar dados (viral-plano-para-importar.json).
   ========================================================================== */

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

const ck = (...itens) => itens.map((texto, i) => ({ id: 'c' + (i + 1), texto, feito: false }));

const t = (id, fase, trilha, responsavel, prioridade, titulo, descricao, checklist = [], dependencias = []) => ({
  id, fase, area: FASES[fase].split(' · ')[1], trilha, responsavel, prioridade,
  estimativaDias: null, diaInicio: fase, diaFim: fase, dependencias, titulo, descricao, checklist,
});

export const TAREFAS = [
  /* ---------------- FASE 1 - SISTEMA DE ATENDIMENTO (frente principal) ---------------- */
  t('V1', 1, '1', 'Luciano', 'critica', 'Chamar todo lead do formulário que não chamou no WhatsApp',
    'Objetivo principal do projeto. Todo lead que preenche o formulário nativo e não chama no WhatsApp tem que ser chamado. A fila entrega o lead com a mensagem pronta em um clique, seguindo os processos do ClickUp. WhatsApp manual por enquanto, com a mensagem pronta e editável. O protótipo da fila já existe; falta ligar nos leads reais.',
    ck('Receber os acessos (Make, ClickUp e planilha)', 'Ligar a fila nos leads reais do formulário', 'Colocar os scripts atualizados do Artur', 'Testar com os leads do dia')),
  t('V20', 1, 'ambos', 'Luciano + Viral', 'critica', 'Decidir como o contato do lead chega ao sistema',
    'Pegar o contato do lead que preenche a jornada de compra. Dois caminhos: (A) conectar os acessos no notebook que está com o Luciano (Diagnóstico Viral); ou (B) integrar o Trizup com o próprio formulário, que já tem integração no sistema.',
    ck('Testar o caminho A: acessos no notebook', 'Testar o caminho B: Trizup com o formulário', 'Escolher um e desligar o outro')),
  t('V21', 1, 'ambos', 'Luciano + Viral', 'alta', 'Levantar os processos de atendimento documentados no ClickUp',
    'O contato com o lead segue os processos que já estão no ClickUp, com todos os detalhes. Ler tudo e transformar em regra do sistema.',
    ck('Receber acesso aos processos', 'Listar cada etapa e cada mensagem', 'Marcar o que muda no sistema')),
  t('V22', 1, '1', 'Luciano', 'alta', 'Triagem automática dos leads',
    'A triagem precisa ser automática. Pelo manual, o perfil é loja de móveis a partir de R$ 80 mil por mês, com uma loja por cidade. Quem não tem verba para a agência vai para a oferta de treinamento (V26).',
    ck('Definir os critérios com o time (faturamento, cidade livre, decisor)', 'Classificar sozinho na entrada do lead', 'Mandar o lead sem verba para a oferta de treinamento'),
    ['V20']),
  t('V23', 1, '1', 'Luciano', 'alta', 'Cadência de follow-up dentro do sistema',
    'A cadência fica dentro do sistema: quem falar com quem, em que dia e com qual mensagem. Base: a cadência D1 a D7 do manual e a recuperação D8 a D15.',
    ck('Montar as etapas e os dias', 'Mensagem pronta para cada etapa', 'Alerta de lead parado há mais de 24 h'),
    ['V21']),
  t('V24', 1, 'ambos', 'Luciano + Viral', 'media', 'Modelar o CRM de mensagens e atendimento (referência: Káptia)',
    'Sugestão: usar o Káptia como modelo de CRM para o fluxo de mensagens e atendimento, com funções para atender os leads que vêm do SDR. Confirmar o nome da ferramenta e ver por dentro antes de modelar.',
    ck('Confirmar o nome e conseguir acesso ou demonstração', 'Listar as funções que valem copiar', 'Desenhar o fluxo do lead que vem do SDR')),
  t('V25', 1, 'ambos', 'Luciano + Viral', 'alta', 'Separar a base de leads: quem já comprou e quem não comprou',
    'Planejar o uso dos leads da base de dados. Primeiro separar quem já comprou de quem não comprou, depois definir a abordagem de cada grupo.',
    ck('Exportar a base', 'Separar comprou e não comprou', 'Definir a abordagem de cada grupo')),
  t('V4', 1, 'ambos', 'Luciano + Viral', 'alta', 'Levantar e chamar os leads parados desde que o SDR saiu',
    'Lista priorizada de quem entrou e ninguém tocou, com mensagem pronta para cada lead.',
    ck('Exportar a planilha de backup', 'Separar quem não teve contato', 'Chamar pela fila com mensagem pronta'),
    ['V1']),
  t('V2', 1, '2', 'Viral', 'media', 'Começar o lançamento diário no painel do comercial',
    'Usar o painel do comercial do sistema de gestão: contatos, ligações, reuniões agendadas, realizadas e no-show, com observação. Ver se dá para puxar automático os leads que chegam do anúncio, para o SDR só completar.',
    ck('Definir quem lança enquanto não há SDR', 'Lançar todo dia às 18h30', 'Ver se os leads do anúncio entram sozinhos')),
  t('V3', 1, 'ambos', 'Luciano + Viral', 'media', 'Metas na tela: linha diária e distância para a meta do mês',
    'Meta de 20% de agendamento sobre lead qualificado. A linha diária mostra quanto falta para a meta.',
    ck('Confirmar o que conta como lead qualificado', 'Colocar a meta mensal no painel')),
  t('V16', 1, 'ambos', 'Luciano + Viral', 'baixa', 'Abordar quem curtiu ou comentou nos vídeos',
    'Chamar quem curtiu, comentou ou interagiu com os vídeos. Entra quando a produção de vídeos e conteúdos estiver alinhada. Precisa estudar a API do Instagram.'),
  t('V17', 1, 'ambos', 'Luciano + Viral', 'baixa', 'Formulário externo para recuperar quem não enviou',
    'Recuperar quem começou a preencher e saiu, quando a operação estiver rodando liso e a equipe pedir mais demanda.',
    [], ['V1']),
  t('V19', 1, 'ambos', 'Luciano + Viral', 'baixa', 'API oficial do WhatsApp e agente de qualificação',
    'Depois que a fila manual estiver rodando.', [], ['V1']),

  /* ---------------- FASE 2 - OFERTAS E ESTEIRA DE PRODUTOS ---------------- */
  t('V26', 2, 'ambos', 'Luciano + Viral', 'alta', 'Oferta de treinamento para o lead sem dinheiro',
    'Um processo gravado e replicável, com valor médio de R$ 2.500, podendo ser parcelado. É a porta de entrada: o lojista que não tem verba para a agência percebe o valor do trabalho e sobe depois.',
    ck('Definir o que o treinamento ensina', 'Gravar o processo', 'Fechar preço e parcelamento', 'Definir onde e como vende', 'Script da oferta para quem atende o lead')),
  t('V27', 2, 'ambos', 'Luciano + Viral', 'media', 'Planejar a esteira completa de produtos',
    'A partir do treinamento, formar a esteira para reaproveitar o lead: scripts de atendimento, a mesma linha de treinamentos gravados, comunidade e upsell de produtos.',
    ck('Scripts de atendimento', 'Linha de treinamentos gravados', 'Ideias de comunidade', 'Upsell de produtos', 'Caminho do lead de um produto para o outro'),
    ['V26']),
  t('V18', 2, 'ambos', 'Luciano + Viral', 'baixa', 'Vender o sistema por licença para outras agências',
    'O portal e a gestão como produto para outras agências, com tudo integrado.'),

  /* ---------------- FASE 3 - SISTEMA DO CLIENTE ---------------- */
  t('V29', 3, 'ambos', 'Luciano + Viral', 'alta', 'Tela única de conversas: WhatsApp, DM do Instagram e Messenger',
    'No sistema do cliente, uma tela que centraliza as conversas, no estilo de um chat, para ter tudo num lugar e as fotos sempre à mão.',
    ck('Definir os canais da primeira versão', 'Ver o que o Trizup já entrega', 'Desenhar a tela', 'Garantir que as fotos ficam guardadas')),
  t('V30', 3, 'ambos', 'Luciano + Viral', 'media', 'Dashboard do cliente junto da tela de conversas',
    'O painel do dono da loja ao lado das conversas: contatos, negociações e vendas.',
    [], ['V29']),
  t('V31', 3, 'ambos', 'Luciano + Viral', 'alta', 'Centralizar tudo no app.viralcompany',
    'Atendimento, sistema do cliente e gestão no mesmo endereço, em vez de ferramentas soltas.',
    ck('Receber acesso ao app.viralcompany', 'Listar o que hoje está fora dele', 'Definir a ordem de entrada')),
  t('V12', 3, 'ambos', 'Luciano + Viral', 'media', 'Revisar o portal do cliente',
    'O dono da loja vê tudo num lugar só (Drive, planilhas, criativos do Canva, dados de acesso), além do painel com contatos, negociações, vendas, faturamento, Instagram e campanhas, no geral ou por unidade.'),
  t('V13', 3, 'ambos', 'Luciano + Viral', 'media', 'Aviso na hora quando o WhatsApp do cliente desconecta',
    'Quando o WhatsApp da loja desconecta, o cliente precisa ser avisado na hora, com o link para reconectar. Combinar quem recebe esse aviso.',
    ck('Definir quem recebe o aviso', 'Mandar o link de reconexão')),
  t('V14', 3, '2', 'Lívia', 'media', 'Cobrar o uso dos gatilhos toda segunda',
    'Loja que não usa os gatilhos não aparece com venda no painel. Toda segunda a Lívia fala com as lojas sobre a semana anterior e cobra o uso. O ajuste manual fica para exceção.'),
  t('V15', 3, 'ambos', 'Luciano + Viral', 'baixa', 'Google Meu Negócio no portal',
    'Ver como entra no portal, já que o time já cuida disso para os clientes.'),

  /* ---------------- FASE 4 - OPERACAO INTERNA E CEREBRO (secundaria) ---------------- */
  t('V32', 4, 'ambos', 'Luciano + Viral', 'media', 'Mapear os processos da Viral e achar o que dá para automatizar',
    'Verificar os processos da Viral e ver onde automatizar para poupar o tempo dos colaboradores.',
    ck('Listar os processos de cada área', 'Medir o que mais toma tempo', 'Escolher os três primeiros para automatizar')),
  t('V33', 4, '1', 'Luciano', 'baixa', 'Construir um cérebro para o Lucas',
    'Frente secundária: um segundo cérebro para o Lucas, com o contexto, os processos e as decisões da Viral.'),
  t('V5', 4, '2', 'Lucas', 'media', 'Ligações de satisfação na terceira semana do mês',
    '15 minutos no WhatsApp, nota de 0 a 10, o que funciona e o que dá para melhorar. Registrar a nota e as observações no sistema para acompanhar a saúde de cada cliente.',
    ck('Fechar a lista de clientes do mês', 'Registrar nota e observação de cada ligação')),
  t('V6', 4, '2', 'Lucas', 'media', 'Debrief de cada cancelamento',
    'Dos 6 do mês passado, 4 foram para concorrente ou internalizaram o time e 2 estavam no nosso controle. Escrever o que dava para ter feito diferente nesses 2 e virar processo.',
    ck('Debrief dos 2 que estavam no nosso controle', 'Transformar em processo')),
  t('V7', 4, '2', 'Viral', 'baixa', 'Aniversários dos clientes e inauguração das lojas',
    'Para as ações com as lojas. Linha do tempo de marcos por cliente (site novo, aumento de faturamento) para usar com o próprio cliente.'),
  t('V8', 4, '2', 'Viral', 'baixa', 'Escopo de cada cliente no sistema',
    'O que cada um contratou, inclusive os planos personalizados e quem tem site no pacote.'),
  t('V9', 4, '2', 'Viral', 'baixa', 'Base de conhecimento com vídeos das plataformas',
    'Subir os vídeos ensinando a mexer nas plataformas. Quem entra no time vê tudo ali e já chega sabendo.'),
  t('V10', 4, '2', 'Lucas', 'baixa', 'Gestão de custos da empresa',
    'Onde está indo mais dinheiro e a evolução das despesas.'),
  t('V11', 4, 'ambos', 'Luciano + Viral', 'baixa', 'Painel da equipe na TV do escritório',
    'Time acompanhando as metas, para criar a cultura.'),
];

// o que ja estava em andamento em 12/11
['V1', 'V5'].forEach((id) => { const x = TAREFAS.find((a) => a.id === id); if (x) x.statusInicial = 'andamento'; });

/* --------------------------------------------------------------------------
   O que precisa vir do time da Viral para o plano andar.
   -------------------------------------------------------------------------- */
export const MATERIAIS = [
  { id: 'M1', nome: 'Acesso ao Make', nota: 'Onde o lead do formulário é distribuído.', critico: true, bloqueia: ['V1', 'V20'] },
  { id: 'M2', nome: 'Acesso ao ClickUp, com os processos de atendimento', nota: 'Centro da operação. Os processos documentados lá são a base do sistema.', critico: true, bloqueia: ['V1', 'V21', 'V23'] },
  { id: 'M3', nome: 'Planilha de backup dos leads', nota: 'Para ligar a fila e levantar os leads parados.', critico: true, bloqueia: ['V1', 'V4'] },
  { id: 'M4', nome: 'Acesso ao sistema de gestão e ao portal', nota: 'Painel do comercial, carteira e portal do cliente.', critico: false, bloqueia: ['V2', 'V3', 'V12'] },
  { id: 'M5', nome: 'Acesso ao WhatsApp Business', nota: 'Respostas rápidas e o número que a fila usa.', critico: false, bloqueia: ['V1'] },
  { id: 'M6', nome: 'Scripts atualizados do Artur', nota: 'Primeiro contato, ligação e follow-up.', critico: true, bloqueia: ['V1', 'V23'] },
  { id: 'M7', nome: 'Números do comercial', nota: 'Leads por mês, quantos qualificados, quantos agendam e custo por lead.', critico: false, bloqueia: ['V3', 'V22'] },
  { id: 'M8', nome: 'Horário da confirmação de D-1', nota: 'No manual está 21h, na rotina 18h20. Qual vale?', critico: false, bloqueia: ['V23'] },
  { id: 'M9', nome: 'Acesso ao Trizup', nota: 'Ferramenta que lê o WhatsApp. Precisa para testar a integração com o formulário.', critico: true, bloqueia: ['V20', 'V29'] },
  { id: 'M10', nome: 'Acesso ao app.viralcompany', nota: 'Onde tudo vai ser centralizado.', critico: false, bloqueia: ['V31', 'V29'] },
  { id: 'M11', nome: 'Base de leads antiga', nota: 'Com a marca de quem já comprou e quem não comprou, se existir.', critico: false, bloqueia: ['V25'] },
  { id: 'M12', nome: 'Acesso ou demonstração do Káptia', nota: 'Referência de CRM de mensagens. Confirmar o nome da ferramenta.', critico: false, bloqueia: ['V24'] },
];

export const MARCOS = [];
export const RISCOS = [];
export const SKUS = [];

/* Etapas de construcao - nao usadas neste painel. */
export const ETAPAS_ANUNCIO = [
];

export const PROJETO_PADRAO = {
  nome: 'Plano de ação',
  cliente: '',
  contato: '',
  status: 'planejamento',
  dataReuniao: '',
  dataAssinatura: '',
  dataInicio: '',
  dataPublicacao: '',
  prazoContratualDias: 30,
  diasExecucao: 30,
  diasAcompanhamento: 60,
  dataEntregaPrevista: '',
  valorImplantacao: '',
};
