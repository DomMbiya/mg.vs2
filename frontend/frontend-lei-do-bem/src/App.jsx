import { useEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { FlaskConical, TriangleAlert, X } from 'lucide-react'
import Header from './components/Header'
import Rodape from './components/Rodape'
import Inicio from './pages/Inicio'
import ProjetosAnalisar from './pages/ProjetosAnalisar'
import Historico from './pages/Historico'
import DetalheProjeto from './pages/DetalheProjeto'
import Acompanhamento from './pages/Acompanhamento'
import { gravarPref, useEstado } from './lib/estado'

function lerTema() {
  try {
    const salvo = localStorage.getItem('tema')
    if (salvo) return salvo
  } catch { /* armazenamento indisponível */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function tituloDaRota(caminho) {
  if (caminho === '/historico') return 'Histórico'
  if (caminho === '/projetos') return 'Projetos a analisar'
  if (caminho.startsWith('/projetos/')) return `Projeto ${decodeURIComponent(caminho.split('/')[2] ?? '')}`
  if (caminho.startsWith('/analise/')) return 'Acompanhamento da análise'
  return 'Início'
}

export default function App() {
  const [tema, setTema] = useState(lerTema)
  const { modo, setModo, emAndamento, erro, setErro, aviso } = useEstado()
  const location = useLocation()
  const principal = useRef(null)
  const primeiraRota = useRef(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark')
    gravarPref('tema', tema)
  }, [tema])

  // A cada troca de página: título da aba, topo da tela e foco no conteúdo para quem usa teclado ou leitor de tela.
  useEffect(() => {
    document.title = `${tituloDaRota(location.pathname)} · Motor de Governança`
    if (primeiraRota.current) { primeiraRota.current = false; return }
    window.scrollTo(0, 0)
    principal.current?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <MotionConfig reducedMotion="user">
      <a href="#conteudo" onClick={(e) => { e.preventDefault(); principal.current?.focus() }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">
        Pular para o conteúdo
      </a>
      <Header
        tema={tema}
        aoTrocarTema={() => setTema((t) => (t === 'dark' ? 'light' : 'dark'))}
        modo={modo}
        aoTrocarModo={setModo}
        bloqueado={emAndamento}
      />
      {/* Área de conteúdo: à direita da barra lateral fixa em telas largas. Se a página tiver barra de ação fixa, o rodapé ganha espaço para não ficar escondido. */}
      <div className="flex min-h-screen flex-col bg-bg px-5 pb-4 pt-6 lg:pl-[calc(280px+48px)] lg:pr-12 lg:pb-5 lg:pt-10 has-[.barra-acao]:pb-28 lg:has-[.barra-acao]:pb-28">
        <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-7">
      {modo === 'demo' && (
        <p className="flex items-center gap-2.5 rounded-lg border border-detail/30 bg-detail/10 px-4 py-2 text-sm font-semibold">
          <FlaskConical className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
          Modo demonstração: os resultados são simulados e nenhuma chamada é feita à IA.
        </p>
      )}

      <main id="conteudo" ref={principal} tabIndex={-1} className="flex-1 focus:outline-none">
        <AnimatePresence>
          {erro && (
            <motion.div role="alert" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-8 flex items-start gap-3 rounded-xl border border-neg/40 border-l-4 border-l-neg bg-neg/5 p-4">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-neg" aria-hidden="true" />
              <p className="flex-1 text-base">{erro}</p>
              <button type="button" onClick={() => setErro(null)} aria-label="Fechar aviso" className="btn-icon -m-1">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <Routes location={location}>
              <Route path="/" element={<Inicio />} />
              <Route path="/projetos" element={<ProjetosAnalisar />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/projetos/:id" element={<DetalheProjeto />} />
              <Route path="/analise/:jobId" element={<Acompanhamento />} />
              <Route path="*" element={<Inicio />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <Rodape />
        </div>
      </div>

      <div aria-live="polite" className="sr-only">{aviso}</div>
    </MotionConfig>
  )
}
