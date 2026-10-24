import { isAdminRequest } from "@/lib/auth";
import { storageMode } from "@/lib/store";

export async function GET() {
  const admin = await isAdminRequest();
  return Response.json({ admin, storage: storageMode() });
}
