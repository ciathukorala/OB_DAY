"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandHeader } from "@/components/BrandHeader";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Incorrect PIN.");
      setBusy(false);
      return;
    }
    router.replace("/admin");
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <BrandHeader compact />
      <form onSubmit={submit} className="ticket-card mt-8 rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">
          Steward access
        </p>
        <h2 className="mt-2 text-2xl text-[#f6edd4]">Bar desk PIN</h2>
        <input
          type="password"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder="Enter PIN"
          className="mt-5 w-full rounded-2xl border border-[#d4af37]/25 bg-black/25 px-4 py-3 outline-none focus:border-[#f3d27a]"
        />
        {error && <p className="mt-3 text-sm text-[#e05a4f]">{error}</p>}
        <button
          type="submit"
          disabled={busy || !pin}
          className="mt-5 w-full rounded-2xl bg-[#d4af37] px-4 py-3 font-semibold text-[#1a1208] disabled:opacity-40"
        >
          Open desk
        </button>
      </form>
    </main>
  );
}
