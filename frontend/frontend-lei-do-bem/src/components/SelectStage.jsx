import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FolderInput, LoaderCircle, Search, FlaskConical } from 'lucide-react'
import ProjectCard from './ProjectCard'
import { AvisoAndamento, BarraAcao, CabecalhoPagina } from './Pagina'
import { Simbolo } from './Logo'
import { lerInput, lerSoltura } from '../lib/folders'
import { ORDEM_STATUS, STATUS, TONS } from '../lib/format'

function ZonaSoltura({ aoCarregar, compacta }) {
  const [arrastando, setArrastando] = useState(false)
  const [lendo, setLendo] = useState(false)
  const inputRef = useRef(null)
  const contador = useRef(0)

  async function aoSoltar(e) {
    e.preventDefault()
    contador.current = 0
    setArrastando(false)
    setLendo(true)
    try {
      aoCarregar(await lerSoltura(e.dataTransfer))
    } finally {
      setLendo(false)
    }
  }

  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); contador.current++; setArrastando(true) }}
      onDragLeave={() => { contador.current--; if (contador.current <= 0) setArrastando(false) }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={aoSoltar}
      className={`rounded-2xl border-2 border-dashed transition-colors ${
        arrastando ? 'border-accent bg-accent/5' : 'border-line bg-surface'
      } ${compacta ? 'px-5 py-4 sm:min-h-24 sm:py-0' : 'px-6 py-12 sm:py-14'}`}
    >
      <div className={`mx-auto flex max-w-2xl flex-col items-center text-center ${compacta ? 'gap-3 sm:min-h-24 sm:max-w-none sm:flex-row sm:gap-4 sm:text-left' : 'gap-4'}`}>
        <motion.div animate={arrastando ? { scale: 1.08 } : { scale: 1 }} className="grid shrink-0 place-items-center">
          {lendo
            ? <LoaderCircle className={`animate-spin text-ink-soft ${compacta ? 'h-8 w-8' : 'h-[72px] w-[72px]'}`} aria-hidden="true" />
            : compacta
              ? <span className="grid h-12 w-12 place-items-center rounded-xl bg-bg text-ink-soft"><FolderInput className="h-6 w-6" aria-hidden="true" /></span>
              : <Simbolo tamanho={72} variante="apagado" />}
        </motion.div>
        <div className={compacta ? 'min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-2' : ''}>
          <p className={`font-bold tracking-tight ${compacta ? 'text-base sm:shrink-0' : 'text-2xl sm:text-3xl'}`}>
            {lendo ? 'Lendo as pastas…' : arrastando ? 'Solte para inserir' : compacta ? 'Arraste mais pastas para cá' : 'Arraste as pastas dos projetos para cá'}
          </p>
          <p className={`text-ink-soft ${compacta ? 'text-base sm:truncate' : 'mt-2 text-lg'}`}>
            Cada pasta PRJ vira um cartão. Você pode soltar várias de uma vez ou a pasta que contém todas.
          </p>
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} className={`btn btn-secondary ${compacta ? 'shrink-0' : 'mt-2'}`}>
          Escolher pasta
        </button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          webkitdirectory=""
          directory=""
          multiple
          onChange={(e) => { if (e.target.files?.length) aoCarregar(lerInput(e.target.files)); e.target.value = '' }}
        />
      </div>
    </div>
  )
}

export function Filtros({ contagem, total, status, aoStatus, busca, aoBuscar, opcoes = ORDEM_STATUS, idBusca = 'busca-projetos' }) {
  return (
    <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
        <button type="button" aria-pressed={status === null} onClick={() => aoStatus(null)} className="chip">
          Todos <span className="tabular-nums opacity-80">{total}</span>
        </button>
        {opcoes.map((s) => {
          const tom = TONS[STATUS[s].tom]
          const n = contagem[s] ?? 0
          return (
            <button key={s} type="button" disabled={!n && status !== s} aria-pressed={status === s} onClick={() => aoStatus(status === s ? null : s)} className="chip">
              <span className={`h-2.5 w-2.5 rounded-full ${tom.solido}`} aria-hidden="true" />
              {STATUS[s].rotulo} <span className="tabular-nums opacity-80">{n}</span>
            </button>
          )
        })}
      </div>
      <div className="relative">
        <label htmlFor={idBusca} className="sr-only">Buscar projeto por ID</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <input id={idBusca} type="search" value={busca} onChange={(e) => aoBuscar(e.target.value)} placeholder="Buscar por ID, ex.: PRJ21"
          className="field w-full pl-10 lg:w-72" />
      </div>
    </div>
  )
}

const PASSOS = [
  ['Insira as pastas', 'Arraste as pastas PRJ com dossiê, entrevista, planilhas e evidências.'],
  ['O motor recomenda', 'Cada critério de Frascati vem ligado ao arquivo que o sustenta.'],
  ['Você decide', 'Confirme ou registre outra classificação e exporte o parecer.'],
]

function ComoFunciona() {
  return (
    <ol className="mt-8 grid gap-4 sm:grid-cols-3">
      {PASSOS.map(([titulo, texto], i) => (
        <li key={titulo} className="flex gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong text-base font-bold tabular-nums" aria-hidden="true">{i + 1}</span>
          <div>
            <p className="text-base font-semibold">{titulo}</p>
            <p className="mt-0.5 text-base text-ink-soft">{texto}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function SelectStage({ projetos, statusDe, jobAtivo, modo, ocupado, aoCarregar, aoAlternar, aoRemover, aoTodos, aoAnalisar, aoExemplo }) {
  const [filtroStatus, setFiltroStatus] = useState(null)
  const [busca, setBusca] = useState('')
  const comStatus = projetos.map((p) => ({ projeto: p, status: statusDe(p) }))
  const contagem = {}
  for (const { status } of comStatus) contagem[status] = (contagem[status] ?? 0) + 1
  const termo = busca.trim().toUpperCase()
  const visiveis = comStatus.filter(({ projeto, status }) =>
    (!filtroStatus || status === filtroStatus) && (!termo || projeto.id.includes(termo)))
  const selecionaveis = visiveis.filter(({ status }) => status !== 'analise').map(({ projeto }) => projeto)
  const selecionados = projetos.filter((p) => p.selecionado).length
  const todos = selecionaveis.length > 0 && selecionaveis.every((p) => p.selecionado)
  const vazio = projetos.length === 0

  return (
    <div className="flex flex-col gap-7">
      {vazio ? (
        <CabecalhoPagina
          titulo="Do dossiê ao parecer, com cada conclusão ligada à sua evidência."
          descricao="O motor lê os documentos, aponta evidências fortes e fracas e recomenda uma classificação. A decisão final é sempre do analista."
        />
      ) : (
        <CabecalhoPagina
          titulo="Inserir e analisar projetos"
          descricao="Marque os projetos e clique em analisar. A recomendação do motor ainda passa pela sua decisão."
        />
      )}

      {jobAtivo && <AvisoAndamento jobId={jobAtivo} />}

      <div>
      <ZonaSoltura aoCarregar={aoCarregar} compacta={!vazio} />

      {vazio && <ComoFunciona />}
      </div>

      {!vazio && (
        <section aria-labelledby="titulo-projetos">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="titulo-projetos" className="section-title text-2xl">
              {projetos.length} {projetos.length === 1 ? 'projeto inserido' : 'projetos inseridos'}
            </h2>
            <button type="button" disabled={!selecionaveis.length} onClick={() => aoTodos(!todos, selecionaveis.map((p) => p.id))} className="link text-base disabled:opacity-40">
              {todos ? 'Limpar seleção' : (filtroStatus || termo) ? 'Selecionar os visíveis' : 'Selecionar todos'}
            </button>
          </div>
          <Filtros contagem={contagem} total={projetos.length} status={filtroStatus} aoStatus={setFiltroStatus} busca={busca} aoBuscar={setBusca} />
          {visiveis.length === 0 ? (
            <p className="mt-6 text-base text-ink-soft">Nenhum projeto corresponde ao filtro.</p>
          ) : (
            <ul className="mt-6 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence>
                {visiveis.map(({ projeto: p, status }, i) => (
                  <ProjectCard key={p.id} projeto={p} status={status} indice={i} aoAlternar={aoAlternar} aoRemover={aoRemover} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>
      )}

      {modo === 'demo' && (
        <button type="button" onClick={aoExemplo} className="btn btn-ghost -ml-3 self-start text-accent">
          <FlaskConical className="h-5 w-5" aria-hidden="true" />
          {vazio ? 'Carregar projetos de exemplo para ensaiar' : 'Carregar projetos de exemplo de novo (simula nova evidência)'}
        </button>
      )}

      {!vazio && (
        <BarraAcao resumo={<><strong className="text-xl font-bold tabular-nums text-ink">{selecionados}</strong> de {projetos.length} selecionados</>}>
          <button type="button" disabled={selecionados === 0 || ocupado || Boolean(jobAtivo)} onClick={aoAnalisar} className="btn btn-primary btn-lg">
            {ocupado && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {ocupado ? 'Enviando arquivos' : (
              <span>Analisar<span className="hidden sm:inline"> projetos selecionados</span>{selecionados ? ` (${selecionados})` : ''}</span>
            )}
          </button>
        </BarraAcao>
      )}
    </div>
  )
}
