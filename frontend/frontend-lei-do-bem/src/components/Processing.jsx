import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileSearch, ShieldCheck, Sparkles } from 'lucide-react'
import { CabecalhoPagina } from './Pagina'

function tempoDecorrido(ms) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const ETAPAS = [
  [FileSearch, 'Lê cada pasta', 'Dossiê, entrevista, planilhas e evidências.'],
  [Sparkles, 'Consulta a IA', 'Avalia os cinco critérios de Frascati.'],
  [ShieldCheck, 'Valida a resposta', 'Recusa respostas fora do formato exigido.'],
]

export default function Processing({ job, ids }) {
  const [agora, setAgora] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const total = job.total_projects || ids.length || 0
  const feitos = job.processed_count || 0
  const pct = total ? Math.round((feitos / total) * 100) : 0

  return (
    <section>
      <CabecalhoPagina
        titulo={job.status === 'PENDING' ? 'Preparando a análise' : 'Analisando os projetos'}
        descricao="Você pode navegar pelas outras páginas. O acompanhamento continua."
        acoes={<p className="text-base font-semibold tabular-nums text-ink-soft">Tempo decorrido {tempoDecorrido(agora - job.inicio)}</p>}
      />

      <div className="panel-raised mt-8 p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="flex items-baseline gap-3">
            <span className="text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">{feitos}</span>
            <span className="text-lg text-ink-soft">de {total || '…'} projetos analisados</span>
          </p>
          <p className="text-lg font-semibold tabular-nums">{pct}%</p>
        </div>

        <div
          role="progressbar"
          aria-label="Progresso da análise"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="mt-5 h-3 overflow-hidden rounded-full bg-surface-2"
        >
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pct, 2)}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
        </div>

        {ids.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Projetos neste lote">
            {ids.map((id, i) => (
              <motion.li
                key={id}
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: (i % 8) * 0.18 }}
                className="rounded-md border border-line bg-surface px-2.5 py-1 text-sm font-semibold"
              >
                {id}
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <ol className="mt-8 grid gap-5 sm:grid-cols-3">
        {ETAPAS.map(([Icone, titulo, texto]) => (
          <li key={titulo} className="flex gap-3">
            <Icone className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
            <div>
              <p className="text-base font-semibold">{titulo}</p>
              <p className="mt-0.5 text-base text-ink-soft">{texto}</p>
            </div>
          </li>
        ))}
      </ol>

      {job.message && <p className="mt-8 text-sm text-ink-soft">{job.message}</p>}
    </section>
  )
}
