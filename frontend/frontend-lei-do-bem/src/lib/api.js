// Cliente da API FastAPI e um modo de demonstração com o mesmo contrato.
import { gerarResultadoSimulado } from './mock.js'

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')

async function chamar(caminho, opcoes) {
  let resposta
  try {
    resposta = await fetch(`${BASE}${caminho}`, opcoes)
  } catch {
    throw new Error(
      `A API não respondeu em ${BASE}. Confira se o backend está rodando ou ative o modo demonstração.`,
    )
  }
  if (!resposta.ok) {
    let detalhe = `Erro ${resposta.status}`
    try {
      const corpo = await resposta.json()
      if (corpo?.detail) detalhe = typeof corpo.detail === 'string' ? corpo.detail : JSON.stringify(corpo.detail)
    } catch { /* corpo sem JSON */ }
    if (resposta.status === 404 && caminho === '/jobs/analyze-upload') {
      detalhe = 'O backend ainda não tem a rota /jobs/analyze-upload. Adicione a rota de upload ou use o caminho no servidor.'
    }
    throw new Error(detalhe)
  }
  return resposta.json()
}

export const apiReal = {
  nome: 'api',
  async iniciarUpload(projetos) {
    const form = new FormData()
    for (const p of projetos) {
      for (const a of p.arquivos) {
        if (!a.file) continue
        form.append('files', a.file, a.file.name)
        form.append('paths', `${p.id}/${a.relativo}`)
      }
    }
    return chamar('/jobs/analyze-upload', { method: 'POST', body: form })
  },
  async iniciarPasta(caminho) {
    return chamar('/jobs/analyze-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_path: caminho }),
    })
  },
  status: (id) => chamar(`/jobs/${id}/status`),
  resultados: (id) => chamar(`/jobs/${id}/results`),
}

const jobsSimulados = new Map()
const PASSO_MS = 1400

function criarJobSimulado(ids) {
  const id = `demo-${Date.now().toString(36)}`
  jobsSimulados.set(id, { ids, inicio: Date.now() })
  return { job_id: id, message: 'Simulação iniciada.' }
}

export const apiDemo = {
  nome: 'demo',
  async iniciarUpload(projetos) {
    return criarJobSimulado(projetos.map((p) => p.id))
  },
  async iniciarPasta() {
    return criarJobSimulado(['PRJ21', 'PRJ22', 'PRJ23', 'PRJ24', 'PRJ25'])
  },
  async status(id) {
    const job = jobsSimulados.get(id)
    if (!job) throw new Error('Job de demonstração não encontrado.')
    const feitos = Math.min(job.ids.length, Math.floor((Date.now() - job.inicio) / PASSO_MS))
    return {
      job_id: id,
      status: feitos >= job.ids.length ? 'COMPLETED' : 'PROCESSING',
      processed_count: feitos,
      total_projects: job.ids.length,
      message: 'Dados simulados, sem chamada à IA.',
    }
  },
  async resultados(id) {
    const job = jobsSimulados.get(id)
    return { job_id: id, results: job.ids.map(gerarResultadoSimulado) }
  },
}

export const obterApi = (modo) => (modo === 'demo' ? apiDemo : apiReal)
export const ENDERECO_API = BASE
