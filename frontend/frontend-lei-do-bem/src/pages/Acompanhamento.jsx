import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import Processing from '../components/Processing'
import { CabecalhoPagina } from '../components/Pagina'
import Results from '../components/Results'
import { useEstado } from '../lib/estado'

export default function Acompanhamento() {
  const { jobId } = useParams()
  const { job, emAndamento, historico, retomar } = useEstado()
  const atual = job?.job_id === jobId ? job : null
  // Simulações vivem só na memória; jobs da API só são retomados se nenhum outro estiver rodando.
  const inativo = !atual && (jobId.startsWith('demo-') || emAndamento)

  // Depois de um F5, jobs da API podem ser retomados.
  useEffect(() => {
    if (!atual && !inativo) retomar(jobId)
  }, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (inativo) {
    const entradas = historico.filter((e) => e.job_id === jobId)
    return (
      <CabecalhoPagina
        titulo="Este acompanhamento não está mais ativo"
        descricao={entradas.length
          ? `Os ${entradas.length} resultados desta análise estão guardados no histórico.`
          : jobId.startsWith('demo-')
            ? 'Simulações ficam só na memória do navegador e se perdem ao recarregar a página.'
            : 'Outra análise está em andamento. Volte aqui quando ela terminar.'}
        acoes={<>
          <Link to="/historico" className="btn btn-primary btn-lg">Abrir histórico</Link>
          <Link to="/projetos" className="btn btn-secondary btn-lg">Projetos a analisar</Link>
        </>}
      />
    )
  }

  if (!atual) return null

  if (atual.status === 'COMPLETED') {
    return <Results resultados={atual.resultados ?? []} entradas={historico.filter((e) => e.job_id === jobId)} />
  }

  if (atual.status === 'FAILED') {
    return (
      <div className="flex flex-col gap-6">
        <CabecalhoPagina
          titulo="A análise não foi concluída"
          descricao="Os projetos continuam guardados para uma nova tentativa."
          acoes={<Link to="/projetos" className="btn btn-primary btn-lg">Voltar a Projetos a analisar</Link>}
        />
        <p className="flex items-start gap-3 rounded-xl border border-neg/40 border-l-4 border-l-neg bg-neg/5 p-4 text-base">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-neg" aria-hidden="true" />
          {atual.message}
        </p>
      </div>
    )
  }

  return <Processing job={atual} ids={atual.ids ?? []} />
}
