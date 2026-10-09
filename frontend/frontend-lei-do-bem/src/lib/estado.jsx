// Estado compartilhado entre as páginas: modo, projetos carregados, job atual e histórico.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { obterApi } from './api'
import { normalizarResultado } from './format'
import { projetosExemplo } from './folders'
import { carregarProjetos, salvarProjetos } from './armazenamento'
import * as hist from './historico'

const INTERVALO_MS = 1500
const Contexto = createContext(null)

function lerPref(chave, padrao) {
  try { return localStorage.getItem(chave) ?? padrao } catch { return padrao }
}
export function gravarPref(chave, valor) {
  try { localStorage.setItem(chave, valor) } catch { /* armazenamento indisponível */ }
}

function ordenar(projetos) {
  return projetos.sort((a, b) => a.id.localeCompare(b.id, 'pt-BR', { numeric: true }))
}

export function EstadoProvider({ children }) {
  const [modo, setModo] = useState(() => lerPref('modo', 'api'))
  const [projetos, setProjetos] = useState([])
  const [projetosProntos, setProjetosProntos] = useState(false)
  const [job, setJob] = useState(null)
  const [historico, setHistorico] = useState(hist.carregar)
  const [erro, setErro] = useState(null)
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const timer = useRef(null)
  const historicoRef = useRef(historico)

  useEffect(() => gravarPref('modo', modo), [modo])
  useEffect(() => () => clearTimeout(timer.current), [])

  // Projetos inseridos ficam guardados no navegador até serem analisados ou removidos.
  useEffect(() => {
    let ativo = true
    carregarProjetos().then((guardados) => {
      if (!ativo) return
      setProjetos((atuais) => {
        const mapa = new Map(guardados.map((p) => [p.id, p]))
        for (const p of atuais) mapa.set(p.id, p)
        return ordenar([...mapa.values()])
      })
      setProjetosProntos(true)
    })
    return () => { ativo = false }
  }, [])

  useEffect(() => {
    if (!projetosProntos) return
    salvarProjetos(projetos).then((ok) => {
      if (!ok) setErro('Não foi possível guardar os projetos neste navegador. Eles se perdem se a página for recarregada.')
    })
  }, [projetos, projetosProntos])

  const anunciar = useCallback((texto) => {
    setAviso('')
    setTimeout(() => setAviso(texto), 30)
  }, [])

  const atualizarHistorico = useCallback((fn) => {
    const nova = fn(historicoRef.current)
    historicoRef.current = nova
    setHistorico(nova)
    if (!hist.salvar(nova)) setErro('Não foi possível salvar o histórico neste navegador. Exporte o JSON para não perder as decisões.')
  }, [])

  const emAndamento = job && (job.status === 'PENDING' || job.status === 'PROCESSING')

  function carregar({ projetos: novos, ignorados }) {
    if (!novos.length) {
      setErro(ignorados
        ? `Nenhuma pasta com nome PRJ foi encontrada (${ignorados} arquivos ignorados). Arraste as pastas PRJ21, PRJ22… ou a pasta que contém todas elas.`
        : 'A pasta estava vazia.')
      return
    }
    setErro(null)
    const comHistorico = new Set(historicoRef.current.map((e) => e.projeto_id))
    setProjetos((atuais) => {
      const mapa = new Map(atuais.map((p) => [p.id, p]))
      for (const p of novos) {
        const atual = mapa.get(p.id)
        // Um projeto em análise não é substituído no meio do processamento
        if (atual?.status === 'analise') continue
        mapa.set(p.id, { ...p, selecionado: atual?.selecionado ?? false, status: 'fila', novaVersao: comHistorico.has(p.id), inseridoEm: new Date().toISOString() })
      }
      return ordenar([...mapa.values()])
    })
    const reenviados = novos.filter((p) => comHistorico.has(p.id)).length
    anunciar(`${novos.length} ${novos.length === 1 ? 'projeto carregado' : 'projetos carregados'}.`
      + (reenviados ? ` ${reenviados} com nova versão das evidências.` : '')
      + ' Eles ficam guardados em Projetos a analisar.')
  }

  function alternar(id) {
    const atual = projetos.find((p) => p.id === id)
    if (!atual || atual.status === 'analise') return
    setProjetos((ps) => ps.map((p) => (p.id === id ? { ...p, selecionado: !p.selecionado } : p)))
    anunciar(`Projeto ${id} ${atual.selecionado ? 'removido da' : 'selecionado para'} análise`)
  }

  function todos(valor, ids) {
    const alvo = new Set(ids)
    setProjetos((ps) => ps.map((p) => (alvo.has(p.id) && p.status !== 'analise' ? { ...p, selecionado: valor } : p)))
    anunciar(valor ? 'Projetos visíveis selecionados' : 'Seleção limpa')
  }

  function remover(id) {
    setProjetos((ps) => ps.filter((p) => p.id !== id || p.status === 'analise'))
    anunciar(`Projeto ${id} removido da lista`)
  }

  function concluir(jobId, modoJob, resultados) {
    const lista = resultados.map(normalizarResultado)
    const em = new Date().toISOString()
    atualizarHistorico((h) => lista
      .filter((r) => !r.erro)
      .reduce((acc, r) => hist.adicionarAnalise(acc, hist.novaEntrada({ resultado: r, jobId, modo: modoJob, em })), h))
    setProjetos((ps) => ps.map((p) => {
      const r = lista.find((x) => x.id === p.id)
      if (!r) return p.status === 'analise' ? { ...p, status: 'falhou', erro: 'O motor não devolveu resultado para este projeto.' } : p
      if (r.erro) return { ...p, status: 'falhou', erro: r.erro, selecionado: false }
      return { ...p, status: 'concluido', entradaId: hist.idEntrada(jobId, r.id), novaVersao: false, selecionado: false, erro: null }
    }))
    setJob((j) => ({ ...j, status: 'COMPLETED', resultados: lista }))
    const falhas = lista.filter((r) => r.erro).length
    anunciar(`Análise concluída. ${lista.length - falhas} projetos aguardam sua decisão${falhas ? `, ${falhas} falharam` : ''}.`)
  }

  function falhar(mensagem) {
    setProjetos((ps) => ps.map((p) => (p.status === 'analise' ? { ...p, status: 'falhou', erro: mensagem } : p)))
    setJob((j) => (j ? { ...j, status: 'FAILED', message: mensagem } : j))
    setErro(mensagem)
  }

  function acompanhar(api, jobId) {
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const s = await api.status(jobId)
        setJob((j) => (j?.job_id === jobId ? { ...j, ...s } : j))
        if (s.status === 'COMPLETED') {
          const r = await api.resultados(jobId)
          concluir(jobId, api.nome, r.results ?? [])
          return
        }
        if (s.status === 'FAILED') throw new Error(s.message || 'O processamento falhou no servidor.')
        acompanhar(api, jobId)
      } catch (e) {
        falhar(e.message)
      }
    }, INTERVALO_MS)
  }

  // Devolve o job_id para a página navegar até o acompanhamento, ou null em caso de erro.
  async function iniciar(fonte) {
    if (emAndamento) return null
    const api = obterApi(modo)
    setErro(null)
    setEnviando(true)
    try {
      const selecionados = fonte.tipo === 'upload' ? projetos.filter((p) => p.selecionado) : []
      if (fonte.tipo === 'upload' && modo === 'api' && selecionados.some((p) => p.arquivos.every((a) => !a.file))) {
        throw new Error('Os projetos de exemplo só funcionam no modo demonstração. Arraste pastas reais para usar a API.')
      }
      const r = fonte.tipo === 'upload' ? await api.iniciarUpload(selecionados) : await api.iniciarPasta(fonte.caminho)
      const ids = selecionados.map((p) => p.id)
      setProjetos((ps) => ps.map((p) => (ids.includes(p.id) ? { ...p, status: 'analise', selecionado: false, erro: null } : p)))
      setJob({ job_id: r.job_id, modo: api.nome, ids, status: 'PENDING', processed_count: 0, total_projects: ids.length, message: r.message, inicio: Date.now() })
      anunciar('Análise iniciada')
      acompanhar(api, r.job_id)
      return r.job_id
    } catch (e) {
      setErro(e.message)
      return null
    } finally {
      setEnviando(false)
    }
  }

  // Retoma o acompanhamento de um job da API depois de recarregar a página.
  function retomar(jobId) {
    if (job?.job_id === jobId || jobId.startsWith('demo-') || emAndamento) return
    setJob({ job_id: jobId, modo: 'api', ids: [], status: 'PENDING', processed_count: 0, total_projects: 0, message: 'Retomando o acompanhamento…', inicio: Date.now() })
    acompanhar(obterApi('api'), jobId)
  }

  function decidir(entradaId, decisao) {
    const entrada = historicoRef.current.find((e) => e.id === entradaId)
    if (!entrada) return
    atualizarHistorico((h) => hist.registrarDecisao(h, entradaId, decisao))
    anunciar(decisao ? `Decisão registrada para ${entrada.projeto_id}: ${decisao.classe}` : `Decisão de ${entrada.projeto_id} desfeita`)
  }

  function limparHistorico() {
    historicoRef.current = hist.limpar()
    setHistorico([])
    setProjetos((ps) => ps.map((p) => (p.status === 'concluido' ? { ...p, status: 'fila', entradaId: null, novaVersao: false } : p)))
    anunciar('Histórico apagado')
  }

  const porId = useMemo(() => new Map(historico.map((e) => [e.id, e])), [historico])

  // Status exibido: projetos concluídos dependem da decisão registrada no histórico.
  const statusDe = useCallback((p) => {
    if (p.status !== 'concluido') return p.status ?? 'fila'
    const entrada = porId.get(p.entradaId)
    if (!entrada) return 'fila'
    return entrada.decisao ? 'decidido' : 'aguardando'
  }, [porId])

  const valor = {
    modo, setModo, projetos, projetosProntos, job, emAndamento, historico, erro, setErro, aviso, anunciar, enviando,
    carregar, alternar, todos, remover, iniciar, retomar, decidir, limparHistorico, statusDe,
    carregarExemplo: () => carregar({ projetos: projetosExemplo(), ignorados: 0 }),
  }
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useEstado() {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useEstado precisa estar dentro de EstadoProvider')
  return ctx
}
