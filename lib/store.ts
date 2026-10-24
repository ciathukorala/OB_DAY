import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { INITIAL_LIQUORS } from "./catalog";
import { createOrderId } from "./ids";
import type {
  AppState,
  Liquor,
  Order,
  OrderItem,
  PaymentMethod,
} from "./types";
import { TABLE_COUNT } from "./types";

const FILE_NAME = "store.json";

function emptyState(): AppState {
  return {
    version: 1,
    liquors: INITIAL_LIQUORS.map((item) => ({ ...item })),
    orders: [],
  };
}

function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

function filePath() {
  const dir =
    process.env.VERCEL === "1"
      ? path.join("/tmp", "ob-day")
      : path.join(process.cwd(), "data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return path.join(dir, FILE_NAME);
}

let writeLock: Promise<void> = Promise.resolve();

function withFileLock<T>(fn: () => Promise<T>) {
  const run = writeLock.then(fn, fn);
  writeLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function getSql() {
  const url = databaseUrl();
  if (!url) return null;
  return neon(url);
}

async function ensureSqlTable() {
  const sql = getSql();
  if (!sql) return;
  await sql`CREATE TABLE IF NOT EXISTS app_state (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL
  )`;
}

async function loadState(): Promise<AppState> {
  const sql = getSql();
  if (sql) {
    await ensureSqlTable();
    const rows = await sql`SELECT data FROM app_state WHERE id = 'main'`;
    if (!rows[0]) {
      const fresh = emptyState();
      await sql`INSERT INTO app_state (id, data) VALUES ('main', ${JSON.stringify(fresh)}::jsonb)`;
      return fresh;
    }
    return rows[0].data as AppState;
  }

  const file = filePath();
  if (!existsSync(file)) {
    const fresh = emptyState();
    writeFileSync(file, JSON.stringify(fresh, null, 2));
    return fresh;
  }
  return JSON.parse(readFileSync(file, "utf8")) as AppState;
}

async function saveState(next: AppState, expectedVersion: number) {
  const sql = getSql();
  if (sql) {
    await ensureSqlTable();
    const rows = await sql`SELECT data FROM app_state WHERE id = 'main'`;
    const current = rows[0]?.data as AppState | undefined;
    if (current && current.version !== expectedVersion) return false;
    await sql`INSERT INTO app_state (id, data)
      VALUES ('main', ${JSON.stringify(next)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(next)}::jsonb`;
    return true;
  }

  const file = filePath();
  if (existsSync(file)) {
    const current = JSON.parse(readFileSync(file, "utf8")) as AppState;
    if (current.version !== expectedVersion) return false;
  }
  writeFileSync(file, JSON.stringify(next, null, 2));
  return true;
}

async function mutate<T>(fn: (state: AppState) => T): Promise<T> {
  const apply = async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const state = await loadState();
      const version = state.version;
      const result = fn(state);
      state.version = version + 1;
      const saved = await saveState(state, version);
      if (saved) return result;
    }
    throw new Error("The bar is busy. Please try again.");
  };

  if (getSql()) return apply();
  return withFileLock(apply);
}

export function storageMode() {
  if (databaseUrl()) return "neon" as const;
  if (process.env.VERCEL === "1") return "ephemeral" as const;
  return "file" as const;
}

export async function getSnapshot() {
  const state = await loadState();
  return {
    liquors: state.liquors,
    orders: [...state.orders].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    ),
    storage: storageMode(),
  };
}

export async function getPublicCatalog() {
  const state = await loadState();
  return {
    liquors: state.liquors.map((item) => ({
      id: item.id,
      name: item.name,
      stockRemaining: item.stockRemaining,
      stockInitial: item.stockInitial,
      priceLkr: item.priceLkr,
    })),
    storage: storageMode(),
  };
}

export async function createOrder(input: {
  tableNo: number;
  guestName?: string;
  items: { liquorId: string; quantity: number }[];
}) {
  const tableNo = Number(input.tableNo);
  if (!Number.isInteger(tableNo) || tableNo < 1 || tableNo > TABLE_COUNT) {
    throw new Error(`Table number must be between 1 and ${TABLE_COUNT}.`);
  }

  const requested = input.items.filter((item) => item.quantity > 0);
  if (requested.length === 0) {
    throw new Error("Select at least one bottle.");
  }

  return mutate((state) => {
    const lines: OrderItem[] = requested.map((item) => {
      const liquor = state.liquors.find((row) => row.id === item.liquorId);
      if (!liquor) throw new Error("Unknown liquor selected.");
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new Error(`Enter a valid quantity for ${liquor.name}.`);
      }
      if (item.quantity > liquor.stockRemaining) {
        throw new Error(
          `${liquor.name} has only ${liquor.stockRemaining} bottle${liquor.stockRemaining === 1 ? "" : "s"} left.`,
        );
      }
      liquor.stockRemaining -= item.quantity;
      return {
        liquorId: liquor.id,
        name: liquor.name,
        quantity: item.quantity,
        unitPrice: liquor.priceLkr,
      };
    });

    const now = new Date().toISOString();
    const order: Order = {
      id: createOrderId(),
      tableNo,
      guestName: (input.guestName || "").trim().slice(0, 60),
      items: lines,
      status: "pending",
      paymentMethod: null,
      paymentAmount: null,
      createdAt: now,
      updatedAt: now,
      deliveredAt: null,
      closedAt: null,
    };
    state.orders.push(order);
    return order;
  });
}

export async function getOrder(id: string) {
  const state = await loadState();
  return state.orders.find((order) => order.id === id) || null;
}

export async function updateOrder(
  id: string,
  patch: {
    status?: Order["status"];
    paymentMethod?: PaymentMethod | null;
    paymentAmount?: number | null;
  },
) {
  return mutate((state) => {
    const order = state.orders.find((row) => row.id === id);
    if (!order) throw new Error("Order not found.");
    if (order.status === "cancelled") throw new Error("This order was cancelled.");
    if (order.status === "closed" && patch.status && patch.status !== "closed") {
      throw new Error("Closed orders cannot be reopened.");
    }

    if (patch.status === "cancelled") {
      if (order.status === "closed") {
        throw new Error("A paid order cannot be cancelled.");
      }
      for (const item of order.items) {
        const liquor = state.liquors.find((row) => row.id === item.liquorId);
        if (liquor) liquor.stockRemaining += item.quantity;
      }
      order.status = "cancelled";
    } else if (patch.status) {
      order.status = patch.status;
    }

    if (patch.paymentMethod !== undefined) {
      order.paymentMethod = patch.paymentMethod;
    }
    if (patch.paymentAmount !== undefined) {
      if (patch.paymentAmount !== null && patch.paymentAmount < 0) {
        throw new Error("Payment amount cannot be negative.");
      }
      order.paymentAmount = patch.paymentAmount;
    }

    const now = new Date().toISOString();
    order.updatedAt = now;
    if (order.status === "delivered" || order.status === "closed") {
      order.deliveredAt = order.deliveredAt || now;
    }
    if (order.status === "closed") {
      if (!order.paymentMethod) {
        throw new Error("Choose cash or card before closing the order.");
      }
      if (order.paymentAmount === null) {
        const suggested = order.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        );
        order.paymentAmount = suggested;
      }
      order.closedAt = now;
    }
    return order;
  });
}

export async function updateCatalog(
  updates: { id: string; priceLkr?: number; stockRemaining?: number }[],
) {
  return mutate((state) => {
    for (const update of updates) {
      const liquor = state.liquors.find((row) => row.id === update.id);
      if (!liquor) continue;
      if (update.priceLkr !== undefined) {
        if (update.priceLkr < 0) throw new Error("Price cannot be negative.");
        liquor.priceLkr = Math.round(update.priceLkr);
      }
      if (update.stockRemaining !== undefined) {
        if (update.stockRemaining < 0) {
          throw new Error("Stock cannot be negative.");
        }
        liquor.stockRemaining = Math.round(update.stockRemaining);
      }
    }
    return state.liquors;
  });
}

export type { Liquor, Order };
