"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";
import { formatLkr, formatTime } from "@/lib/format";
import type { Order } from "@/lib/types";

const COPY: Record<string, { title: string; detail: string }> = {
  pending: {
    title: "Order received",
    detail: "The bar has your request. A steward will bring it to your table.",
  },
  delivering: {
    title: "On the way",
    detail: "A steward is coming to your table with the bottles.",
  },
  delivered: {
    title: "Delivered",
    detail: "Please settle cash or card with the steward.",
  },
  closed: {
    title: "Paid and closed",
    detail: "Thank you. Enjoy OB Day 2026.",
  },
  cancelled: {
    title: "Cancelled",
    detail: "This request was cancelled. You can place a new order.",
  },
};

export function OrderStatus({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      const data = await response.json();
      if (!active) return;
      if (!response.ok) {
        setError(data.error || "Order not found.");
        return;
      }
      setOrder(data.order);
    }
    load();
    const timer = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orderId]);

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <BrandHeader compact />
        <p className="mt-8 text-[#e05a4f]">{error}</p>
        <Link href="/" className="mt-4 inline-block text-[#d4af37] underline">
          Back to tables
        </Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center text-[#b8a888]">
        Loading your order…
      </main>
    );
  }

  const copy = COPY[order.status];
  const total = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <BrandHeader compact />
      <section className="ticket-card mt-8 rounded-3xl p-6 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">
          Table {String(order.tableNo).padStart(2, "0")}
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-cinzel)] text-3xl text-[#f3d27a]">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm text-[#b8a888]">{copy.detail}</p>
        <p className="mt-4 text-xs tracking-[0.2em] text-[#d4af37]">{order.id}</p>
      </section>

      <ul className="ticket-card mt-4 rounded-3xl p-5">
        {order.items.map((item) => (
          <li
            key={item.liquorId}
            className="flex items-center justify-between border-b border-[#d4af37]/10 py-3 last:border-0"
          >
            <span>
              {item.quantity} × {item.name}
            </span>
            {item.unitPrice > 0 && (
              <span className="text-[#d4af37]">
                {formatLkr(item.quantity * item.unitPrice)}
              </span>
            )}
          </li>
        ))}
        {total > 0 && (
          <li className="flex items-center justify-between pt-3 text-[#f3d27a]">
            <span>Suggested total</span>
            <span>{formatLkr(order.paymentAmount ?? total)}</span>
          </li>
        )}
        <li className="pt-2 text-sm text-[#b8a888]">
          Placed at {formatTime(order.createdAt)}
          {order.paymentMethod ? ` · Paid by ${order.paymentMethod}` : ""}
        </li>
      </ul>

      {order.status === "closed" || order.status === "cancelled" ? (
        <Link
          href={`/t/${order.tableNo}`}
          className="mt-6 block rounded-2xl bg-[#d4af37] px-5 py-4 text-center font-semibold text-[#1a1208]"
        >
          Place another order
        </Link>
      ) : (
        <p className="mt-6 text-center text-sm text-[#b8a888]">
          Keep this page open. Status updates automatically.
        </p>
      )}
    </main>
  );
}
