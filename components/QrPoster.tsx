"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { TABLE_COUNT } from "@/lib/types";

type Card = {
  table: number;
  src: string;
};

export function QrPoster() {
  const [cards, setCards] = useState<Card[]>([]);
  const origin = useMemo(
    () => (typeof window === "undefined" ? "" : window.location.origin),
    [],
  );

  useEffect(() => {
    if (!origin) return;
    let active = true;
    async function build() {
      const next = await Promise.all(
        Array.from({ length: TABLE_COUNT }, async (_, index) => {
          const table = index + 1;
          const src = await QRCode.toDataURL(`${origin}/t/${table}`, {
            margin: 1,
            width: 280,
            color: { dark: "#1a1208", light: "#fff8e8" },
          });
          return { table, src };
        }),
      );
      if (active) setCards(next);
    }
    build();
    return () => {
      active = false;
    };
  }, [origin]);

  return (
    <main className="print-sheet mx-auto max-w-6xl px-4 py-6 text-[#f6edd4]">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">
            Print set
          </p>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-[#f3d27a]">
            Table QR codes
          </h1>
          <p className="mt-1 text-sm text-[#b8a888]">
            Print these and place one on each table. Scanning opens that table
            order page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-[#d4af37] px-4 py-2 font-semibold text-[#1a1208]"
        >
          Print
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 print:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.table}
            className="rounded-2xl border border-[#d4af37]/30 bg-[#fff8e8] p-3 text-center text-[#1a1208] print:break-inside-avoid"
          >
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#8a6a1a]">
              OB Day 2026
            </p>
            <p className="font-[family-name:var(--font-cinzel)] text-xl">
              Table {String(card.table).padStart(2, "0")}
            </p>
            <img
              src={card.src}
              alt={`QR for table ${card.table}`}
              className="mx-auto mt-2 h-36 w-36"
            />
            <p className="mt-1 text-[10px] text-[#5c4a28]">Scan to order liquor</p>
          </article>
        ))}
      </div>
    </main>
  );
}
