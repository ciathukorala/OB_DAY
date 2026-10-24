import { isAdminRequest } from "@/lib/auth";
import { createOrder, getSnapshot } from "@/lib/store";

export async function GET() {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }
  const snapshot = await getSnapshot();
  return Response.json(snapshot);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = await createOrder({
      tableNo: Number(body.tableNo),
      guestName: body.guestName,
      items: Array.isArray(body.items) ? body.items : [],
    });
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not place order.";
    return Response.json({ error: message }, { status: 400 });
  }
}
