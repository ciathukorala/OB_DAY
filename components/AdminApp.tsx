"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatLkr, timeAgo } from "@/lib/format";
import type { Liquor, Order, OrderStatus, PaymentMethod } from "@/lib/types";

type Filter = "active" | "pending" | "delivering" | "delivered" | "closed" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "active", label: "Live" },
  { id: "pending", label: "New" },
  { id: "delivering", label: "Going out" },
  { id: "delivered", label: "At table" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
];

export function AdminApp() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [liquors, setLiquors] = useState<Liquor[]>([]);
  const [storage, setStorage] = useState("file");
  const [filter, setFilter] = useState<Filter>("active");
  const [error, setError] = useState("");
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payAmount, setPayAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const response = await fetch("/api/orders", { cache: "no-store" });
    if (response.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const data = await response.json();
    setOrders(data.orders || []);
    setLiquors(data.liquors || []);
    setStorage(data.storage || "file");
    setReady(true);
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 4000);
    return () => clearInterval(timer);
  }, []);

  const visible = useMemo(() => {
    return orders.filter((order) => {
      if (filter === "all") return true;
      if (filter === "active") {
        return ["pending", "delivering", "delivered"].includes(order.status);
      }
      return order.status === filter;
    });
  }, [orders, filter]);

  const bottlesLeft = liquors.reduce((sum, item) => sum + item.stockRemaining, 0);
  const liveCount = orders.filter((order) =>
    ["pending", "delivering", "delivered"].includes(order.status),
  ).length;
  const revenue = orders
    .filter((order) => order.status === "closed")
    .reduce((sum, order) => sum + (order.paymentAmount || 0), 0);

  async function patch(
    id: string,
    body: {
      status?: OrderStatus;
      paymentMethod?: PaymentMethod | null;
      paymentAmount?: number | null;
    },
  ) {
    setError("");
    setSaving(true);
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed.");
      await refresh();
      setPayOrder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function savePrices() {
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: liquors.map((item) => ({
            id: item.id,
            priceLkr: item.priceLkr,
            stockRemaining: item.stockRemaining,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save stock.");
      setLiquors(data.liquors);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save stock.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (!ready) {
    return (
      <main className="px-4 py-16 text-center text-[#b8a888]">
        Opening the bar desk…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">
            Steward desk
          </p>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-[#f3d27a]">
            OB Day liquor orders
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/qr"
            className="rounded-xl border border-[#d4af37]/30 px-4 py-2 text-sm"
          >
            Table QR codes
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-[#d4af37]/30 px-4 py-2 text-sm"
          >
            Sign out
          </button>
        </div>
      </div>

      {storage === "ephemeral" && (
        <p className="mt-4 rounded-2xl border border-[#e05a4f]/40 bg-[#e05a4f]/10 px-4 py-3 text-sm">
          Orders are on a temporary Vercel disk and can reset. Add a free Neon
          database to keep every request.
        </p>
      )}

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Live requests" value={String(liveCount)} />
        <Stat label="Bottles remaining" value={String(bottlesLeft)} />
        <Stat label="Collected" value={revenue > 0 ? formatLkr(revenue) : "—"} />
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-4 py-2 text-sm ${
              filter === item.id
                ? "bg-[#d4af37] text-[#1a1208]"
                : "border border-[#d4af37]/25"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-[#e05a4f]/40 bg-[#e05a4f]/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-3">
          {visible.length === 0 && (
            <p className="ticket-card rounded-3xl p-8 text-center text-[#b8a888]">
              No orders in this list yet.
            </p>
          )}
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={saving}
              onDeliver={() => patch(order.id, { status: "delivering" })}
              onArrived={() => patch(order.id, { status: "delivered" })}
              onPay={() => {
                const suggested = order.items.reduce(
                  (sum, item) => sum + item.quantity * item.unitPrice,
                  0,
                );
                setPayOrder(order);
                setPayMethod("cash");
                setPayAmount(suggested > 0 ? String(suggested) : "");
              }}
              onCancel={() => patch(order.id, { status: "cancelled" })}
            />
          ))}
        </div>

        <aside className="ticket-card h-fit rounded-3xl p-5">
          <h2 className="font-[family-name:var(--font-cinzel)] text-xl text-[#f3d27a]">
            Cellar
          </h2>
          <p className="mt-1 text-sm text-[#b8a888]">
            Set bottle prices in rupees before service. Stock updates when
            guests order.
          </p>
          <div className="mt-4 space-y-3">
            {liquors.map((item, index) => (
              <div key={item.id} className="grid grid-cols-[1fr_72px_72px] gap-2">
                <div>
                  <p className="text-sm">{item.name}</p>
                  <p className="text-xs text-[#b8a888]">
                    {item.stockRemaining}/{item.stockInitial}
                  </p>
                </div>
                <input
                  inputMode="numeric"
                  value={item.stockRemaining}
                  onChange={(event) => {
                    const next = [...liquors];
                    next[index] = {
                      ...item,
                      stockRemaining: Number(event.target.value || 0),
                    };
                    setLiquors(next);
                  }}
                  className="rounded-xl border border-[#d4af37]/20 bg-black/20 px-2 py-2 text-sm"
                  aria-label={`${item.name} stock`}
                />
                <input
                  inputMode="numeric"
                  value={item.priceLkr || ""}
                  placeholder="Rs"
                  onChange={(event) => {
                    const next = [...liquors];
                    next[index] = {
                      ...item,
                      priceLkr: Number(event.target.value || 0),
                    };
                    setLiquors(next);
                  }}
                  className="rounded-xl border border-[#d4af37]/20 bg-black/20 px-2 py-2 text-sm"
                  aria-label={`${item.name} price`}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={savePrices}
            className="mt-4 w-full rounded-2xl bg-[#d4af37] px-4 py-3 font-semibold text-[#1a1208]"
          >
            Save prices & stock
          </button>
        </aside>
      </section>

      {payOrder && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/70 p-4">
          <div className="ticket-card w-full max-w-md rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">
              Close table {String(payOrder.tableNo).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-2xl text-[#f6edd4]">Collect payment</h3>
            <p className="mt-2 text-sm text-[#b8a888]">
              {payOrder.items
                .map((item) => `${item.quantity} × ${item.name}`)
                .join(", ")}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["cash", "card"] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPayMethod(method)}
                  className={`rounded-2xl px-4 py-3 capitalize ${
                    payMethod === method
                      ? "bg-[#d4af37] text-[#1a1208]"
                      : "border border-[#d4af37]/25"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm text-[#b8a888]">
              Amount (Rs.)
              <input
                inputMode="numeric"
                value={payAmount}
                onChange={(event) => setPayAmount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#d4af37]/25 bg-black/25 px-4 py-3 text-[#f6edd4]"
              />
            </label>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPayOrder(null)}
                className="flex-1 rounded-2xl border border-[#d4af37]/25 px-4 py-3"
              >
                Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  patch(payOrder.id, {
                    status: "closed",
                    paymentMethod: payMethod,
                    paymentAmount: Number(payAmount || 0),
                  })
                }
                className="flex-1 rounded-2xl bg-[#d4af37] px-4 py-3 font-semibold text-[#1a1208]"
              >
                Paid & close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ticket-card rounded-3xl p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-cinzel)] text-3xl text-[#f6edd4]">
        {value}
      </p>
    </div>
  );
}

function OrderCard({
  order,
  busy,
  onDeliver,
  onArrived,
  onPay,
  onCancel,
}: {
  order: Order;
  busy: boolean;
  onDeliver: () => void;
  onArrived: () => void;
  onPay: () => void;
  onCancel: () => void;
}) {
  const tone =
    order.status === "pending"
      ? "border-[#f3d27a]"
      : order.status === "delivering"
        ? "border-[#7dcea0]"
        : order.status === "delivered"
          ? "border-white/40"
          : "border-[#d4af37]/20";

  return (
    <article className={`ticket-card rounded-3xl border p-5 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-cinzel)] text-3xl text-[#f3d27a]">
            Table {String(order.tableNo).padStart(2, "0")}
          </p>
          <p className="text-sm text-[#b8a888]">
            {order.guestName || "Guest"} · {timeAgo(order.createdAt)} · {order.id}
          </p>
        </div>
        <span className="rounded-full border border-[#d4af37]/30 px-3 py-1 text-xs uppercase tracking-[0.16em]">
          {order.status}
        </span>
      </div>
      <ul className="mt-3 space-y-1 text-[#f6edd4]">
        {order.items.map((item) => (
          <li key={item.liquorId}>
            {item.quantity} × {item.name}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {order.status === "pending" && (
          <button
            type="button"
            disabled={busy}
            onClick={onDeliver}
            className="rounded-xl bg-[#d4af37] px-4 py-2 text-sm font-semibold text-[#1a1208]"
          >
            Send to table
          </button>
        )}
        {order.status === "delivering" && (
          <button
            type="button"
            disabled={busy}
            onClick={onArrived}
            className="rounded-xl bg-[#d4af37] px-4 py-2 text-sm font-semibold text-[#1a1208]"
          >
            Mark delivered
          </button>
        )}
        {(order.status === "delivered" || order.status === "delivering") && (
          <button
            type="button"
            disabled={busy}
            onClick={onPay}
            className="rounded-xl border border-[#d4af37]/40 px-4 py-2 text-sm"
          >
            Cash / card & close
          </button>
        )}
        {order.status !== "closed" && order.status !== "cancelled" && (
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm text-[#e05a4f]"
          >
            Cancel
          </button>
        )}
        {order.status === "closed" && (
          <p className="text-sm text-[#7dcea0]">
            Paid {order.paymentMethod}
            {order.paymentAmount ? ` · ${formatLkr(order.paymentAmount)}` : ""}
          </p>
        )}
      </div>
    </article>
  );
}
