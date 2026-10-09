import { useNavigate } from 'react-router-dom'
import SelectStage from '../components/SelectStage'
import { useEstado } from '../lib/estado'

export default function Inicio() {
  const e = useEstado()
  const navegar = useNavigate()

  async function iniciar(fonte) {
    const jobId = await e.iniciar(fonte)
    if (jobId) navegar(`/analise/${jobId}`)
  }

  return (
    <SelectStage
      projetos={e.projetos}
      statusDe={e.statusDe}
      jobAtivo={e.emAndamento ? e.job.job_id : null}
      modo={e.modo}
      ocupado={e.enviando}
      aoCarregar={e.carregar}
      aoAlternar={e.alternar}
      aoRemover={e.remover}
      aoTodos={e.todos}
      aoAnalisar={() => iniciar({ tipo: 'upload' })}
      aoExemplo={e.carregarExemplo}
    />
  )
}
