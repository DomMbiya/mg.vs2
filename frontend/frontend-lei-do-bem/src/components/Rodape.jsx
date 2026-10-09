// Rodapé institucional, puramente visual, no fim da área de conteúdo de todas as páginas.
export default function Rodape() {
  return (
    <footer className="flex flex-col items-start gap-x-6 gap-y-2 border-t border-line pt-4 text-[13px] text-ink-soft lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <p>
        <span className="font-semibold text-ink">Equipe Thanos</span>, Hackathon STS 2026, desafio Banco do Nordeste
      </p>
      <p>© 2026 Equipe Thanos. Todos os direitos reservados. Versão 2.0.0</p>
    </footer>
  )
}
