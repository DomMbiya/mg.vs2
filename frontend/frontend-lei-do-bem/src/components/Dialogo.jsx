import { useEffect, useId, useRef } from 'react'

const FOCAVEIS = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Diálogo modal acessível: foco preso dentro dele, Esc fecha e o foco volta para quem abriu.
export default function Dialogo({ aberto, titulo, children, aoFechar }) {
  const ref = useRef(null)
  const idTitulo = useId()
  const fechar = useRef(aoFechar)
  fechar.current = aoFechar

  useEffect(() => {
    if (!aberto) return undefined
    const anterior = document.activeElement
    ref.current?.querySelector(FOCAVEIS)?.focus()

    function aoTeclar(e) {
      if (e.key === 'Escape') { e.preventDefault(); fechar.current(); return }
      if (e.key !== 'Tab' || !ref.current) return
      const itens = [...ref.current.querySelectorAll(FOCAVEIS)]
      if (!itens.length) return
      const primeiro = itens[0]
      const ultimo = itens[itens.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus() }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus() }
      else if (!ref.current.contains(document.activeElement)) { e.preventDefault(); primeiro.focus() }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      anterior?.focus?.()
    }
  }, [aberto])

  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar() }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={idTitulo} className="w-full max-w-lg rounded-2xl border border-line bg-bg p-6 shadow-elev-3 sm:p-7">
        <h2 id={idTitulo} className="text-xl font-bold tracking-tight">{titulo}</h2>
        {children}
      </div>
    </div>
  )
}
