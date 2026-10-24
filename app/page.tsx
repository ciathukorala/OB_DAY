import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { TablePicker } from "@/components/TablePicker";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <BrandHeader />
      <div className="gold-line my-8" />
      <TablePicker />
      <p className="mt-8 text-center text-sm text-[#b8a888]">
        Stewards:{" "}
        <Link href="/admin" className="text-[#d4af37] underline">
          open the bar desk
        </Link>
      </p>
    </main>
  );
}
