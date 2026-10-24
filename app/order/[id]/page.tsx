import { OrderStatus } from "@/components/OrderStatus";

export const instant = false;

export default async function OrderPage(props: PageProps<"/order/[id]">) {
  const { id } = await props.params;
  return <OrderStatus orderId={id} />;
}
