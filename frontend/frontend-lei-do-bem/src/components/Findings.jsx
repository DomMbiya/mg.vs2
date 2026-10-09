import { FileText, FileSpreadsheet, CircleCheck, TriangleAlert, MessageSquareWarning, FolderSearch } from 'lucide-react'
import { arquivoDaReferencia } from '../lib/format'
import { tipoArquivo as tipo } from '../lib/folders'

function IconeArquivo({ nome }) {
  const t = tipo(nome)
  const Icone = t === 'CSV' || t === 'Planilha' ? FileSpreadsheet : FileText
  return <Icone className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
}

function verificar(referencia, arquivosLocais) {
  if (!arquivosLocais) return null
  const alvo = arquivoDaReferencia(referencia).toLowerCase()
  if (!alvo) return null
  return arquivosLocais.some((a) => a.relativo.toLowerCase() === alvo || a.relativo.toLowerCase().endsWith(`/${alvo}`))
}

function CartaoEvidencia({ e, arquivosLocais }) {
  const existe = verificar(e.referencia, arquivosLocais)
  const forte = e.forca === 'forte'
  return (
    <li className="panel-raised p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-bold">{e.id}</span>
        {e.forca && (
          <span className={`badge bg-bg ${forte ? 'border-pos text-pos' : 'border-warn text-warn'}`}>
            Evidência {forte ? 'forte' : 'fraca'}
          </span>
        )}
        {e.criterio && <span className="badge badge-muted">{e.criterio}</span>}
      </div>
      {e.justificativa && <p className="mt-2 text-base">{e.justificativa}</p>}
      <p className="mt-2.5 flex items-start gap-2 break-all font-mono text-sm text-ink-soft">
        <IconeArquivo nome={arquivoDaReferencia(e.referencia)} />
        {e.referencia}
      </p>
      {existe !== null && (
        <p className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${existe ? 'text-pos' : 'text-neg'}`}>
          {existe ? <CircleCheck className="h-4 w-4" aria-hidden="true" /> : <TriangleAlert className="h-4 w-4" aria-hidden="true" />}
          {existe ? 'Arquivo citado existe na pasta' : 'Arquivo citado não está na pasta enviada'}
        </p>
      )}
    </li>
  )
}

function ListaEvidencias({ titulo, itens, arquivosLocais }) {
  return (
    <div>
      <h3 className="text-lg font-bold tracking-tight">{titulo} <span className="font-normal text-ink-soft">({itens.length})</span></h3>
      <ul className="mt-3 grid gap-3">
        {itens.map((e, i) => <CartaoEvidencia key={`${e.id}-${i}`} e={e} arquivosLocais={arquivosLocais} />)}
      </ul>
    </div>
  )
}

export default function Findings({ resultado, projeto }) {
  const arquivosLocais = projeto?.arquivos?.length && projeto.arquivos.some((a) => a.file) ? projeto.arquivos : null
  const evidencias = resultado.evidencias.length
    ? resultado.evidencias
    : resultado.fontes.map((f) => ({ id: arquivoDaReferencia(f) || f, referencia: f }))
  const citacoes = [...evidencias, ...resultado.contrarias]
  const verificadas = arquivosLocais ? citacoes.filter((e) => verificar(e.referencia, arquivosLocais)).length : null
  const todasConferem = verificadas === citacoes.length

  return (
    <section aria-labelledby="titulo-achados" className="flex min-w-0 flex-col gap-7">
      <div>
        <h2 id="titulo-achados" className="section-title text-2xl">O que o motor encontrou</h2>
        {verificadas !== null && citacoes.length > 0 && (
          <p className={`mt-2 flex items-center gap-2 text-base font-semibold ${todasConferem ? 'text-pos' : 'text-neg'}`}>
            {todasConferem ? <CircleCheck className="h-5 w-5" aria-hidden="true" /> : <TriangleAlert className="h-5 w-5" aria-hidden="true" />}
            {verificadas} de {citacoes.length} citações apontam para arquivos que existem na pasta.
          </p>
        )}
        {!arquivosLocais && citacoes.length > 0 && (
          <p className="mt-2 flex items-center gap-2 text-base text-ink-soft">
            <FolderSearch className="h-5 w-5 shrink-0" aria-hidden="true" />
            Arraste a pasta de novo para conferir as citações.
          </p>
        )}
      </div>

      {resultado.divergencia && (
        <div className="rounded-r-lg border-l-4 border-detail bg-detail/10 px-4 py-4">
          <p className="flex items-center gap-2 text-base font-bold">
            <MessageSquareWarning className="h-5 w-5 shrink-0" aria-hidden="true" />
            Entrevista diverge dos documentos
          </p>
          <p className="mt-2 text-base">{resultado.divergencia}</p>
          <p className="mt-2 text-sm text-ink-soft">A entrevista é contexto. Prevalece o registro documental.</p>
        </div>
      )}

      {evidencias.length ? (
        <ListaEvidencias titulo={resultado.evidencias.length ? 'Evidências que sustentam' : 'Fontes decisivas'} itens={evidencias} arquivosLocais={arquivosLocais} />
      ) : (
        <p className="text-base text-ink-soft">Nenhuma evidência citada nesta resposta.</p>
      )}

      {resultado.contrarias.length > 0 && (
        <ListaEvidencias titulo="Evidências contrárias" itens={resultado.contrarias} arquivosLocais={arquivosLocais} />
      )}

      {projeto?.arquivos?.length > 0 && (
        <details className="group panel px-5 py-4">
          <summary className="cursor-pointer text-base font-semibold">{projeto.arquivos.length} arquivos lidos</summary>
          <ul className="mt-3 grid gap-1.5">
            {projeto.arquivos.map((a) => (
              <li key={a.relativo} className="flex items-center gap-2 font-mono text-sm">
                <IconeArquivo nome={a.relativo} />
                <span className="break-all">{a.relativo}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
