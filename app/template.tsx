export default function Template({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <style>{`
        html { overflow-x: hidden; }
        .mobile-menu:not(.open) { visibility: hidden; pointer-events: none; }
        .showroom-shell { position: relative; width: 100%; height: 100%; overflow: hidden; }
        .model-loader { position: absolute; inset: 0; z-index: 4; display: grid; place-content: center; justify-items: center; gap: 10px; background: #08090b; opacity: 0; visibility: hidden; transition: opacity .45s ease, visibility .45s ease; }
        .model-loader.visible { opacity: 1; visibility: visible; }
        .model-loader-track { width: min(280px, 58vw); height: 1px; overflow: hidden; background: rgba(255,255,255,.17); }
        .model-loader-track span { display: block; width: 100%; height: 100%; transform-origin: left; background: #a51e25; transition: transform .25s ease; }
        .model-loader p { margin: 8px 0 0; color: #c8cdd2; font-size: 11px; letter-spacing: .13em; }
        .model-loader strong { color: #c5a46d; font-family: var(--font-display); font-size: 25px; font-weight: 500; }
        .model-error { position: absolute; inset: 0; z-index: 5; display: grid; place-content: center; justify-items: center; gap: 18px; background: #08090b; text-align: center; }
        .model-error p { color: #c8cdd2; }
        .model-error button { border: 1px solid rgba(255,255,255,.25); background: #a51e25; color: white; padding: 12px 22px; cursor: pointer; }
        @media (min-width: 981px) {
          .hero-copy { width: min(570px, 43vw); pointer-events: none; }
          .hero-copy a { pointer-events: auto; }
          .hero h1 { font-size: clamp(56px, 6.5vw, 104px); }
        }
        @media (max-width: 700px) {
          .hero-canvas { inset: 155px -75% 125px -20%; }
          .hero-vignette { background: linear-gradient(180deg, rgba(8,9,11,.78), transparent 38%, rgba(8,9,11,.92) 78%), linear-gradient(90deg, rgba(8,9,11,.52), transparent 72%); }
          .availability { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
          .availability label, .availability button { min-width: 0; }
          .final-cta h2 { font-size: clamp(52px, 15vw, 74px); overflow-wrap: anywhere; }
        }
      `}</style>
      {children}
    </>
  );
}
