export type ClubResult = readonly [
  string,
  `0x${string}`,
  bigint,
  bigint,
  bigint,
  boolean,
];

export type StudentProfileResult = readonly [bigint, boolean];

export type RequestResult = readonly [
  bigint,
  `0x${string}`,
  bigint,
  string,
  string,
  string,
  number,
  string,
  string,
];

export type ClubView = {
  id: bigint;
  name: string;
  lead: `0x${string}`;
  budgetPaise: bigint;
  reservedPaise: bigint;
  spentPaise: bigint;
  active: boolean;
};

export type RequestView = {
  id: bigint;
  clubId: bigint;
  student: `0x${string}`;
  amountPaise: bigint;
  purpose: string;
  receiptId: string;
  receiptHash: string;
  status: bigint;
  leadNote: string;
  payoutReference: string;
};
