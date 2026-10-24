import type { Liquor } from "./types";

export const INITIAL_LIQUORS: Liquor[] = [
  { id: "ascot-dry-gin", name: "Ascot Dry Gin", stockInitial: 24, stockRemaining: 24, priceLkr: 0 },
  { id: "eristoff-vodka", name: "Eristoff Vodka", stockInitial: 12, stockRemaining: 12, priceLkr: 0 },
  { id: "va-black", name: "V & A Black", stockInitial: 36, stockRemaining: 36, priceLkr: 0 },
  { id: "old-reserve", name: "Old Reserve", stockInitial: 24, stockRemaining: 24, priceLkr: 0 },
  { id: "idl-old", name: "IDL Old", stockInitial: 12, stockRemaining: 12, priceLkr: 0 },
  { id: "black-bacardi", name: "Black Bacardi", stockInitial: 12, stockRemaining: 12, priceLkr: 0 },
  { id: "white-bacardi", name: "White Bacardi", stockInitial: 12, stockRemaining: 12, priceLkr: 0 },
];

export const TOTAL_BOTTLES = INITIAL_LIQUORS.reduce(
  (sum, item) => sum + item.stockInitial,
  0,
);
