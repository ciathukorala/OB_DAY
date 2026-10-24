import Link from "next/link";

type BrandHeaderProps = {
  eyebrow?: string;
  compact?: boolean;
};

export function BrandHeader({
  eyebrow = "Old Boys' Association · Bandaranayake College, Gampaha",
  compact = false,
}: BrandHeaderProps) {
  return (
    <header className={compact ? "text-center" : "text-center pt-2"}>
      <p className="text-[10px] tracking-[0.35em] uppercase text-[#d4af37]">
        {eyebrow}
      </p>
      <Link href="/" className="inline-block mt-2 no-underline">
        <h1
          className={`font-[family-name:var(--font-cinzel)] tracking-[0.18em] text-[#f3d27a] ${
            compact ? "text-3xl" : "text-5xl sm:text-6xl"
          }`}
        >
          OB DAY
        </h1>
        <p
          className={`font-[family-name:var(--font-cinzel)] text-[#d4af37] tracking-[0.5em] ${
            compact ? "text-lg" : "text-2xl"
          }`}
        >
          2026
        </p>
      </Link>
      {!compact && (
        <p className="mt-3 text-sm italic text-[#b8a888]">
          Once a Niyagenza, Always a Niyagenza
        </p>
      )}
    </header>
  );
}
