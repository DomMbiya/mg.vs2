// Leitura de pastas arrastadas ou escolhidas e agrupamento por projeto (PRJxx).

const IGNORAR = new Set(['.ds_store', 'thumbs.db', 'desktop.ini'])
const PADRAO_PROJETO = /^PRJ\d+/i

function lerArquivo(entry) {
  return new Promise((resolve, reject) => entry.file(resolve, reject))
}

function lerLote(reader) {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject))
}

async function percorrer(entry, prefixo, saida) {
  if (entry.isFile) {
    const file = await lerArquivo(entry)
    saida.push({ caminho: prefixo + entry.name, file })
  } else if (entry.isDirectory) {
    const reader = entry.createReader()
    let lote
    do {
      lote = await lerLote(reader)
      for (const filho of lote) await percorrer(filho, `${prefixo}${entry.name}/`, saida)
    } while (lote.length > 0)
  }
}

export async function lerSoltura(dataTransfer) {
  // As entradas precisam ser capturadas antes de qualquer await.
  const entradas = [...dataTransfer.items]
    .map((item) => (item.webkitGetAsEntry ? item.webkitGetAsEntry() : null))
    .filter(Boolean)
  const arquivos = []
  for (const entrada of entradas) await percorrer(entrada, '', arquivos)
  return agruparProjetos(arquivos)
}

export function lerInput(fileList) {
  const arquivos = [...fileList].map((file) => ({ caminho: file.webkitRelativePath || file.name, file }))
  return agruparProjetos(arquivos)
}

export function agruparProjetos(arquivos) {
  const mapa = new Map()
  let ignorados = 0
  for (const { caminho, file } of arquivos) {
    const partes = caminho.split('/').filter(Boolean)
    const nome = partes[partes.length - 1] || ''
    if (IGNORAR.has(nome.toLowerCase())) continue
    const idx = partes.findIndex((p) => PADRAO_PROJETO.test(p))
    if (idx === -1) { ignorados++; continue }
    const id = partes[idx].toUpperCase()
    const relativo = partes.slice(idx + 1).join('/')
    if (!relativo) continue
    if (!mapa.has(id)) mapa.set(id, { id, arquivos: [], selecionado: false })
    mapa.get(id).arquivos.push({ relativo, file, tamanho: file?.size ?? 0 })
  }
  const projetos = [...mapa.values()].sort((a, b) => a.id.localeCompare(b.id, 'pt-BR', { numeric: true }))
  return { projetos, ignorados }
}

export function tipoArquivo(nome) {
  const ext = nome.split('.').pop().toLowerCase()
  if (ext === 'pdf') return 'PDF'
  if (ext === 'csv') return 'CSV'
  if (ext === 'xlsx' || ext === 'xls') return 'Planilha'
  if (ext === 'md' || ext === 'txt') return 'Texto'
  return 'Outro'
}

export function contarTipos(arquivos) {
  const contagem = {}
  for (const a of arquivos) {
    const t = tipoArquivo(a.relativo)
    contagem[t] = (contagem[t] || 0) + 1
  }
  return contagem
}

const ARQUIVOS_EXEMPLO = [
  'dossie_projeto.pdf',
  'transcricao_entrevista_tecnica.pdf',
  'registro_tecnico.pdf',
  'atividades.xlsx',
  'atividades.csv',
  'inventario_evidencias.csv',
  'evidencias/metodo.md',
  'evidencias/configuracao.md',
  'evidencias/cronologia.md',
  'evidencias/medicoes.csv',
  'evidencias/resultados.csv',
  'evidencias/entradas.csv',
  'evidencias/observacoes.md',
  'evidencias/revisao.md',
]

export function projetosExemplo() {
  return ['PRJ21', 'PRJ22', 'PRJ23', 'PRJ24', 'PRJ25', 'PRJ26'].map((id) => ({
    id,
    selecionado: false,
    arquivos: ARQUIVOS_EXEMPLO.map((relativo) => ({ relativo, file: null, tamanho: 0 })),
  }))
}
