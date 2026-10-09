import { NavLink } from 'react-router-dom'
import { History, House, Inbox, Moon, Sun } from 'lucide-react'
import { Simbolo } from './Logo'

const LINKS = [
  ['/', 'Início'],
  ['/projetos', 'Projetos a analisar'],
  ['/historico', 'Histórico'],
]

const ICONES = { '/': House, '/projetos': Inbox, '/historico': History }

// NavLink aplica aria-current="page" no item ativo. "end" evita marcar a lista dentro do detalhe.
function Navegacao() {
  return (
    <nav aria-label="Principal" className="order-last -mx-5 w-[calc(100%+2.5rem)] lg:order-none lg:mx-0 lg:w-auto">
      <ul className="flex overflow-x-auto px-3 pb-3 [scrollbar-width:none] sm:gap-1 sm:px-5 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {LINKS.map(([para, rotulo]) => {
          const Icone = ICONES[para]
          return (
            <li key={para} className="shrink-0">
              <NavLink
                to={para}
                end
                className={({ isActive }) => `flex items-center gap-2 whitespace-nowrap rounded-lg px-2 py-3 text-base transition-colors sm:gap-3 sm:p-3 ${
                  isActive
                    ? 'bg-sidebar-ativo font-semibold text-sidebar-texto-forte'
                    : 'font-medium text-sidebar-texto hover:bg-sidebar-hover hover:text-sidebar-texto-forte'
                }`}
              >
                {({ isActive }) => (
                  <>
                    <span className={`h-5 w-1 shrink-0 rounded-[2px] ${isActive ? 'bg-sidebar-indicador' : ''}`} aria-hidden="true" />
                    <Icone className="hidden h-5 w-5 shrink-0 sm:block" aria-hidden="true" />
                    {rotulo}
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function Marca() {
  return (
    <div className="flex min-w-0 items-center gap-3 lg:px-2">
      <Simbolo tamanho={44} variante="escuro" rotulo="Motor de Governança" className="h-9 w-9 lg:h-11 lg:w-11" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[18px] font-bold leading-tight tracking-[-0.02em] text-sidebar-texto-forte">Motor de Governança</p>
        <p className="text-[13px] font-medium leading-tight text-sidebar-texto">Lei do Bem</p>
      </div>
    </div>
  )
}

function OrigemDados({ modo, aoTrocarModo, bloqueado }) {
  return (
    <div role="group" aria-label="Origem dos dados" className="flex rounded-lg border border-sidebar-linha p-1">
      {[
        ['api', 'API real'],
        ['demo', 'Demonstração'],
      ].map(([valor, rotulo]) => (
        <button
          key={valor}
          type="button"
          disabled={bloqueado}
          aria-pressed={modo === valor}
          onClick={() => aoTrocarModo(valor)}
          title={bloqueado ? 'Aguarde a análise em andamento terminar' : undefined}
          className={`flex-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            modo === valor ? 'bg-sidebar-ativo text-sidebar-texto-forte' : 'text-sidebar-texto hover:text-sidebar-texto-forte'
          }`}
        >
          {rotulo}
        </button>
      ))}
    </div>
  )
}

export default function Header({ tema, aoTrocarTema, modo, aoTrocarModo, bloqueado }) {
  const escuro = tema === 'dark'
  return (
    <header className="bg-sidebar lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[280px] lg:overflow-y-auto">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 pt-3 lg:min-h-full lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-9 lg:py-7">
        <Marca />
        <Navegacao />
        {/* No celular os controles ficam à direita do cabeçalho; na barra lateral, no rodapé dela. O DOM segue a ordem visual da barra lateral. */}
        <div className="ml-auto flex items-center gap-2 lg:mt-auto lg:ml-0 lg:flex-col lg:items-stretch lg:gap-3">
          <OrigemDados modo={modo} aoTrocarModo={aoTrocarModo} bloqueado={bloqueado} />
          <button
            type="button"
            onClick={aoTrocarTema}
            aria-label={escuro ? 'Mudar para modo escritório, tema claro' : 'Mudar para modo apresentação, tema escuro'}
            className="flex items-center justify-center gap-2 rounded-lg border border-sidebar-linha p-2 text-sm font-semibold text-sidebar-texto transition-colors hover:bg-sidebar-hover hover:text-sidebar-texto-forte lg:px-3 lg:py-2.5"
          >
            {escuro ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
            <span className="hidden lg:inline">{escuro ? 'Modo escritório' : 'Modo apresentação'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
