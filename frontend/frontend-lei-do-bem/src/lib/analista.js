// Dados do analista que decide e assina o parecer. O app não tem login: ficam guardados neste navegador.

export const CHAVE_ANALISTA = 'ldb:analista:v1'

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

export function normalizarAnalista(dados) {
  if (!dados || typeof dados !== 'object') return null
  const nome = texto(dados.nome)
  return nome ? { nome } : null
}

export function carregarAnalista() {
  try {
    const bruto = localStorage.getItem(CHAVE_ANALISTA)
    return bruto ? normalizarAnalista(JSON.parse(bruto)) : null
  } catch {
    return null
  }
}

// Devolve false quando o navegador recusa a gravação.
export function salvarAnalista(analista) {
  try {
    localStorage.setItem(CHAVE_ANALISTA, JSON.stringify(analista))
    return true
  } catch {
    return false
  }
}

export function descreverAnalista(analista) {
  return analista?.nome ?? ''
}
