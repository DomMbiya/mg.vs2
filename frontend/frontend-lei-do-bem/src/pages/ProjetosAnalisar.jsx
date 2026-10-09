import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FolderInput, Inbox, LoaderCircle, Trash2 } from 'lucide-react'
import { SeloNovaVersao, SeloStatus } from '../components/ProjectCard'
import { Filtros } from '../components/SelectStage'
import { AvisoAndamento, BarraAcao, CabecalhoPagina, EstadoVazio } from '../components/Pagina'
import { contarTipos } from '../lib/folders'
import { formatarDataHora } from '../lib/format'
import { useEstado } from '../lib/estado'

// Projetos inseridos que ainda não foram analisados (ou cuja análise falhou).
const SITUACOES_DA_FILA = ['fila', 'analise', 'falhou']

function resumoArquivos(arquivos) {
  return Object.entries(contarTipos(arquivos)).map(([tipo, n]) => `${n} ${tipo}`).join(', ')
}

export default function ProjetosAnalisar() {
  const e = useEstado()
  const navegar = useNavigate()
  const [filtro, setFiltro] = useState(null)
  const [busca, setBusca] = useState('')

  const fila = e.projetos
    .map((p) => ({ projeto: p, status: e.statusDe(p) }))
    .filter(({ status }) => SITUACOES_DA_FILA.includes(status))
  const contagem = {}
  for (const { status } of fila) contagem[status] = (contagem[status] ?? 0) + 1
  const termo = busca.trim().toUpperCase()
  const visiveis = fila.filter(({ projeto, status }) => (!filtro || status === filtro) && (!termo || projeto.id.includes(termo)))
  const selecionaveis = visiveis.filter(({ status }) => status !== 'analise').map(({ projeto }) => projeto)
  const todos = selecionaveis.length > 0 && selecionaveis.every((p) => p.selecionado)
  const selecionados = e.projetos.filter((p) => p.selecionado)
  const jobAtivo = e.emAndamento ? e.job.job_id : null

  async function analisar() {
    const jobId = await e.iniciar({ tipo: 'upload' })
    if (jobId) navegar(`/analise/${jobId}`)
  }

  return (
    <div>
      <CabecalhoPagina
        titulo="Projetos a analisar"
        descricao="Projetos inseridos que ainda não passaram pelo motor. Ficam guardados neste navegador até você analisar ou remover."
        acoes={<Link to="/" className="btn btn-secondary"><FolderInput className="h-5 w-5" aria-hidden="true" /> Inserir projetos</Link>}
      />

      {jobAtivo && <div className="mt-6"><AvisoAndamento jobId={jobAtivo} /></div>}

      {!e.projetosProntos ? (
        <p className="mt-10 flex items-center gap-3 text-base text-ink-soft" role="status">
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> Carregando projetos guardados…
        </p>
      ) : fila.length === 0 ? (
        <div className="mt-10">
          <EstadoVazio
            Icone={Inbox}
            titulo="Nenhum projeto aguardando análise"
            acoes={<Link to="/" className="btn btn-primary btn-lg">Inserir projetos</Link>}
          >
            Insira as pastas dos projetos no início. Eles aparecem aqui até serem analisados.
          </EstadoVazio>
        </div>
      ) : (
        <section aria-labelledby="titulo-fila" className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="titulo-fila" className="section-title text-2xl">
              {fila.length} {fila.length === 1 ? 'projeto guardado' : 'projetos guardados'}
            </h2>
            <button type="button" disabled={!selecionaveis.length} onClick={() => e.todos(!todos, selecionaveis.map((p) => p.id))}
              className="link text-base disabled:opacity-40">
              {todos ? 'Limpar seleção' : (filtro || termo) ? 'Selecionar os visíveis' : 'Selecionar todos'}
            </button>
          </div>
          <Filtros contagem={contagem} total={fila.length} status={filtro} aoStatus={setFiltro} busca={busca} aoBuscar={setBusca}
            opcoes={SITUACOES_DA_FILA} idBusca="busca-fila" />

          {visiveis.length === 0 ? (
            <p className="mt-6 text-base text-ink-soft">Nenhum projeto corresponde ao filtro.</p>
          ) : (
            <ul className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-bg shadow-elev-1">
              {visiveis.map(({ projeto: p, status }) => (
                <li key={p.id} className={`flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:px-5 ${p.selecionado ? 'bg-accent/5' : 'hover:bg-surface'}`}>
                  <label className={`flex min-w-0 flex-1 items-start gap-4 ${status === 'analise' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 shrink-0"
                      checked={Boolean(p.selecionado)}
                      disabled={status === 'analise'}
                      onChange={() => e.alternar(p.id)}
                    />
                    <span className="flex min-w-0 flex-col gap-1.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold">{p.id}</span>
                        <SeloStatus status={status} />
                        {p.novaVersao && <SeloNovaVersao />}
                      </span>
                      <span className="text-base text-ink-soft">
                        {p.arquivos.length} arquivos ({resumoArquivos(p.arquivos)})
                        {p.inseridoEm && <> · inserido em {formatarDataHora(p.inseridoEm)}</>}
                      </span>
                      {status === 'falhou' && p.erro && <span className="text-base text-neg">{p.erro}</span>}
                    </span>
                  </label>
                  <button
                    type="button"
                    disabled={status === 'analise'}
                    onClick={() => e.remover(p.id)}
                    className="btn btn-ghost self-start sm:self-center"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden="true" /> Remover <span className="sr-only">{p.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {fila.length > 0 && (
        <BarraAcao resumo={<><strong className="text-xl font-bold tabular-nums text-ink">{selecionados.length}</strong> selecionados para análise</>}>
          <button type="button" disabled={!selecionados.length || e.enviando || Boolean(jobAtivo)} onClick={analisar} className="btn btn-primary btn-lg">
            {e.enviando && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {e.enviando ? 'Enviando arquivos' : `Analisar selecionados${selecionados.length ? ` (${selecionados.length})` : ''}`}
          </button>
        </BarraAcao>
      )}
    </div>
  )
}
