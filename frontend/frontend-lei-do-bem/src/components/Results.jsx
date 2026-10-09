import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CircleCheck, Download, CircleX } from 'lucide-react'
import { Selo } from './Verdict'
import { CabecalhoPagina } from './Pagina'
import { CLASSES, ORDEM_CLASSES, TONS } from '../lib/format'

export function Distribuicao({ resultados, filtro, aoFiltrar }) {
  const total = resultados.length
  const contagem = ORDEM_CLASSES.map((c) => [c, resultados.filter((r) => r.classe === c).length])
  const erros = resultados.filter((r) => r.erro).length
  return (
    <div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        {contagem.map(([c, n]) => n > 0 && (
          <motion.span key={c} initial={{ width: 0 }} animate={{ width: `${(n / total) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={TONS[CLASSES[c].tom].solido} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por recomendação do motor">
        <button type="button" aria-pressed={filtro === null} onClick={() => aoFiltrar(null)} className="chip">
          Todos <span className="tabular-nums opacity-80">{total}</span>
        </button>
        {contagem.map(([c, n]) => {
          const tom = TONS[CLASSES[c].tom]
          return (
            <button key={c} type="button" disabled={!n} aria-pressed={filtro === c} onClick={() => aoFiltrar(filtro === c ? null : c)} className="chip">
              <span className={`h-2.5 w-2.5 rounded-full ${tom.solido}`} aria-hidden="true" />
              {c} <span className="tabular-nums opacity-80">{n}</span>
            </button>
          )
        })}
        {erros > 0 && <span className="inline-flex items-center rounded-full border border-neg px-3.5 py-1.5 text-base font-semibold text-neg">{erros} com falha</span>}
      </div>
    </div>
  )
}

// Exporta entradas do histórico em JSON. A decisão do analista é a classificação final.
export function exportar(entradas, prefixo = 'pareceres-lei-do-bem') {
  const dados = {
    gerado_em: new Date().toISOString(),
    observacao: 'A classificação final é a decisão do analista. A recomendação do motor é apoio à decisão.',
    pareceres: entradas.map((e) => ({
      projeto_id: e.projeto_id,
      job_id: e.job_id,
      analisado_em: e.em,
      modo: e.modo,
      simulado: e.modo === 'demo',
      recomendacao_motor: e.recomendacao,
      decisao_analista: e.decisao?.classe ?? null,
      justificativa_analista: e.decisao?.motivo || null,
      decidido_em: e.decisao?.em ?? null,
      motor_e_analista_divergiram: e.divergente,
      analise_completa: e.resultado?.bruto ?? null,
    })),
  }
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${prefixo}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Resumo de um lote concluído: cada projeto leva ao detalhe, onde o analista decide.
export default function Results({ resultados, entradas }) {
  const [filtro, setFiltro] = useState(null)
  const visiveis = useMemo(() => (filtro ? resultados.filter((r) => r.classe === filtro) : resultados), [resultados, filtro])
  const porProjeto = new Map(entradas.map((e) => [e.projeto_id, e]))
  const decididos = entradas.filter((e) => e.decisao).length
  const comRecomendacao = resultados.filter((r) => !r.erro).length

  return (
    <div className="pb-16">
      <CabecalhoPagina
        antes={<p className="eyebrow mb-1 flex items-center gap-1.5 text-pos"><CircleCheck className="h-4 w-4" aria-hidden="true" /> Análise concluída</p>}
        titulo={`${comRecomendacao} ${comRecomendacao === 1 ? 'projeto com recomendação' : 'projetos com recomendação'}`}
        descricao={decididos === 0
          ? 'A recomendação só vira parecer depois da sua decisão. Abra cada projeto para decidir.'
          : `${decididos} de ${comRecomendacao} pareceres decididos pelo analista.`}
        acoes={<>
          <Link to="/" className="btn btn-secondary"><ArrowLeft className="h-5 w-5" aria-hidden="true" /> Voltar ao início</Link>
          <button type="button" disabled={!entradas.length} onClick={() => exportar(entradas)} className="btn btn-secondary">
            <Download className="h-5 w-5" aria-hidden="true" /> Exportar pareceres do lote
          </button>
        </>}
      />

      <div className="mt-8"><Distribuicao resultados={resultados} filtro={filtro} aoFiltrar={setFiltro} /></div>

      <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visiveis.map((r) => {
          const entrada = porProjeto.get(r.id)
          return (
            <li key={r.id}>
              {r.erro ? (
                <div className="h-full rounded-xl border border-neg/40 bg-neg/5 p-5">
                  <p className="text-xl font-bold">{r.id}</p>
                  <p className="mt-2 flex items-center gap-2 text-base font-semibold text-neg"><CircleX className="h-5 w-5" aria-hidden="true" /> Falha na análise</p>
                  <p className="mt-2 text-base">{r.erro}</p>
                  <p className="mt-2 text-sm text-ink-soft">O projeto continua em Projetos a analisar para uma nova tentativa.</p>
                </div>
              ) : (
                <Link to={`/projetos/${r.id}`} className="group flex h-full flex-col rounded-xl border border-line bg-bg p-5 shadow-elev-1 transition-colors hover:border-line-strong">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-xl font-bold">{r.id}</span>
                      {r.titulo && <span className="mt-0.5 block truncate text-base text-ink-soft">{r.titulo}</span>}
                    </span>
                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
                  </span>
                  <span className="eyebrow mt-4">Recomendação do motor</span>
                  <span className="mt-1.5"><Selo classe={r.classe} /></span>
                  <span className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 text-base">
                    <span className={entrada?.decisao ? 'text-ink' : 'text-ink-soft'}>
                      {entrada?.decisao ? `Decisão: ${entrada.decisao.classe}` : 'Aguardando decisão'}
                    </span>
                    <span className="font-semibold text-accent">{entrada?.decisao ? 'Ver' : 'Decidir'}</span>
                  </span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
