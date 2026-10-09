// Projetos inseridos (com os arquivos) guardados no IndexedDB do navegador.
// O localStorage não comporta PDFs e planilhas; o IndexedDB guarda os File inteiros.

const BANCO = 'ldb'
const VERSAO = 1
const LOJA = 'projetos'

// Uma conexão só: as gravações seguem na ordem em que foram pedidas.
let conexao = null
function abrir() {
  conexao ??= new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('IndexedDB indisponível')); return }
    const req = indexedDB.open(BANCO, VERSAO)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(LOJA)) req.result.createObjectStore(LOJA, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  conexao.catch(() => { conexao = null })
  return conexao
}

// Só o que precisa sobreviver ao F5; a seleção e o "em análise" são da sessão.
function paraGuardar(p) {
  return {
    id: p.id,
    arquivos: p.arquivos.map(({ relativo, file, tamanho }) => ({ relativo, file, tamanho })),
    status: p.status === 'analise' ? 'fila' : p.status,
    novaVersao: Boolean(p.novaVersao),
    entradaId: p.entradaId ?? null,
    erro: p.erro ?? null,
    inseridoEm: p.inseridoEm,
  }
}

export async function carregarProjetos() {
  try {
    const db = await abrir()
    return await new Promise((resolve, reject) => {
      const req = db.transaction(LOJA, 'readonly').objectStore(LOJA).getAll()
      req.onsuccess = () => resolve((req.result ?? [])
        .filter((p) => p && typeof p.id === 'string' && Array.isArray(p.arquivos))
        .map((p) => ({ ...p, selecionado: false })))
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

// Substitui o conteúdo guardado pela lista atual. Devolve false se o navegador recusar.
export async function salvarProjetos(projetos) {
  try {
    const db = await abrir()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(LOJA, 'readwrite')
      const loja = tx.objectStore(LOJA)
      loja.clear()
      for (const p of projetos) loja.put(paraGuardar(p))
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    return true
  } catch {
    return false
  }
}
