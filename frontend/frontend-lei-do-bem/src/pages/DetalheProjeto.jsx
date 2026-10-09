import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ChevronRight, Gavel, Info, History } from 'lucide-react'
import Findings from '../components/Findings'
import Verdict, { EtiquetaSimulado, Selo } from '../components/Verdict'
import { SeloStatus } from '../components/ProjectCard'
import { CabecalhoPagina } from '../components/Pagina'
import { BotaoGerarParecer } from '../components/Parecer'
import { formatarDataHora } from '../lib/format'
import { versoesDoProjeto } from '../lib/historico'
import { useEstado } from '../lib/estado'

function LinhaDoTempo({ versoes, atual, aoEscolher }) {
  return (
    <section aria-labelledby="titulo-versoes" className="mt-8">
      <h2 id="titulo-versoes" className="text-lg font-bold tracking-tight">Linha do tempo das análises</h2>
      <ol className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {versoes.map((v, i) => {
          const mudou = i > 0 && v.recomendacao !== versoes[i - 1].recomendacao
          const selecionada = v.versao === atual.versao
          return (
            <li key={v.id} className="flex shrink-0 items-center gap-3">
              {i > 0 && <ChevronRight className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />}
              <button
                type="button"
                aria-current={selecionada ? 'true' : undefined}
                onClick={() => aoEscolher(v.versao)}
                className={`flex h-full flex-col items-start gap-2 rounded-xl border bg-bg px-4 py-3 text-left transition-colors ${
                  selecionada ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-line-strong'
                }`}
              >
                <span className="flex items-baseline gap-2">
                  <span className="text-base font-bold">Versão {v.versao}</span>
                  <span className="text-sm text-ink-soft">{formatarDataHora(v.em)}</span>
                </span>
                {v.recomendacao && <Selo classe={v.recomendacao} />}
                {mudou && (
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-detail" aria-hidden="true" />
                    Classificação mudou em relação à versão {versoes[i - 1].versao}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function irParaDecisao() {
  const alvo = document.getElementById('decisao')
  if (!alvo) return
  alvo.scrollIntoView({ behavior: 'smooth', block: 'start' })
  alvo.focus({ preventScroll: true })
}

export default function DetalheProjeto() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { historico, projetos, decidir } = useEstado()
  const versoes = versoesDoProjeto(historico, id)

  if (!versoes.length) {
    return (
      <CabecalhoPagina
        titulo={`Nenhuma análise registrada para ${id}`}
        descricao="Insira a pasta do projeto no início e rode a análise para ver o detalhe aqui."
        acoes={<>
          <Link to="/" className="btn btn-primary btn-lg">Inserir projetos</Link>
          <Link to="/historico" className="btn btn-secondary btn-lg">Ver histórico</Link>
        </>}
      />
    )
  }

  const pedida = Number(params.get('versao'))
  const atual = versoes.find((v) => v.versao === pedida) ?? versoes[versoes.length - 1]
  const maisRecente = atual.versao === versoes.length
  const projeto = projetos.find((p) => p.id === id)
  const escolher = (n) => setParams(n === versoes.length ? {} : { versao: String(n) }, { replace: true })

  return (
    <div className="pb-16">
      <nav aria-label="Trilha" className="text-base">
        <ol className="flex items-center gap-1.5 text-ink-soft">
          <li><Link to="/historico" className="link inline-flex items-center gap-1.5"><History className="h-4 w-4" aria-hidden="true" /> Histórico</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-4 w-4" /></li>
          <li aria-current="page" className="font-semibold text-ink">{id}</li>
        </ol>
      </nav>

      <div className="mt-4">
      <CabecalhoPagina
        titulo={id}
        descricao={<>
          {atual.resultado.titulo && <p>{atual.resultado.titulo}</p>}
          <p className="mt-2 flex flex-wrap items-center gap-2 text-base">
            <SeloStatus status={atual.decisao ? 'decidido' : 'aguardando'} />
            <span>Versão {atual.versao} de {versoes.length} · analisada em {formatarDataHora(atual.em)}</span>
            {atual.modo === 'demo' && <EtiquetaSimulado />}
          </p>
        </>}
        acoes={<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
          {versoes.length > 1 && (
            <div className="flex w-full flex-col gap-1.5 sm:w-auto">
              <label htmlFor="seletor-versao" className="field-label">Versão exibida</label>
              <select id="seletor-versao" value={atual.versao} onChange={(e) => escolher(Number(e.target.value))} className="field w-full min-w-0">
                {[...versoes].reverse().map((v) => (
                  <option key={v.id} value={v.versao}>
                    Versão {v.versao}{v.versao === versoes.length ? ' (mais recente)' : ''}, {formatarDataHora(v.em)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button type="button" onClick={irParaDecisao} className="btn btn-secondary">
            <Gavel className="h-5 w-5" aria-hidden="true" /> {atual.decisao ? 'Ver decisão' : 'Ir para a decisão'}
          </button>
          <BotaoGerarParecer entradas={[atual]} />
        </div>}
      />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <p className="flex items-start gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 text-base">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
          A IA só recomenda. A classificação final é a sua decisão.
        </p>
        {!maisRecente && (
          <p className="flex items-start gap-2.5 rounded-lg border border-warn/50 bg-warn/5 px-4 py-3 text-base">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden="true" />
            Você está vendo uma versão anterior. A decisão registrada aqui vale só para esta versão.
          </p>
        )}
      </div>

      {versoes.length > 1 && <LinhaDoTempo versoes={versoes} atual={atual} aoEscolher={escolher} />}

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:gap-10">
        {/* No celular a recomendação vem antes das evidências; lado a lado em telas largas */}
        <div className="order-2 min-w-0 xl:order-1">
          {/* Citações só são conferidas contra a pasta quando ela está carregada nesta sessão */}
          <Findings resultado={atual.resultado} projeto={maisRecente && !projeto?.novaVersao ? projeto : null} />
        </div>
        <div className="order-1 min-w-0 xl:order-2">
          <Verdict key={atual.id} resultado={atual.resultado} decisao={atual.decisao} aoDecidir={(_, decisao) => decidir(atual.id, decisao)} />
        </div>
      </div>
    </div>
  )
}
