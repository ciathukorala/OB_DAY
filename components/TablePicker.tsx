"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TABLE_COUNT } from "@/lib/types";

export function TablePicker() {
  const router = useRouter();
  const [table, setTable] = useState("");

  return (
    <section className="ticket-card mx-auto mt-8 w-full max-w-xl rounded-3xl p-6">
      <p className="text-center text-xs uppercase tracking-[0.28em] text-[#d4af37]">
        Liquor reservation
      </p>
      <h2 className="mt-2 text-center text-2xl text-[#f6edd4]">
        Choose your table
      </h2>
      <p className="mt-2 text-center text-sm text-[#b8a888]">
        Scan the table QR, or enter the number on your table card.
      </p>

      <form
        className="mt-6 flex gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const value = Number(table);
          if (value >= 1 && value <= TABLE_COUNT) router.push(`/t/${value}`);
        }}
      >
        <input
          inputMode="numeric"
          value={table}
          onChange={(event) => setTable(event.target.value.replace(/\D/g, ""))}
          placeholder="Table 1–50"
          className="w-full rounded-2xl border border-[#d4af37]/30 bg-black/30 px-4 py-3 text-lg outline-none focus:border-[#f3d27a]"
        />
        <button
          type="submit"
          className="rounded-2xl bg-[#d4af37] px-5 py-3 font-semibold text-[#1a1208]"
        >
          Open
        </button>
      </form>

      <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: TABLE_COUNT }, (_, index) => index + 1).map((n) => (
          <Link
            key={n}
            href={`/t/${n}`}
            className="rounded-xl border border-[#d4af37]/20 bg-black/20 py-2 text-center text-sm text-[#f6edd4] hover:border-[#f3d27a] hover:bg-[#d4af37]/15"
          >
            {n}
          </Link>
        ))}
      </div>
    </section>
  );
}
