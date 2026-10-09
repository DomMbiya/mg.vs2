// Resultados simulados para ensaiar a apresentação sem backend.
// Seguem o mesmo formato que o backend devolve.

function hash(texto) {
  let h = 0
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

const crit = (estado, justificativa, fonte) => ({ estado, justificativa, fonte })

const MODELOS = [
  {
    classe: 'Elegível',
    justificativa:
      'O registro técnico descreve hipóteses testadas em ensaios sucessivos e as medições confirmam o comportamento relatado. O método e a revisão permitem repetir o experimento.',
    criterios: (id) => ({
      criterio_novidade: crit('DEMONSTRADA NO RECORTE', 'O dossiê delimita o que não existia antes no escopo do projeto.', `dossie_projeto.pdf#${id}-EV01`),
      criterio_criatividade: crit('DEMONSTRADA NO RECORTE', 'A solução combina abordagens de forma não óbvia, registrada no método.', `evidencias/metodo.md#${id}-EV04`),
      criterio_incerteza: crit('INVESTIGADA', 'Os ensaios S01 a S04 registram resultados divergentes antes da configuração final.', `evidencias/medicoes.csv#${id}-S02`),
      criterio_sistematicidade: crit('DOCUMENTADA', 'Cronologia e atividades mostram planejamento e registro contínuos.', `evidencias/cronologia.md#${id}-EV06`),
      criterio_transferibilidade: crit('DOCUMENTADA NO ESCOPO', 'Configuração e método descrevem como reproduzir o resultado.', `evidencias/configuracao.md#${id}-EV05`),
    }),
    evidencias: (id) => [
      { id: `${id}-EV01`, referencia: `dossie_projeto.pdf#${id}-EV01`, criterio: 'Novidade', forca: 'forte', justificativa: 'Descreve o estado anterior e a lacuna técnica com clareza.' },
      { id: `${id}-S02`, referencia: `evidencias/medicoes.csv#${id}-S02`, criterio: 'Incerteza', forca: 'forte', justificativa: 'Medição contradiz a hipótese inicial e motiva novo ensaio.' },
      { id: `${id}-EV06`, referencia: `evidencias/cronologia.md#${id}-EV06`, criterio: 'Sistematicidade', forca: 'forte', justificativa: 'Datas e responsáveis registrados em cada etapa.' },
    ],
    contrarias: () => [],
    lacunas: [],
    solicitar: [],
  },
  {
    classe: 'Com ressalvas',
    justificativa:
      'O núcleo experimental está sustentado pelas medições, mas a transferência só está documentada para uma configuração específica.',
    limite: 'Conclusão válida apenas para o módulo de calibração. A integração com o sistema legado não tem ensaio registrado.',
    criterios: (id) => ({
      criterio_novidade: crit('DEMONSTRADA NO RECORTE', 'Novidade restrita ao módulo de calibração.', `dossie_projeto.pdf#${id}-EV01`),
      criterio_criatividade: crit('DEMONSTRADA NO RECORTE', 'Abordagem própria descrita no método.', `evidencias/metodo.md#${id}-EV03`),
      criterio_incerteza: crit('INVESTIGADA', 'Ensaios mostram variação não prevista entre lotes.', `evidencias/medicoes.csv#${id}-S03`),
      criterio_sistematicidade: crit('PARCIAL', 'Há registro dos ensaios, mas não das decisões entre eles.', `atividades.xlsx#${id}-EV07`),
      criterio_transferibilidade: crit('DOCUMENTADA PARA A CONFIGURAÇÃO', 'Reprodução descrita só para o equipamento de bancada.', `evidencias/configuracao.md#${id}-EV05`),
    }),
    evidencias: (id) => [
      { id: `${id}-S03`, referencia: `evidencias/medicoes.csv#${id}-S03`, criterio: 'Incerteza', forca: 'forte', justificativa: 'Variação entre lotes registrada com valores.' },
      { id: `${id}-EV07`, referencia: `atividades.xlsx#${id}-EV07`, criterio: 'Sistematicidade', forca: 'fraca', justificativa: 'Atividades listadas sem vínculo com os ensaios.' },
    ],
    contrarias: (id) => [
      { id: `${id}-EV09`, referencia: `evidencias/revisao.md#${id}-EV09`, criterio: 'Transferibilidade', forca: 'forte', justificativa: 'A revisão aponta que a integração não foi testada.' },
    ],
    divergencia: 'Na entrevista, a equipe afirma que a integração foi validada; a revisão técnica registra que ela não foi ensaiada.',
    lacunas: ['Ensaio da integração com o sistema legado'],
    solicitar: [],
  },
  {
    classe: 'Não elegível',
    justificativa:
      'As atividades descritas aplicam técnica conhecida sem incerteza técnica investigada. As medições confirmam o resultado esperado desde o primeiro ensaio.',
    criterios: (id) => ({
      criterio_novidade: crit('NÃO DEMONSTRADA', 'Solução equivalente a prática de mercado citada no próprio dossiê.', `dossie_projeto.pdf#${id}-EV02`),
      criterio_criatividade: crit('NÃO DEMONSTRADA', 'Não há escolha técnica além da configuração padrão.', `evidencias/metodo.md#${id}-EV03`),
      criterio_incerteza: crit('NÃO CARACTERIZADA', 'Nenhum ensaio registra resultado inesperado.', `evidencias/resultados.csv#${id}-S01`),
      criterio_sistematicidade: crit('DOCUMENTADA COMO ACEITE', 'Os registros descrevem testes de aceite, não investigação.', `evidencias/revisao.md#${id}-EV08`),
      criterio_transferibilidade: crit('DOCUMENTADA NO ESCOPO', 'Instalação replicável conforme manual.', `evidencias/configuracao.md#${id}-EV05`),
    }),
    evidencias: (id) => [
      { id: `${id}-EV02`, referencia: `dossie_projeto.pdf#${id}-EV02`, criterio: 'Novidade', forca: 'forte', justificativa: 'O dossiê cita o produto de mercado usado como base.' },
      { id: `${id}-EV08`, referencia: `evidencias/revisao.md#${id}-EV08`, criterio: 'Sistematicidade', forca: 'forte', justificativa: 'Testes descritos como aceite de fornecedor.' },
    ],
    contrarias: (id) => [
      { id: `${id}-EV10`, referencia: `transcricao_entrevista_tecnica.pdf#${id}-EV10`, criterio: 'Incerteza', forca: 'fraca', justificativa: 'Entrevista menciona dificuldades, sem registro documental.' },
    ],
    divergencia: 'A entrevista descreve obstáculos técnicos que não aparecem em nenhum ensaio registrado.',
    lacunas: [],
    solicitar: [],
  },
  {
    classe: 'Evidência insuficiente',
    justificativa:
      'O dossiê alega incerteza técnica, mas não há medição que permita verificar a alegação. O elo entre hipótese e resultado está ausente.',
    criterios: (id) => ({
      criterio_novidade: crit('INDETERMINADA', 'O dossiê não delimita o estado anterior.', `dossie_projeto.pdf#${id}-EV01`),
      criterio_criatividade: crit('INDETERMINADA', 'Método descrito de forma genérica.', `evidencias/metodo.md#${id}-EV03`),
      criterio_incerteza: crit('ALEGADA, NÃO VERIFICÁVEL', 'Alegação sem ensaio correspondente em medicoes.csv.', `dossie_projeto.pdf#${id}-EV02`),
      criterio_sistematicidade: crit('PARCIAL', 'Cronologia com intervalos sem registro.', `evidencias/cronologia.md#${id}-EV06`),
      criterio_transferibilidade: crit('INSUFICIENTE PARA O NÚCLEO ALEGADO', 'Configuração não cobre o componente central.', `evidencias/configuracao.md#${id}-EV05`),
    }),
    evidencias: (id) => [
      { id: `${id}-EV02`, referencia: `dossie_projeto.pdf#${id}-EV02`, criterio: 'Incerteza', forca: 'fraca', justificativa: 'Afirmação sem dado de suporte.' },
      { id: `${id}-EV06`, referencia: `evidencias/cronologia.md#${id}-EV06`, criterio: 'Sistematicidade', forca: 'fraca', justificativa: 'Três meses sem nenhuma atividade registrada.' },
    ],
    contrarias: () => [],
    lacunas: ['Medições dos ensaios citados no dossiê', 'Registro das decisões entre março e maio'],
    solicitar: ['Planilha de medições dos ensaios S01 a S03', 'Ata ou registro das revisões técnicas do período'],
  },
]

export function gerarResultadoSimulado(id) {
  const modelo = MODELOS[hash(id) % MODELOS.length]
  return {
    projeto_id: id,
    titulo: `Projeto ${id} (dados simulados)`,
    classificacao_recomendada: modelo.classe,
    justificativa: modelo.justificativa,
    limite: modelo.limite ?? null,
    fontes_decisivas: modelo.evidencias(id).map((e) => e.referencia.split('#')[0]).join(' | '),
    divergencia_depoimento: modelo.divergencia ?? null,
    ...modelo.criterios(id),
    evidencias: modelo.evidencias(id),
    evidencias_contrarias: modelo.contrarias(id),
    lacunas: modelo.lacunas,
    evidencias_a_solicitar: modelo.solicitar,
  }
}
