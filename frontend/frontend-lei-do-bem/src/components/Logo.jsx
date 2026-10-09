// Símbolo do Motor de Governança: uma pasta com linhas de texto e o selo da decisão.
// Em 32px ou menos usa a versão reduzida, com menos linhas e traço mais grosso.

const VARIANTES = {
  claro: { pasta: '#B80032', selo: '#FF8400' },
  escuro: { pasta: '#E0003F', selo: '#FF9A2E' },
  apagado: { pasta: 'var(--line)', selo: '#B80032' },
}

const PASTA = 'M13 8H25.5L31 13.5H51A7 7 0 0 1 58 20.5V49A7 7 0 0 1 51 56H13A7 7 0 0 1 6 49V15A7 7 0 0 1 13 8Z'

// rotulo: quando o símbolo identifica o sistema, vira imagem com nome acessível; sem ele, é decorativo.
export function Simbolo({ tamanho = 44, variante = 'claro', rotulo, className = '' }) {
  const cores = VARIANTES[variante] ?? VARIANTES.claro
  const reduzido = tamanho <= 32
  const acessibilidade = rotulo ? { role: 'img', 'aria-label': rotulo } : { 'aria-hidden': 'true' }
  return (
    <svg viewBox="0 0 64 64" width={tamanho} height={tamanho} className={`shrink-0 ${className}`} focusable="false" {...acessibilidade}>
      <path d={PASTA} fill={cores.pasta} />
      {reduzido ? (
        <>
          <path d="M17 25H47M17 38H31" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="42" cy="39" r="8.5" fill={cores.selo} stroke="#FFFFFF" strokeWidth="3.5" />
        </>
      ) : (
        <>
          <path d="M18 24H46M18 33H40M18 42H35" stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <circle cx="43" cy="42" r="6.4" fill={cores.selo} stroke="#FFFFFF" strokeWidth="2.6" />
        </>
      )}
    </svg>
  )
}
