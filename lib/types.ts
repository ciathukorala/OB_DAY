export type OrderStatus =
  | "pending"
  | "delivering"
  | "delivered"
  | "closed"
  | "cancelled";

export type PaymentMethod = "cash" | "card";

export type Liquor = {
  id: string;
  name: string;
  stockInitial: number;
  stockRemaining: number;
  priceLkr: number;
};

export type OrderItem = {
  liquorId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  tableNo: number;
  guestName: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  paymentAmount: number | null;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
  closedAt: string | null;
};

export type AppState = {
  version: number;
  liquors: Liquor[];
  orders: Order[];
};

export const TABLE_COUNT = 50;
