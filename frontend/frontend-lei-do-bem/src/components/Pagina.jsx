import { Link } from 'react-router-dom'
import { ArrowRight, LoaderCircle } from 'lucide-react'

// Peças de layout repetidas entre as páginas: cabeçalho e estado vazio, de erro ou de espera.

export function CabecalhoPagina({ titulo, descricao, acoes, antes }) {
  return (
    <header className="flex flex-col gap-5 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        {antes}
        <h1 className="page-title">{titulo}</h1>
        {descricao && (typeof descricao === 'string'
          ? <p className="page-lead">{descricao}</p>
          : <div className="page-lead">{descricao}</div>)}
      </div>
      {acoes && <div className="flex flex-wrap gap-3 md:shrink-0 md:justify-end">{acoes}</div>}
    </header>
  )
}

const TONS_ESTADO = {
  neutro: 'border-line bg-surface',
  erro: 'border-neg/40 bg-neg/5',
}

export function EstadoVazio({ Icone, titulo, children, acoes, tom = 'neutro', principal = false }) {
  const Titulo = principal ? 'h1' : 'h2'
  return (
    <section className={`mx-auto flex max-w-2xl flex-col items-center rounded-2xl border px-6 py-12 text-center ${TONS_ESTADO[tom]}`}>
      {Icone && (
        <span className={`grid h-14 w-14 place-items-center rounded-full ${tom === 'erro' ? 'bg-neg/10 text-neg' : 'bg-surface-2 text-ink-soft'}`}>
          <Icone className="h-7 w-7" aria-hidden="true" />
        </span>
      )}
      <Titulo className="mt-5 text-2xl font-bold tracking-tight">{titulo}</Titulo>
      {children && <div className="mt-2 max-w-prose text-lg text-ink-soft">{children}</div>}
      {acoes && <div className="mt-7 flex flex-wrap justify-center gap-3">{acoes}</div>}
    </section>
  )
}

// Barra fixa no rodapé com a ação principal da página (ex.: analisar selecionados).
export function BarraAcao({ resumo, children }) {
  return (
    <div className="barra-acao fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg shadow-elev-2 lg:left-[280px]">
      <div className="mx-auto flex max-w-[1296px] items-center justify-between gap-3 px-5 py-3 lg:px-12">
        <p className="text-base text-ink-soft">{resumo}</p>
        {children}
      </div>
    </div>
  )
}

export function AvisoAndamento({ jobId }) {
  return (
    <Link to={`/analise/${jobId}`} className="group flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/5 px-5 py-3.5 transition-colors hover:bg-accent/10">
      <span className="flex items-center gap-3 text-base font-semibold">
        <LoaderCircle className="h-5 w-5 animate-spin text-accent" aria-hidden="true" /> Análise em andamento
      </span>
      <span className="flex items-center gap-1 text-base font-semibold text-accent">
        Acompanhar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  )
}
