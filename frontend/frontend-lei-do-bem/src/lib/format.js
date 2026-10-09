// Normaliza o JSON do backend (schema antigo ou novo) para a interface.
import { CircleCheck, TriangleAlert, CircleX, CircleHelp, Clock, LoaderCircle, Gavel } from 'lucide-react'

export const CLASSES = {
  'Elegível': { tom: 'pos', Icone: CircleCheck, resumo: 'Os cinco critérios estão sustentados por evidência.' },
  'Com ressalvas': { tom: 'warn', Icone: TriangleAlert, resumo: 'Sustentado em um recorte, com limite declarado.' },
  'Não elegível': { tom: 'neg', Icone: CircleX, resumo: 'As evidências não caracterizam atividade de P&D.' },
  'Evidência insuficiente': { tom: 'neutral', Icone: CircleHelp, resumo: 'Falta um elo para concluir. Veja o que solicitar.' },
}
export const ORDEM_CLASSES = Object.keys(CLASSES)

export const TONS = {
  pos: { texto: 'text-pos', fundo: 'bg-pos/10', borda: 'border-pos', solido: 'bg-pos' },
  warn: { texto: 'text-warn', fundo: 'bg-warn/10', borda: 'border-warn', solido: 'bg-warn' },
  neg: { texto: 'text-neg', fundo: 'bg-neg/10', borda: 'border-neg', solido: 'bg-neg' },
  neutral: { texto: 'text-neutral', fundo: 'bg-neutral/10', borda: 'border-neutral', solido: 'bg-neutral' },
}

// Situação de cada projeto na fila de trabalho. O texto sempre acompanha a cor.
export const STATUS = {
  fila: { rotulo: 'Na fila', tom: 'neutral', Icone: Clock },
  analise: { rotulo: 'Em análise', tom: 'neutral', Icone: LoaderCircle, girando: true },
  aguardando: { rotulo: 'Aguardando decisão', tom: 'warn', Icone: Gavel },
  decidido: { rotulo: 'Decidido', tom: 'pos', Icone: CircleCheck },
  falhou: { rotulo: 'Falhou', tom: 'neg', Icone: CircleX },
}
export const ORDEM_STATUS = Object.keys(STATUS)

export function formatarDataHora(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const NOMES_CRITERIOS = {
  novidade: 'Novidade',
  criatividade: 'Criatividade',
  novidade_criatividade: 'Novidade e criatividade',
  novidade_e_criatividade: 'Novidade e criatividade',
  incerteza: 'Incerteza',
  sistematicidade: 'Sistematicidade',
  transferibilidade: 'Transferibilidade',
  transferencia: 'Transferência',
}

export function nomeCriterio(chave) {
  const base = chave.replace(/^criterio_/, '')
  return NOMES_CRITERIOS[base] ?? base.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

export function tomEstado(estado = '') {
  const e = estado.toUpperCase()
  if (e.includes('ALEGADA')) return 'warn'
  if (e.includes('NÃO') || e.includes('INSUFICIENTE')) return 'neg'
  if (e.includes('INDETERMINADA')) return 'neutral'
  if (e.includes('PARCIAL') || e.includes('LIMITE') || e.includes('ACEITE') || e.includes('CONFIGURA')) return 'warn'
  return 'pos'
}

export function textoEstado(estado = '') {
  const minusculo = estado.toLocaleLowerCase('pt-BR')
  return minusculo.charAt(0).toLocaleUpperCase('pt-BR') + minusculo.slice(1)
}

function lista(valor) {
  if (!valor) return []
  if (Array.isArray(valor)) return valor
  return String(valor).split(/\s*[|;\n]\s*/).filter(Boolean)
}

function evidencia(e) {
  if (typeof e === 'string') return { id: e, referencia: e, forca: null, criterio: '', justificativa: '' }
  return {
    id: e.id ?? e.referencia ?? '',
    referencia: e.referencia ?? e.fonte ?? e.id ?? '',
    forca: e.forca ? String(e.forca).toLowerCase() : null,
    criterio: e.criterio ?? '',
    justificativa: e.justificativa ?? '',
  }
}

export function normalizarResultado(r) {
  const id = r.projeto_id ?? r.project_id ?? 'Sem ID'
  if (r.erro) return { id, erro: r.erro }
  const criterios = Object.entries(r)
    .filter(([chave, valor]) => chave.startsWith('criterio_') && valor && typeof valor === 'object')
    .map(([chave, valor]) => ({ chave, nome: nomeCriterio(chave), ...valor }))
  return {
    id,
    titulo: r.titulo && r.titulo !== 'Título a extrair' ? r.titulo : null,
    classe: r.classificacao_recomendada ?? r.classificacao,
    justificativa: r.justificativa,
    limite: r.limite,
    fontes: lista(r.fontes_decisivas),
    divergencia: r.divergencia_depoimento,
    criterios,
    evidencias: (r.evidencias ?? []).map(evidencia),
    contrarias: (r.evidencias_contrarias ?? []).map(evidencia),
    lacunas: lista(r.lacunas),
    solicitar: lista(r.evidencias_a_solicitar),
    bruto: r,
  }
}

export function arquivoDaReferencia(ref = '') {
  return ref.split('#')[0].trim().replace(/^\.?\//, '')
}
