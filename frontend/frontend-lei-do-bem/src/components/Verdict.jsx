import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Gavel, Undo2 } from 'lucide-react'
import { CLASSES, ORDEM_CLASSES, TONS, formatarDataHora, textoEstado, tomEstado } from '../lib/format'

// Selo de classificação. O pequeno usa fundo sólido para manter o contraste sobre qualquer superfície.
function Selo({ classe, grande }) {
  const meta = CLASSES[classe] ?? CLASSES['Evidência insuficiente']
  const tom = TONS[meta.tom]
  const { Icone } = meta
  if (grande) {
    return (
      <span className={`inline-flex items-center gap-3 rounded-xl border px-4 py-2.5 ${tom.borda} ${tom.fundo} ${tom.texto}`}>
        <Icone className="h-7 w-7 shrink-0" aria-hidden="true" />
        <span className="text-2xl font-bold tracking-tight sm:text-3xl">{classe ?? 'Sem classificação'}</span>
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border bg-bg px-2.5 py-1 text-base font-semibold ${tom.borda} ${tom.texto}`}>
      <Icone className="h-4 w-4 shrink-0" aria-hidden="true" />
      {classe ?? 'Sem classificação'}
    </span>
  )
}

function EtiquetaSimulado() {
  return <span className="badge badge-muted">Simulado</span>
}

function Criterios({ criterios }) {
  if (!criterios.length) return null
  return (
    <section aria-labelledby="titulo-criterios" className="mt-8">
      <h3 id="titulo-criterios" className="text-lg font-bold tracking-tight">Critérios do Manual de Frascati</h3>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {criterios.map((c) => {
          const tom = TONS[tomEstado(c.estado)]
          return (
            <li key={c.chave} className="grid gap-1.5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-5">
              <p className="text-base font-semibold">{c.nome}</p>
              <div className="min-w-0">
                <p className={`flex items-center gap-2 text-base font-semibold ${tom.texto}`}>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tom.solido}`} aria-hidden="true" />
                  {textoEstado(c.estado)}
                </p>
                {c.justificativa && <p className="mt-1 text-base">{c.justificativa}</p>}
                {c.fonte && <p className="mt-1.5 break-all font-mono text-sm text-ink-soft">{c.fonte}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ListaSimples({ titulo, itens }) {
  if (!itens?.length) return null
  return (
    <section className="mt-7">
      <h3 className="text-lg font-bold tracking-tight">{titulo}</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-6 text-base marker:text-detail">
        {itens.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </section>
  )
}

function Decisao({ resultado, decisao, aoDecidir }) {
  const [editando, setEditando] = useState(false)
  const [classe, setClasse] = useState(resultado.classe)
  const [motivo, setMotivo] = useState('')

  useEffect(() => { setEditando(false); setClasse(resultado.classe); setMotivo('') }, [resultado.id, resultado.classe])

  if (decisao) {
    const divergente = decisao.classe !== resultado.classe
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-line border-l-4 border-l-ink bg-surface p-5">
        <p className="flex items-center gap-2 text-base font-semibold"><Gavel className="h-5 w-5" aria-hidden="true" /> Decisão do analista registrada</p>
        <div className="mt-3"><Selo classe={decisao.classe} /></div>
        <p className="mt-3 text-base text-ink-soft">
          {divergente ? 'Diverge da recomendação do motor. ' : 'Confirma a recomendação do motor. '}
          Registrada em {formatarDataHora(decisao.em)}.
        </p>
        {decisao.motivo && <p className="mt-2 text-base">{decisao.motivo}</p>}
        <button type="button" onClick={() => aoDecidir(resultado.id, null)} className="btn btn-ghost -ml-3 mt-3">
          <Undo2 className="h-4 w-4" aria-hidden="true" /> Desfazer decisão
        </button>
      </motion.div>
    )
  }

  return (
    <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
      <p className="flex items-center gap-2 text-base font-semibold"><Gavel className="h-5 w-5" aria-hidden="true" /> Sua decisão</p>
      <p className="mt-1 text-base text-ink-soft">A recomendação só vale como parecer depois da sua confirmação.</p>

      <AnimatePresence initial={false} mode="wait">
        {!editando ? (
          <motion.div key="acoes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => aoDecidir(resultado.id, { classe: resultado.classe, motivo: '', em: Date.now() })}
              className="btn btn-primary btn-lg"
            >
              Confirmar recomendação
            </button>
            <button type="button" onClick={() => setEditando(true)} className="btn btn-secondary btn-lg">
              Registrar outra classificação
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
            onSubmit={(e) => { e.preventDefault(); if (motivo.trim()) aoDecidir(resultado.id, { classe, motivo: motivo.trim(), em: Date.now() }) }}
          >
            <fieldset>
              <legend className="field-label">Classificação do analista</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {ORDEM_CLASSES.map((c) => (
                  <label key={c} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line-strong bg-bg px-4 py-3 text-base font-semibold transition-colors hover:bg-surface has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-detail">
                    <input type="radio" name={`classe-${resultado.id}`} value={c} checked={classe === c} onChange={() => setClasse(c)} className="h-5 w-5 focus-visible:outline-none" />
                    {c}
                    {c === resultado.classe && <span className="ml-auto text-sm font-normal text-ink-soft">recomendada</span>}
                  </label>
                ))}
              </div>
            </fieldset>
            <label htmlFor={`motivo-${resultado.id}`} className="field-label mt-5 block">Justificativa</label>
            <p id={`dica-motivo-${resultado.id}`} className="mt-0.5 text-sm text-ink-soft">Obrigatória. Fica registrada no parecer exportado.</p>
            <textarea
              id={`motivo-${resultado.id}`}
              aria-describedby={`dica-motivo-${resultado.id}`}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              required
              className="field mt-2 w-full"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="submit" disabled={!motivo.trim()} className="btn btn-primary btn-lg">
                Registrar decisão
              </button>
              <button type="button" onClick={() => setEditando(false)} className="btn btn-ghost btn-lg">
                Cancelar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Verdict({ resultado, decisao, aoDecidir }) {
  const meta = CLASSES[resultado.classe]
  return (
    <article aria-labelledby="titulo-veredito" className="panel-raised p-6 sm:p-8">
      <h2 id="titulo-veredito" className="eyebrow">Recomendação do motor</h2>
      <motion.div key={resultado.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-3">
        <Selo classe={resultado.classe} grande />
      </motion.div>
      {meta && <p className="mt-3 text-base text-ink-soft">{meta.resumo}</p>}

      <p className="mt-6 max-w-[65ch] text-lg leading-relaxed">{resultado.justificativa}</p>

      {resultado.limite && (
        <div className="mt-6 rounded-r-lg border-l-4 border-warn bg-warn/5 px-4 py-3">
          <p className="text-base font-semibold text-warn">Limite da conclusão</p>
          <p className="mt-1 text-base">{resultado.limite}</p>
        </div>
      )}

      <Criterios criterios={resultado.criterios} />
      <ListaSimples titulo="Lacunas" itens={resultado.lacunas} />
      <ListaSimples titulo="Evidências a solicitar" itens={resultado.solicitar} />

      <div id="decisao" tabIndex={-1} className="mt-8 scroll-mt-24 focus:outline-none">
        <Decisao resultado={resultado} decisao={decisao} aoDecidir={aoDecidir} />
      </div>
    </article>
  )
}

export { EtiquetaSimulado, Selo }
