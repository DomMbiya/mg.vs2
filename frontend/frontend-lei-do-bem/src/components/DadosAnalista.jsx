import { useEffect, useState } from 'react'
import Dialogo from './Dialogo'
import { useEstado } from '../lib/estado'

// Nome do analista que decide e assina os pareceres.
export default function DadosAnalista() {
  const { analista, pedidoAnalista, guardarAnalista, fecharDadosAnalista } = useEstado()
  const [nome, setNome] = useState('')
  const aberto = Boolean(pedidoAnalista)

  useEffect(() => {
    if (aberto) setNome(analista?.nome ?? '')
  }, [aberto]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialogo aberto={aberto} titulo="Nome do analista" aoFechar={fecharDadosAnalista}>
      <p className="mt-2 text-base text-ink-soft">
        Aparece no parecer e fica registrado em cada decisão. Fica guardado só neste navegador.
      </p>
      <form className="mt-5 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); guardarAnalista({ nome }) }}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="analista-nome" className="field-label">Nome completo</label>
          <input id="analista-nome" required autoComplete="name" className="field" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={fecharDadosAnalista} className="btn btn-secondary">Cancelar</button>
          <button type="submit" disabled={!nome.trim()} className="btn btn-primary">
            {pedidoAnalista?.aoSalvar ? 'Salvar e gerar parecer' : 'Salvar'}
          </button>
        </div>
      </form>
    </Dialogo>
  )
}
