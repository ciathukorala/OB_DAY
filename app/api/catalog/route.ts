import { connection } from "next/server";
import { getPublicCatalog } from "@/lib/store";

export async function GET() {
  await connection();
  const catalog = await getPublicCatalog();
  return Response.json(catalog);
}
