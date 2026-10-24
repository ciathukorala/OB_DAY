import { adminPin, setAdminCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin || "");
  if (pin !== adminPin()) {
    return Response.json({ error: "Incorrect PIN." }, { status: 401 });
  }
  await setAdminCookie();
  return Response.json({ ok: true });
}
