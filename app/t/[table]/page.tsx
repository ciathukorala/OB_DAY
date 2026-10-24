import { notFound } from "next/navigation";
import { OrderForm } from "@/components/OrderForm";
import { TABLE_COUNT } from "@/lib/types";

export const instant = false;

export function generateStaticParams() {
  return Array.from({ length: TABLE_COUNT }, (_, index) => ({
    table: String(index + 1),
  }));
}

export default async function TableOrderPage(props: PageProps<"/t/[table]">) {
  const { table } = await props.params;
  const tableNo = Number(table);
  if (!Number.isInteger(tableNo) || tableNo < 1 || tableNo > TABLE_COUNT) {
    notFound();
  }
  return <OrderForm tableNo={tableNo} />;
}
