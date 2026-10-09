// Histórico de análises persistido no navegador. Funções puras sobre a lista,
// exceto carregar, salvar e limpar, que tocam o localStorage.

export const CHAVE_HISTORICO = 'ldb:historico:v1'
export const LIMITE_HISTORICO = 300

function entradaValida(e) {
  return e && typeof e === 'object' && typeof e.id === 'string' && typeof e.projeto_id === 'string'
    && typeof e.em === 'string' && e.resultado && typeof e.resultado === 'object'
}

function maisRecentesPrimeiro(lista) {
  return [...lista].sort((a, b) => b.em.localeCompare(a.em)).slice(0, LIMITE_HISTORICO)
}

export function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE_HISTORICO)
    if (!bruto) return []
    const dados = JSON.parse(bruto)
    return Array.isArray(dados) ? maisRecentesPrimeiro(dados.filter(entradaValida)) : []
  } catch {
    return []
  }
}

// Devolve false quando o navegador recusa a gravação (cota cheia, modo privado).
export function salvar(lista) {
  try {
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(lista))
    return true
  } catch {
    return false
  }
}

export function limpar() {
  try { localStorage.removeItem(CHAVE_HISTORICO) } catch { /* armazenamento indisponível */ }
  return []
}

export function idEntrada(jobId, projetoId) {
  return `${jobId}:${projetoId}`
}

export function novaEntrada({ resultado, jobId, modo, em = new Date().toISOString() }) {
  return {
    id: idEntrada(jobId, resultado.id),
    projeto_id: resultado.id,
    job_id: jobId,
    em,
    modo,
    recomendacao: resultado.classe ?? null,
    resultado,
    decisao: null,
    divergente: false,
  }
}

// Uma análise já registrada (mesmo job e projeto) é mantida, com a decisão que tiver.
export function adicionarAnalise(lista, entrada) {
  if (lista.some((e) => e.id === entrada.id)) return lista
  return maisRecentesPrimeiro([entrada, ...lista.filter((e) => e.id !== entrada.id)])
}

// decisao: { classe, motivo, em } ou null para desfazer.
export function registrarDecisao(lista, entradaId, decisao) {
  return lista.map((e) => {
    if (e.id !== entradaId) return e
    if (!decisao) return { ...e, decisao: null, divergente: false }
    const registrada = {
      classe: decisao.classe,
      motivo: decisao.motivo ?? '',
      em: new Date(decisao.em ?? Date.now()).toISOString(),
    }
    return { ...e, decisao: registrada, divergente: registrada.classe !== e.recomendacao }
  })
}

// Versões em ordem cronológica, numeradas a partir de 1.
export function versoesDoProjeto(lista, projetoId) {
  return lista
    .filter((e) => e.projeto_id === projetoId)
    .sort((a, b) => a.em.localeCompare(b.em))
    .map((e, i) => ({ ...e, versao: i + 1 }))
}

// Número de versão de cada entrada, para exibir na tabela do histórico.
export function numerarVersoes(lista) {
  const contagem = {}
  const numeros = {}
  for (const e of [...lista].sort((a, b) => a.em.localeCompare(b.em))) {
    contagem[e.projeto_id] = (contagem[e.projeto_id] ?? 0) + 1
    numeros[e.id] = contagem[e.projeto_id]
  }
  return numeros
}
