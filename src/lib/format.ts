import { type BaseError } from "viem";

export function shortAddress(address?: string) {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatPaise(value: bigint) {
  const rupees = Number(value) / 100;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function parseAmountToPaise(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const [rupeesPart, decimalPart = ""] = trimmed.split(".");
  const paisePart = (decimalPart + "00").slice(0, 2);

  return BigInt(rupeesPart) * 100n + BigInt(paisePart);
}

export function requestStatusLabel(status: bigint) {
  switch (status) {
    case 0n:
      return "Submitted";
    case 1n:
      return "Approved";
    case 2n:
      return "Rejected";
    case 3n:
      return "Disbursed";
    default:
      return `Unknown (${status.toString()})`;
  }
}

export function errorMessage(error: unknown) {
  if (!error) {
    return null;
  }

  const baseError = error as BaseError;
  const message = baseError.shortMessage ?? baseError.message;

  return message.replace(/^Error:\s*/, "");
}
