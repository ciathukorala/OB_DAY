import { isAdminRequest } from "@/lib/auth";
import { getOrder, updateOrder } from "@/lib/store";

type OrderRouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: OrderRouteContext,
) {
  const { id } = await context.params;
  const order = await getOrder(id);
  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }
  return Response.json({ order });
}

export async function PATCH(
  request: Request,
  context: OrderRouteContext,
) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const order = await updateOrder(id, {
      status: body.status,
      paymentMethod: body.paymentMethod,
      paymentAmount:
        body.paymentAmount === undefined || body.paymentAmount === null
          ? body.paymentAmount
          : Number(body.paymentAmount),
    });
    return Response.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update order.";
    return Response.json({ error: message }, { status: 400 });
  }
}
