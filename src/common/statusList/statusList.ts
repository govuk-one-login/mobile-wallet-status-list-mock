type StatusList = { bits: number; lst: string };
type StatusListConfig = { index: number; valid: string; revoked: string };

const STATUS_LIST_CONFIG: StatusListConfig[] = [
  { index: 0, valid: "eNpzcAEAAMYAhQ", revoked: "eNpzdAEAAMgAhg" },
  { index: 5, valid: "eNqTSwYAAKEAgg", revoked: "eNqTSwcAAKUAhg" },
];

export function getRevokedStatusListByIndex(idx: number): StatusList {
  const entry = STATUS_LIST_CONFIG.find((e) => e.index === idx);
  if (!entry) {
    throw new Error(`No revoked entry found for index ${idx}`);
  }
  return { bits: 2, lst: entry.revoked };
}

export function getValidStatusListWithIndex(): {
  index: number;
  statusList: StatusList;
} {
  const randomEntry =
    STATUS_LIST_CONFIG[Math.floor(Math.random() * STATUS_LIST_CONFIG.length)];
  return {
    index: randomEntry.index,
    statusList: { bits: 2, lst: randomEntry.valid },
  };
}
