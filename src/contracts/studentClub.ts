import {
  createPublicClient,
  getContract,
  http,
  type PublicClient,
  type WalletClient,
  zeroAddress,
} from "viem";
import { sepolia } from "viem/chains";

export const studentClubAddress =
  (import.meta.env.VITE_STUDENT_CLUB_ADDRESS as `0x${string}` | undefined) ??
  zeroAddress;

export const studentClubAddressConfigured = studentClubAddress !== zeroAddress;

export const studentClubAbi = [
  {
    inputs: [],
    name: "AdminOnly",
    type: "error",
  },
  {
    inputs: [],
    name: "BudgetExceeded",
    type: "error",
  },
  {
    inputs: [],
    name: "ClubLeadOnly",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidBudget",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidClub",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidRequestState",
    type: "error",
  },
  {
    inputs: [],
    name: "RequestNotFound",
    type: "error",
  },
  {
    inputs: [],
    name: "StudentInDifferentClub",
    type: "error",
  },
  {
    inputs: [],
    name: "StudentNotRegistered",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "AdminUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "budgetPaise",
        type: "uint256",
      },
    ],
    name: "ClubBudgetUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "lead",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "budgetPaise",
        type: "uint256",
      },
    ],
    name: "ClubCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "lead",
        type: "address",
      },
    ],
    name: "ClubLeadUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "student",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "payoutReference",
        type: "string",
      },
    ],
    name: "ExpenseRequestDisbursed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "string",
        name: "note",
        type: "string",
      },
    ],
    name: "ExpenseRequestReviewed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "student",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountPaise",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "receiptId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "receiptHash",
        type: "string",
      },
    ],
    name: "ExpenseRequestSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "StudentAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "StudentRemoved",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "addStudentToClub",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "address",
        name: "lead",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "budgetPaise",
        type: "uint256",
      },
    ],
    name: "createClub",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "payoutReference",
        type: "string",
      },
    ],
    name: "disburseRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "removeStudentFromClub",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "approve",
        type: "bool",
      },
      {
        internalType: "string",
        name: "note",
        type: "string",
      },
    ],
    name: "reviewRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "budgetPaise",
        type: "uint256",
      },
    ],
    name: "setClubBudget",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "lead",
        type: "address",
      },
    ],
    name: "setClubLead",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountPaise",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "purpose",
        type: "string",
      },
      {
        internalType: "string",
        name: "receiptId",
        type: "string",
      },
      {
        internalType: "string",
        name: "receiptHash",
        type: "string",
      },
    ],
    name: "submitExpenseRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "initialAdmin",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
    ],
    name: "getClub",
    outputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "address",
        name: "lead",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "budgetPaise",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "reservedPaise",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "spentPaise",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "active",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getClubIds",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "requestId",
        type: "uint256",
      },
    ],
    name: "getRequest",
    outputs: [
      {
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountPaise",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "purpose",
        type: "string",
      },
      {
        internalType: "string",
        name: "receiptId",
        type: "string",
      },
      {
        internalType: "string",
        name: "receiptHash",
        type: "string",
      },
      {
        internalType: "uint8",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "string",
        name: "leadNote",
        type: "string",
      },
      {
        internalType: "string",
        name: "payoutReference",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "getStudentProfile",
    outputs: [
      {
        internalType: "uint256",
        name: "clubId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
    ],
    name: "getStudentRequestIds",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "isAdmin",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextClubId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextRequestId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const studentClubPublicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export const studentClubContract = getContract({
  address: studentClubAddress,
  abi: studentClubAbi,
  client: studentClubPublicClient,
});

export function getStudentClubContract(client: PublicClient) {
  return getContract({
    address: studentClubAddress,
    abi: studentClubAbi,
    client,
  });
}

export function getStudentClubWalletContract(walletClient: WalletClient) {
  return getContract({
    address: studentClubAddress,
    abi: studentClubAbi,
    client: {
      public: studentClubPublicClient,
      wallet: walletClient,
    },
  });
}

export async function isAdmin(address: `0x${string}`) {
  return studentClubContract.read.isAdmin([address]);
}
