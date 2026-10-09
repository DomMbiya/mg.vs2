// Parecer técnico para impressão ou "Salvar como PDF" do navegador, sem dependências.
// O documento é montado num portal fora do app; o CSS de impressão mostra só ele.
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileDown } from 'lucide-react'
import { Simbolo } from './Logo'
import { CLASSES, formatarDataHora, textoEstado } from '../lib/format'
import { numerarVersoes } from '../lib/historico'
import { descreverAnalista } from '../lib/analista'
import { useEstado } from '../lib/estado'

function Secao({ numero, titulo, children }) {
  return (
    <section className="mt-6 break-inside-avoid-page">
      <h2 className="border-b border-line pb-1 text-[15px] font-bold">{numero}. {titulo}</h2>
      <div className="mt-2.5">{children}</div>
    </section>
  )
}

function Campo({ rotulo, children }) {
  return (
    <div className="flex gap-2">
      <dt className="w-44 shrink-0 font-semibold text-ink-soft">{rotulo}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  )
}

function ListaEvidencias({ itens }) {
  return (
    <ul className="space-y-2">
      {itens.map((e, i) => (
        <li key={`${e.id}-${i}`} className="break-inside-avoid">
          <p>
            <strong>{e.id}</strong>
            {e.forca && <> · evidência {e.forca}</>}
            {e.criterio && <> · {e.criterio}</>}
          </p>
          {e.justificativa && <p>{e.justificativa}</p>}
          <p className="break-all font-mono text-[12.5px] text-ink-soft">{e.referencia}</p>
        </li>
      ))}
    </ul>
  )
}

function Lista({ itens }) {
  return <ul className="list-disc space-y-1 pl-5">{itens.map((t) => <li key={t}>{t}</li>)}</ul>
}

export function DocumentoParecer({ entrada, versao, totalVersoes, gerador, geradoEm }) {
  const r = entrada.resultado
  const decisao = entrada.decisao
  const quemDecidiu = decisao?.analista ?? null
  const evidencias = r.evidencias.length ? r.evidencias : r.fontes.map((f) => ({ id: f, referencia: f }))
  let n = 0
  const proximo = () => ++n

  return (
    <article className="parecer text-[13.5px] leading-relaxed text-ink">
      <header className="flex items-start justify-between gap-6 border-b-2 border-ink pb-4">
        <div className="flex items-center gap-3">
          <Simbolo tamanho={44} variante="claro" />
          <div>
            <p className="text-[13px] font-semibold text-ink-soft">Motor de Governança · Lei do Bem (Lei nº 11.196/2005)</p>
            <h1 className="text-[22px] font-bold leading-tight">Parecer técnico de enquadramento</h1>
          </div>
        </div>
        <div className="text-right text-[13px]">
          <p className="text-[20px] font-bold">{entrada.projeto_id}</p>
          <p className="text-ink-soft">Versão {versao} de {totalVersoes}</p>
        </div>
      </header>

      {entrada.modo === 'demo' && (
        <p className="mt-3 rounded border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold">
          Dados simulados (modo demonstração). Este documento não tem valor de parecer.
        </p>
      )}

      <Secao numero={proximo()} titulo="Identificação">
        <dl className="space-y-1">
          <Campo rotulo="Projeto">{entrada.projeto_id}{r.titulo ? ` · ${r.titulo}` : ''}</Campo>
          <Campo rotulo="Análise do motor">{formatarDataHora(entrada.em)} · versão {versao} de {totalVersoes}</Campo>
          <Campo rotulo="Identificador da análise"><span className="font-mono text-[12.5px]">{entrada.job_id}</span></Campo>
        </dl>
      </Secao>

      <Secao numero={proximo()} titulo="Recomendação do motor">
        <p className="text-[16px] font-bold">{r.classe ?? 'Sem classificação'}</p>
        {CLASSES[r.classe] && <p className="text-ink-soft">{CLASSES[r.classe].resumo}</p>}
        {r.justificativa && <p className="mt-2">{r.justificativa}</p>}
        {r.limite && <p className="mt-2"><strong>Limite da conclusão:</strong> {r.limite}</p>}
      </Secao>

      {r.criterios.length > 0 && (
        <Secao numero={proximo()} titulo="Critérios do Manual de Frascati">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-line">
                <th className="w-[22%] py-1.5 pr-3 font-semibold">Critério</th>
                <th className="w-[24%] py-1.5 pr-3 font-semibold">Estado</th>
                <th className="py-1.5 font-semibold">Justificativa e fonte</th>
              </tr>
            </thead>
            <tbody>
              {r.criterios.map((c) => (
                <tr key={c.chave} className="break-inside-avoid border-b border-line align-top">
                  <td className="py-1.5 pr-3 font-semibold">{c.nome}</td>
                  <td className="py-1.5 pr-3">{textoEstado(c.estado)}</td>
                  <td className="py-1.5">
                    {c.justificativa}
                    {c.fonte && <span className="block break-all font-mono text-[12.5px] text-ink-soft">{c.fonte}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Secao>
      )}

      <Secao numero={proximo()} titulo="Evidências">
        <h3 className="font-semibold">Que sustentam a recomendação</h3>
        {evidencias.length ? <div className="mt-1"><ListaEvidencias itens={evidencias} /></div> : <p className="text-ink-soft">Nenhuma evidência citada.</p>}
        {r.contrarias.length > 0 && (
          <>
            <h3 className="mt-3 font-semibold">Contrárias</h3>
            <div className="mt-1"><ListaEvidencias itens={r.contrarias} /></div>
          </>
        )}
      </Secao>

      {r.divergencia && (
        <Secao numero={proximo()} titulo="Divergência entre entrevista e documentos">
          <p>{r.divergencia}</p>
          <p className="mt-1 text-ink-soft">A entrevista é contexto. Prevalece o registro documental.</p>
        </Secao>
      )}

      {(r.lacunas.length > 0 || r.solicitar.length > 0) && (
        <Secao numero={proximo()} titulo="Lacunas e evidências a solicitar">
          {r.lacunas.length > 0 && <><h3 className="font-semibold">Lacunas</h3><Lista itens={r.lacunas} /></>}
          {r.solicitar.length > 0 && <><h3 className="mt-2 font-semibold">Evidências a solicitar</h3><Lista itens={r.solicitar} /></>}
        </Secao>
      )}

      <Secao numero={proximo()} titulo="Decisão do analista">
        {decisao ? (
          <dl className="space-y-1">
            <Campo rotulo="Classificação final"><strong>{decisao.classe}</strong></Campo>
            <Campo rotulo="Em relação ao motor">{entrada.divergente ? 'Diverge da recomendação' : 'Confirma a recomendação'}</Campo>
            <Campo rotulo="Justificativa">{decisao.motivo || 'Sem justificativa adicional (recomendação confirmada).'}</Campo>
            <Campo rotulo="Decidido em">{formatarDataHora(decisao.em)}</Campo>
            <Campo rotulo="Analista responsável">{quemDecidiu ? descreverAnalista(quemDecidiu) : 'Não identificado no momento da decisão'}</Campo>
          </dl>
        ) : (
          <p className="font-semibold">Pendente. O analista ainda não registrou a decisão; este documento é um rascunho.</p>
        )}
      </Secao>

      <footer className="mt-10 break-inside-avoid">
        <div className="grid grid-cols-2 gap-10">
          <div>
            <div className="h-12 border-b border-ink" />
            <p className="mt-1 text-[13px]">{(quemDecidiu ?? gerador)?.nome ?? 'Analista'}</p>
            <p className="text-[13px] text-ink-soft">Assinatura do analista</p>
          </div>
          <div>
            <div className="h-12 border-b border-ink" />
            <p className="mt-1 text-[13px]">Local e data</p>
          </div>
        </div>
        <p className="mt-6 border-t border-line pt-2 text-[13px] text-ink-soft">
          A IA só recomenda. A classificação final é a decisão do analista.
          Documento gerado em {formatarDataHora(geradoEm)}{gerador ? ` por ${descreverAnalista(gerador)}` : ''}.
        </p>
      </footer>
    </article>
  )
}

// Botão que gera o documento de uma ou várias análises. Pede os dados do analista se ainda não houver.
export function BotaoGerarParecer({ entradas, rotulo = 'Gerar parecer (PDF)', className = 'btn btn-secondary' }) {
  const { analista, pedirDadosAnalista, historico } = useEstado()
  const [impressao, setImpressao] = useState(null)
  const versoes = useMemo(() => numerarVersoes(historico), [historico])
  const totais = useMemo(() => {
    const t = {}
    for (const e of historico) t[e.projeto_id] = (t[e.projeto_id] ?? 0) + 1
    return t
  }, [historico])

  useEffect(() => {
    if (!impressao) return undefined
    const tituloAnterior = document.title
    // O título vira o nome sugerido do arquivo ao salvar como PDF
    const ids = impressao.entradas.map((e) => e.projeto_id)
    document.title = `Parecer ${ids.length === 1 ? ids[0] : `${ids.length} projetos`} ${impressao.em.slice(0, 10)}`
    const fim = () => setImpressao(null)
    window.addEventListener('afterprint', fim)
    window.print()
    return () => {
      window.removeEventListener('afterprint', fim)
      document.title = tituloAnterior
    }
  }, [impressao])

  function gerar(quem) {
    setImpressao({ entradas, gerador: quem, em: new Date().toISOString() })
  }

  return (
    <>
      <button type="button" disabled={!entradas.length} onClick={() => (analista ? gerar(analista) : pedirDadosAnalista(gerar))} className={className}>
        <FileDown className="h-5 w-5" aria-hidden="true" /> {rotulo}
      </button>
      {impressao && createPortal(
        <div className="impressao-raiz">
          {impressao.entradas.map((e) => (
            <DocumentoParecer key={e.id} entrada={e} versao={versoes[e.id] ?? 1} totalVersoes={totais[e.projeto_id] ?? 1} gerador={impressao.gerador} geradoEm={impressao.em} />
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
