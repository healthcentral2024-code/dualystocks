/**
 * Decorative header background: AI + candlestick-chart stock image,
 * dimmed with a dark overlay so the logo and nav stay readable.
 * Purely decorative — pointer-events disabled, hidden from screen readers.
 */
export function HeaderChart() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
      {/* Scaled down (not cover) so the whole scene reads from "farther away";
          the dark bar shows through at the sides and the fades blend it in. */}
      <img
        src={`${import.meta.env.BASE_URL}header-bg.jpeg`}
        alt=""
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[220%] w-auto max-w-none opacity-50"
        loading="eager"
        decoding="async"
      />
      {/* Dark veil + side fades for text readability */}
      <div className="absolute inset-0 bg-slate-950/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/70" />
    </div>
  );
}
