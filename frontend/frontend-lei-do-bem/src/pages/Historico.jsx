import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Download, History, Search, Trash2 } from 'lucide-react'
import { EtiquetaSimulado, Selo } from '../components/Verdict'
import { exportar } from '../components/Results'
import Dialogo from '../components/Dialogo'
import { CabecalhoPagina, EstadoVazio } from '../components/Pagina'
import { ORDEM_CLASSES, formatarDataHora } from '../lib/format'
import { LIMITE_HISTORICO, numerarVersoes } from '../lib/historico'
import { useEstado } from '../lib/estado'

function Situacao({ entrada }) {
  const [cor, texto, tom] = !entrada.decisao
    ? ['bg-warn', 'Pendente de decisão', 'text-warn']
    : entrada.divergente
      ? ['bg-detail', 'Analista divergiu do motor', 'text-ink']
      : ['bg-pos', 'Analista confirmou o motor', 'text-pos']
  return (
    <span className={`flex items-center gap-2 font-semibold ${tom}`}>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cor}`} aria-hidden="true" />
      {texto}
    </span>
  )
}

function plural(n, um, varios) {
  return `${n} ${n === 1 ? um : varios}`
}

export default function Historico() {
  const { historico, limparHistorico } = useEstado()
  const [classe, setClasse] = useState('')
  const [pendentes, setPendentes] = useState(false)
  const [divergentes, setDivergentes] = useState(false)
  const [busca, setBusca] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  const versoes = useMemo(() => numerarVersoes(historico), [historico])
  const termo = busca.trim().toUpperCase()
  const visiveis = historico.filter((e) =>
    (!classe || e.recomendacao === classe)
    && (!pendentes || !e.decisao)
    && (!divergentes || e.divergente)
    && (!termo || e.projeto_id.includes(termo)))
  const totalPendentes = historico.filter((e) => !e.decisao).length
  const filtrando = Boolean(classe || pendentes || divergentes || termo)

  function limparFiltros() {
    setClasse(''); setPendentes(false); setDivergentes(false); setBusca('')
  }

  return (
    <div className="pb-16">
      <CabecalhoPagina
        titulo="Histórico de análises"
        descricao={historico.length
          ? `${plural(historico.length, 'análise', 'análises')}, ${plural(totalPendentes, 'pendente', 'pendentes')} de decisão. A classificação final é sempre do analista.`
          : 'Cada análise concluída fica registrada aqui, com a decisão do analista.'}
        acoes={historico.length > 0 && (
          <>
            <button type="button" onClick={() => exportar(historico, 'historico-lei-do-bem')} className="btn btn-secondary">
              <Download className="h-5 w-5" aria-hidden="true" /> Exportar histórico
            </button>
            <button type="button" onClick={() => setConfirmando(true)} className="btn btn-danger">
              <Trash2 className="h-5 w-5" aria-hidden="true" /> Limpar histórico
            </button>
          </>
        )}
      />

      {historico.length === 0 ? (
        <div className="mt-10">
          <EstadoVazio
            Icone={History}
            titulo="Nenhuma análise registrada neste navegador"
            acoes={<Link to="/" className="btn btn-primary btn-lg">Inserir projetos</Link>}
          >
            Insira e analise projetos. As recomendações e as suas decisões aparecem aqui.
          </EstadoVazio>
        </div>
      ) : (
        <>
          <div className="panel mt-8 flex flex-col gap-4 p-4 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filtro-classe" className="field-label">Recomendação do motor</label>
              <select id="filtro-classe" value={classe} onChange={(e) => setClasse(e.target.value)} className="field">
                <option value="">Todas</option>
                {ORDEM_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="busca-historico" className="field-label">Buscar por ID</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
                <input id="busca-historico" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: PRJ21" className="field w-full pl-10 lg:w-56" />
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-5 lg:pb-2.5">
              <label className="flex cursor-pointer items-center gap-2 text-base">
                <input type="checkbox" checked={pendentes} onChange={(e) => setPendentes(e.target.checked)} className="h-5 w-5" />
                Só pendentes de decisão
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-base">
                <input type="checkbox" checked={divergentes} onChange={(e) => setDivergentes(e.target.checked)} className="h-5 w-5" />
                Só onde motor e analista divergiram
              </label>
            </div>
            {filtrando && (
              <button type="button" onClick={limparFiltros} className="btn btn-ghost self-start lg:ml-auto">Limpar filtros</button>
            )}
          </div>

          <p className="mt-5 text-sm text-ink-soft" aria-live="polite">
            Mostrando {visiveis.length} de {historico.length}. O navegador guarda as {LIMITE_HISTORICO} análises mais recentes.
          </p>

          {/* Rolagem horizontal própria no celular, sem rolar a página inteira */}
          <div className="relative mt-3 overflow-x-auto rounded-xl border border-line bg-bg shadow-elev-1" tabIndex={0} role="region" aria-label="Tabela do histórico, role para os lados no celular">
            <table className="w-full min-w-[54rem] text-left text-base">
              <caption className="sr-only">Análises registradas, das mais recentes para as mais antigas</caption>
              <thead className="border-b border-line bg-surface">
                <tr>
                  {['Projeto', 'Data', 'Recomendação do motor', 'Decisão do analista', 'Situação'].map((t) => (
                    <th key={t} scope="col" className="px-4 py-3 text-sm font-semibold text-ink-soft">{t}</th>
                  ))}
                  <th scope="col" className="w-10 px-2 py-3"><span className="sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visiveis.map((e) => (
                  <tr key={e.id} className="align-middle transition-colors hover:bg-surface">
                    <th scope="row" className="px-4 py-3.5 font-normal">
                      <Link to={`/projetos/${e.projeto_id}?versao=${versoes[e.id]}`} className="text-base font-bold text-accent underline-offset-4 hover:underline">
                        {e.projeto_id}
                      </Link>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                        Versão {versoes[e.id]}
                        {e.modo === 'demo' && <EtiquetaSimulado />}
                      </span>
                    </th>
                    <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-ink-soft">{formatarDataHora(e.em)}</td>
                    <td className="px-4 py-3.5">{e.recomendacao ? <Selo classe={e.recomendacao} /> : '—'}</td>
                    <td className="px-4 py-3.5">{e.decisao ? <Selo classe={e.decisao.classe} /> : <span className="text-ink-soft">Ainda não decidido</span>}</td>
                    <td className="px-4 py-3.5"><Situacao entrada={e} /></td>
                    <td className="px-2 py-3.5 text-ink-soft"><ChevronRight className="h-5 w-5" aria-hidden="true" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visiveis.length === 0 && (
              <div className="flex flex-col items-start gap-3 px-4 py-8">
                <p className="text-base text-ink-soft">Nenhuma análise corresponde aos filtros.</p>
                <button type="button" onClick={limparFiltros} className="btn btn-secondary">Limpar filtros</button>
              </div>
            )}
          </div>
        </>
      )}

      <Dialogo aberto={confirmando} titulo="Limpar o histórico?" aoFechar={() => setConfirmando(false)}>
        <p className="mt-3 text-base text-ink-soft">
          As {historico.length} análises e as decisões registradas serão apagadas deste navegador. Não dá para desfazer.
          Exporte o JSON antes se precisar guardar os pareceres.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setConfirmando(false)} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={() => { limparHistorico(); setConfirmando(false) }} className="btn btn-danger-solid">
            <Trash2 className="h-5 w-5" aria-hidden="true" /> Apagar histórico
          </button>
        </div>
      </Dialogo>
    </div>
  )
}
