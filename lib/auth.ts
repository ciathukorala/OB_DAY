import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "ob_admin";
const MAX_AGE_SECONDS = 60 * 60 * 16;

function secret() {
  return process.env.ADMIN_SECRET || "ob-day-local-dev-secret-change-me";
}

export function adminPin() {
  return process.env.ADMIN_PIN || "obday2026";
}

function sign(value: string) {
  const hash = createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${hash}`;
}

function verify(token: string) {
  const split = token.lastIndexOf(".");
  if (split <= 0) return false;
  const value = token.slice(0, split);
  const hash = token.slice(split + 1);
  const expected = createHmac("sha256", secret()).update(value).digest("hex");
  const left = Buffer.from(hash);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  if (!timingSafeEqual(left, right)) return false;
  const issued = Number(value.split(":")[1] || 0);
  if (!issued || Date.now() - issued > MAX_AGE_SECONDS * 1000) return false;
  return true;
}

export function createAdminToken() {
  return sign(`admin:${Date.now()}`);
}

export function isAdminToken(token?: string | null) {
  if (!token) return false;
  return verify(token);
}

export async function isAdminRequest() {
  const store = await cookies();
  return isAdminToken(store.get(COOKIE)?.value);
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.VERCEL === "1",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}
