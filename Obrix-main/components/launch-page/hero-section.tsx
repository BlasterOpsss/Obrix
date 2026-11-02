export function HeroSection() {
  return (
    <section className="relative px-2 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4d4d4]/20 bg-[#d4d4d4]/[0.06] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#d4d4d4]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d4d4d4] shadow-[0_0_10px_#d4d4d4]" />
          Pons V2 · Live on Robinhood Chain
        </div>
        <h1 className="mb-5 text-4xl font-semibold leading-[1.04] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
          Launch with <span className="text-[#d4d4d4]">intent.</span>
        </h1>
        <p className="mx-auto mb-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
          A cleaner way to bring your token on-chain.
        </p>
        <p className="mx-auto max-w-xl text-sm leading-6 text-zinc-600">
          Create through Pons V2’s live factory. Your wallet signs the transaction directly; OXRIZ never takes custody of your funds.
        </p>
      </div>
    </section>
  )
}
