import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, FilePlus2, FileCheck2, FileWarning, X } from 'lucide-react'
import { contarTipos } from '../lib/folders'
import { STATUS, TONS } from '../lib/format'

const ORDEM_TIPOS = ['PDF', 'CSV', 'Planilha', 'Texto', 'Outro']

export function SeloStatus({ status }) {
  const meta = STATUS[status] ?? STATUS.fila
  const tom = TONS[meta.tom]
  const { Icone } = meta
  return (
    <span className={`badge bg-bg ${tom.borda} ${tom.texto}`}>
      <Icone className={`h-4 w-4 ${meta.girando ? 'animate-spin' : ''}`} aria-hidden="true" />
      {meta.rotulo}
    </span>
  )
}

export function SeloNovaVersao() {
  return (
    <span className="badge border-detail bg-bg text-ink">
      <FilePlus2 className="h-4 w-4 text-detail" aria-hidden="true" />
      Nova versão das evidências
    </span>
  )
}

export default function ProjectCard({ projeto, status, indice, aoAlternar, aoRemover }) {
  const emAnalise = status === 'analise'
  const temDetalhe = status === 'aguardando' || status === 'decidido'
  const tipos = contarTipos(projeto.arquivos)
  const temInventario = projeto.arquivos.some((a) => a.relativo.toLowerCase().includes('inventario'))
  const sel = projeto.selecionado

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: Math.min(indice, 10) * 0.03 }}
      className="relative flex flex-col pt-8"
    >
      {/* Aba da pasta: identidade visual do produto */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 rounded-t-lg border border-b-0 px-3.5 py-1 text-base font-bold tracking-tight transition-colors ${
          sel ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface-2 text-ink'
        }`}
      >
        {projeto.id}
      </span>

      <label
        className={`flex flex-1 flex-col rounded-b-xl rounded-tr-xl border bg-bg p-5 shadow-elev-1 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-detail ${
          emAnalise ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${sel ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-line-strong'}`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={sel}
          disabled={emAnalise}
          onChange={() => aoAlternar(projeto.id)}
          aria-label={`Selecionar projeto ${projeto.id} para análise, ${projeto.arquivos.length} arquivos, situação: ${(STATUS[status] ?? STATUS.fila).rotulo}${projeto.novaVersao ? ', nova versão das evidências' : ''}`}
        />
        <div className="flex items-start justify-between gap-3">
          <p className="text-2xl font-bold tabular-nums tracking-tight">
            {projeto.arquivos.length}
            <span className="ml-1.5 text-base font-normal text-ink-soft">arquivos</span>
          </p>
          <span
            aria-hidden="true"
            className={`grid h-7 w-7 place-items-center rounded-md border transition-colors ${
              sel ? 'border-accent bg-accent text-on-accent' : 'border-line-strong bg-bg text-transparent'
            }`}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <SeloStatus status={status} />
          {projeto.novaVersao && <SeloNovaVersao />}
        </div>
        {status === 'falhou' && projeto.erro && <p className="mt-2 line-clamp-3 text-sm text-neg">{projeto.erro}</p>}

        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tipos de arquivo">
          {ORDEM_TIPOS.filter((t) => tipos[t]).map((t) => (
            <li key={t} className="rounded-md bg-surface-2 px-2 py-0.5 text-sm text-ink-soft">
              {tipos[t]} {t}
            </li>
          ))}
        </ul>

        <p className={`mt-auto flex items-center gap-1.5 pt-4 text-sm ${temInventario ? 'text-ink-soft' : 'font-semibold text-warn'}`}>
          {temInventario
            ? <FileCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            : <FileWarning className="h-4 w-4 shrink-0" aria-hidden="true" />}
          {temInventario ? 'Inventário de evidências encontrado' : 'Sem inventário de evidências'}
        </p>
      </label>

      {temDetalhe && (
        <Link
          to={`/projetos/${projeto.id}`}
          className={`btn btn-secondary mt-2 w-full justify-between ${status === 'aguardando' ? 'border-accent text-accent' : ''}`}
        >
          {status === 'aguardando' ? `Decidir ${projeto.id}` : `Ver decisão de ${projeto.id}`}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      )}

      <button
        type="button"
        disabled={emAnalise}
        onClick={() => aoRemover(projeto.id)}
        aria-label={`Remover ${projeto.id} da lista`}
        className="btn-icon absolute -top-1 right-0 p-1.5"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </motion.li>
  )
}
