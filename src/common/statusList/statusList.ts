type StatusList = { bits: number; lst: string };
type StatusListConfig = { index: number; valid: string; revoked: string };

export const STATUS_LIST_CONFIG: StatusListConfig[] = [
  { index: 0, valid: "eNpzcAEAAMYAhQ", revoked: "eNpzdAEAAMgAhg" },
  { index: 5, valid: "eNqTSwYAAKEAgg", revoked: "eNqTSwcAAKUAhg" },
];

export function getStatusListByIndex(
  idx: number,
  statusType: "valid" | "revoked"
): StatusList {
  const entry = STATUS_LIST_CONFIG.find((e) => e.index === idx);
  if (!entry) {
    throw new Error(`No entry found for index ${idx}`);
  }
  const lst = statusType === "valid" ? entry.valid : entry.revoked;
  return { bits: 2, lst };
}