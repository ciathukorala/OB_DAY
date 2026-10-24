"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import { formatLkr } from "@/lib/format";

type CatalogItem = {
  id: string;
  name: string;
  stockRemaining: number;
  stockInitial: number;
  priceLkr: number;
};

export function OrderForm({ tableNo }: { tableNo: number }) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await fetch("/api/catalog", { cache: "no-store" });
      const data = await response.json();
      if (active) {
        setCatalog(data.liquors || []);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const selected = useMemo(
    () =>
      catalog
        .map((item) => ({ item, quantity: qty[item.id] || 0 }))
        .filter((row) => row.quantity > 0),
    [catalog, qty],
  );

  const bottles = selected.reduce((sum, row) => sum + row.quantity, 0);
  const total = selected.reduce(
    (sum, row) => sum + row.quantity * row.item.priceLkr,
    0,
  );
  const priced = catalog.some((item) => item.priceLkr > 0);

  function changeQty(id: string, next: number, max: number) {
    setQty((current) => ({
      ...current,
      [id]: Math.max(0, Math.min(max, next)),
    }));
  }

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNo,
          guestName,
          items: selected.map((row) => ({
            liquorId: row.item.id,
            quantity: row.quantity,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not place order.");
      router.push(`/order/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <BrandHeader compact />
      <div className="gold-line my-6" />

      <section className="ticket-card rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">
              Table
            </p>
            <p className="font-[family-name:var(--font-cinzel)] text-4xl text-[#f3d27a]">
              {String(tableNo).padStart(2, "0")}
            </p>
          </div>
          <Link href="/" className="text-sm text-[#b8a888] underline">
            Change table
          </Link>
        </div>
        <p className="mt-3 text-sm text-[#b8a888]">
          Choose the bottles you want. A steward will bring them to this table
          and collect cash or card.
        </p>
      </section>

      <label className="mt-5 block">
        <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#d4af37]">
          Your name (optional)
        </span>
        <input
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
          placeholder="Name for the steward"
          className="w-full rounded-2xl border border-[#d4af37]/25 bg-black/25 px-4 py-3 outline-none focus:border-[#f3d27a]"
        />
      </label>

      <div className="mt-6 space-y-3 pb-28">
        {loading && (
          <p className="text-center text-sm text-[#b8a888]">Loading cellar…</p>
        )}
        {catalog.map((item) => {
          const value = qty[item.id] || 0;
          const soldOut = item.stockRemaining === 0;
          return (
            <article
              key={item.id}
              className={`ticket-card rounded-2xl p-4 ${soldOut ? "opacity-45" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg text-[#f6edd4]">{item.name}</h2>
                  <p className="text-sm text-[#b8a888]">
                    {item.stockRemaining} of {item.stockInitial} left
                    {item.priceLkr > 0 ? ` · ${formatLkr(item.priceLkr)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={soldOut || value === 0}
                    onClick={() => changeQty(item.id, value - 1, item.stockRemaining)}
                    className="h-10 w-10 rounded-full border border-[#d4af37]/30 text-xl disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-lg">{value}</span>
                  <button
                    type="button"
                    disabled={soldOut || value >= item.stockRemaining}
                    onClick={() => changeQty(item.id, value + 1, item.stockRemaining)}
                    className="h-10 w-10 rounded-full border border-[#d4af37]/30 text-xl disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-[#e05a4f]/40 bg-[#e05a4f]/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="sticky bottom-4 mt-6">
        <button
          type="button"
          disabled={bottles === 0 || submitting}
          onClick={submit}
          className="w-full rounded-2xl bg-[#d4af37] px-5 py-4 text-lg font-semibold text-[#1a1208] disabled:opacity-40"
        >
          {submitting
            ? "Sending to the bar…"
            : bottles === 0
              ? "Select bottles to order"
              : `Request ${bottles} bottle${bottles === 1 ? "" : "s"}${priced && total > 0 ? ` · ${formatLkr(total)}` : ""}`}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-[#b8a888]">
        For OB Day guests aged 21 and over. Liquor is sold separately from the
        dinner coupon.
      </p>
    </main>
  );
}
