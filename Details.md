**This document is AI generated**
# Student Club Fund Tracker: Detailed Codebase Walkthrough

This document explains how this project works as a complete system: the React frontend, MetaMask integration, the smart contract, the receipt backend, and the reasoning behind the main implementation decisions.

The project is not just "a frontend for a contract". It is really a 3-part workflow:

1. A React app that decides what the connected wallet is allowed to do.
2. A Solidity contract that stores clubs, student membership, and the lifecycle of expense requests.
3. A small Express + SQLite backend that stores receipt files and returns metadata that the frontend later links back to on-chain records.

## 1. High-Level Overall Flow

The intended business flow is:

1. An admin creates a club, sets its lead, sets its budget, and registers student wallets.
2. A student connected with MetaMask uploads a receipt file and submits an expense request for their club.
3. The file is stored by the backend, and the resulting `receiptId` plus `sha256` hash are written into the contract.
4. The club lead reviews the request and either approves or rejects it.
5. If approved, the contract moves that amount into a reserved state so it cannot be overcommitted.
6. An admin later disburses the request and adds a payout reference.
7. The request becomes final, and the reserved amount becomes spent.

That means the contract is the source of truth for:

- who is an admin
- who leads each club
- which student belongs to which club
- each request's state
- the club's budget, reserved amount, and spent amount

The backend is the source of truth only for receipt files and receipt metadata.

## 2. Project Structure

### Frontend

- `src/main.tsx`: React entry point.
- `src/App.tsx`: wraps the app with Wagmi, React Query, and React Router.
- `src/config.ts`: Wagmi config, chains, connectors, and transports.
- `src/contracts/studentClub.ts`: contract address, ABI, and helpers for read/write contract instances.
- `src/hooks/useStudentClubReads.ts`: all contract read hooks.
- `src/pages/*.tsx`: role-specific pages.
- `src/components/dashboard/*.tsx`: UI for actions, tables, summaries, transaction explorers, and review/disburse modals.

### Smart contract

- `contracts/StudentClubFundTracker.sol`

### Backend

- `server/index.js`: receipt upload API with SQLite and local disk storage.

## 3. Frontend App Flow

### 3.1 Boot sequence

The frontend starts in `src/main.tsx`, which renders `App`.

`src/App.tsx` then sets up:

- `WagmiProvider` for wallet and chain integration
- `QueryClientProvider` for cached async reads via React Query
- `BrowserRouter` for page navigation

This is important because the app relies on two parallel state systems:

- Wagmi for wallet state and blockchain interaction
- React Query for caching on-chain reads and backend receipt fetches

### 3.2 Routing and page model

The app routes are:

- `/`: dashboard
- `/admin`: admin actions
- `/lead`: lead actions
- `/student`: student actions
- `/contract`: connection/debug information

The dashboard is not the only operating screen. It is more like a landing summary page. The actual workflows happen on the role pages.

### 3.3 Role-based UI

The frontend does not hardcode roles locally. It derives them from the contract by reading:

- `isAdmin(address)`
- current clubs and their `lead` address
- `getStudentProfile(address)`

This logic lives in `useUserRoles` inside `src/hooks/useStudentClubReads.ts`.

That hook computes:

- `isAdmin`
- `isLead`
- `leadClubs`
- `activeClubId`
- `isRegisteredStudent`

This role model drives:

- which nav links appear in `HeaderBar`
- whether role pages show action forms or "no access" messages
- which clubs and requests are visible to the connected wallet

This is a good design choice because the UI permissions mirror actual contract state instead of duplicating access rules in frontend config.

## 4. How MetaMask Is Integrated

### 4.1 Wagmi configuration

MetaMask integration is configured in `src/config.ts`.

Key points:

- The app supports `mainnet` and `sepolia`.
- The intended working chain is Sepolia.
- The connector is created with `metaMask(...)`.
- If `VITE_INFURA_API_KEY` exists, the connector is configured with Infura support.

Even though `mainnet` is listed, the transaction flows explicitly require Sepolia before write operations are allowed.

### 4.2 Connect and disconnect flow

`src/components/connectBtn.tsx` handles wallet connect/disconnect.

It uses:

- `useAccount()` to know whether a wallet is connected
- `useConnect()` to get available connectors and call `connect`
- `useDisconnect()` to log out

It specifically searches for the connector named `"MetaMask"`, then calls:

- `connect({ connector: metaMaskConnector })`

Once connected, the component shows the address and a logout button.

### 4.3 How the app knows the active wallet and chain

Across the app, components frequently use:

- `useConnection()` for `address` and `isConnected`
- `useChainId()` for the current chain
- `useWalletClient()` for signed transactions
- `usePublicClient()` for waiting on receipts

This separation matters:

- `walletClient` is used for writes because it can sign transactions through MetaMask.
- `publicClient` is used for reads and waiting for confirmation because it does not require a signature.

### 4.4 Network enforcement

Most write paths explicitly check:

- wallet is connected
- contract address is configured
- wallet client exists
- active chain is Sepolia

If not on Sepolia, the student form can also call `useSwitchChain()` to prompt a network switch.

That is a good UX decision because it prevents avoidable failures before the user signs.

### 4.5 Write transaction pattern

The common write flow is:

1. Validate frontend inputs.
2. Build a wallet-backed contract instance.
3. Call a contract `write.*` method.
4. Wait for confirmation.
5. Invalidate React Query data under `["studentClub"]`.
6. Re-render with fresh contract state.

You can see this pattern in:

- `SubmitExpenseCard`
- `ContractActionForm`
- `ClubEditLayer`
- `DisburseRequestLayer`
- `LeadContractActions`

This is one of the most important frontend patterns in the codebase. The app does not try to manually mutate cached state after a write. Instead, it invalidates and re-reads from the chain, which keeps the UI aligned with the actual contract outcome.

## 5. Contract Integration Layer

`src/contracts/studentClub.ts` is the bridge between the frontend and the contract.

It contains:

- `studentClubAddress` from `VITE_STUDENT_CLUB_ADDRESS`
- `studentClubAddressConfigured` guard
- the full ABI copied into TypeScript
- helper functions for public and wallet contract instances

This file is central because every read hook and every write operation depends on it.

### Why the ABI is embedded directly

This looks like a manual choice instead of a generated-contract workflow.

Likely reasons:

- simple setup
- no Hardhat/Foundry codegen pipeline required
- easy to wire into Vite quickly

Tradeoff:

- the ABI can drift from the Solidity source if someone updates the contract and forgets to update this file

For a student project or demo, this is understandable. For a long-lived production system, generated types would be safer.

## 6. Smart Contract: Data Model and Logic

The contract lives in `contracts/StudentClubFundTracker.sol`.

### 6.1 Core enums and structs

#### `RequestStatus`

States:

- `Submitted`
- `Approved`
- `Rejected`
- `Disbursed`

This is the request state machine. It models a clear approval flow rather than immediate payout.

#### `Club`

Fields:

- `name`
- `lead`
- `budgetPaise`
- `reservedPaise`
- `spentPaise`
- `active`

This struct tracks both current capacity and historical usage.

The split between `reservedPaise` and `spentPaise` is especially important:

- `reservedPaise` means approved but not yet paid
- `spentPaise` means actually disbursed

That allows the system to prevent approving more requests than the budget can cover, even if actual payout happens later.

#### `StudentProfile`

Fields:

- `clubId`
- `isActive`

Each student can only have one active club membership at a time.

#### `ExpenseRequest`

Fields:

- `id`
- `clubId`
- `student`
- `amountPaise`
- `purpose`
- `receiptId`
- `receiptHash`
- `status`
- `leadNote`
- `payoutReference`

This struct captures both the approval workflow and the receipt linkage.

### 6.2 Storage layout

The contract stores:

- `mapping(address => bool) isAdmin`
- `mapping(uint256 => Club) clubs`
- `mapping(address => StudentProfile) studentProfiles`
- `mapping(uint256 => ExpenseRequest) requests`
- `mapping(address => uint256[]) studentRequestIds`
- `uint256[] clubIds`

This layout shows the contract is optimized for straightforward lookup by ID/address rather than complex indexing.

Why this design likely was chosen:

- simple to understand
- cheap enough for small-scale usage
- easy for frontend hooks to query

Tradeoff:

- there is no dedicated "requests by club" index
- the frontend sometimes reconstructs lists by scanning IDs

### 6.3 Constructor and admin control

The constructor takes `initialAdmin` and marks that address as admin.

This creates a single bootstrap authority at deployment time.

`setAdmin(address account, bool approved)` lets existing admins grant or revoke admin rights.

That makes admin membership itself an on-chain permission set, not an off-chain list.

### 6.4 Club management

#### `createClub`

Admin only.

Checks:

- lead is not zero address
- name is not empty
- budget is greater than zero

Effects:

- assigns a new club ID
- stores the club
- pushes the ID into `clubIds`

#### `setClubBudget`

Admin only.

Checks:

- club exists and is active
- new budget is not less than `reserved + spent`

This check is very important. It stops an admin from shrinking a budget below obligations that already exist.

#### `setClubLead`

Admin only.

Allows changing the lead wallet for a club.

### 6.5 Student membership logic

#### `addStudentToClub`

Admin only.

Checks:

- club is active
- student address is valid
- if the student is already active, they cannot belong to a different club

This enforces a one-active-club-per-student rule.

That is likely a business simplification to avoid ambiguous authority and spending permissions.

#### `removeStudentFromClub`

Admin only.

This deactivates the student profile by setting:

- `isActive = false`
- `clubId = 0`

The contract does not delete historical requests. It only removes current membership.

That is a good decision because financial history should remain intact even when membership changes.

### 6.6 Expense submission logic

#### `submitExpenseRequest`

Called by a student wallet directly.

Checks:

- sender is an active student
- sender belongs to the specified club
- club is active
- amount is non-zero
- purpose is not empty
- receipt fields are not empty

Effects:

- creates a new request
- stores receipt metadata references
- marks status as `Submitted`
- appends request ID to `studentRequestIds[msg.sender]`

Important detail:

The contract does not itself verify the receipt hash against file contents. It trusts the frontend/backend path to provide valid metadata. The on-chain role of the hash is integrity reference, not full file verification at submission time.

### 6.7 Lead review logic

#### `reviewRequest`

Called by the club lead.

Checks:

- request exists
- request is still `Submitted`
- caller is the lead of the request's club

Effects:

- stores the lead note
- if approved:
  - checks `reserved + spent + amount <= budget`
  - increments `reservedPaise`
  - sets status to `Approved`
- if rejected:
  - sets status to `Rejected`

This is one of the strongest pieces of logic in the contract.

Why the reservation model matters:

- approval means the request has consumed budget capacity
- actual disbursement may happen later
- another request should not be approvable if it would exceed the remaining budget after approved-but-unpaid items are considered

Without `reservedPaise`, the system could accidentally over-approve pending payouts.

### 6.8 Admin disbursal logic

#### `disburseRequest`

Admin only.

Checks:

- request exists
- request status is `Approved`

Effects:

- subtracts the request amount from `reservedPaise`
- adds the amount to `spentPaise`
- sets status to `Disbursed`
- stores `payoutReference`

This finalizes the request financially.

The separation between lead approval and admin disbursal suggests a deliberate dual-control model:

- lead confirms the expense is valid for the club
- admin confirms the actual payout step

That is a reasonable governance decision for budget management.

### 6.9 Read methods

Read methods include:

- `getClubIds`
- `getClub`
- `getStudentProfile`
- `getStudentRequestIds`
- `getRequest`

These are designed for frontend consumption. They expose enough state for the UI without requiring direct mapping access.

## 7. Request Lifecycle as a State Machine

The real business process can be described as:

1. `Submitted`
   The student created the request. No money is reserved yet.
2. `Approved`
   The lead approved it. The amount now counts toward `reservedPaise`.
3. `Rejected`
   The lead denied it. No reservation is made.
4. `Disbursed`
   Admin completed payout. The amount moves from reserved to spent.

Allowed transitions:

- `Submitted -> Approved`
- `Submitted -> Rejected`
- `Approved -> Disbursed`

Disallowed transitions are prevented by `InvalidRequestState`.

This design is intentionally simple. It avoids partial states, multiple review rounds, and cancellation logic, which reduces both complexity and audit surface.

## 8. How the Frontend Reads Contract State

The main read hooks are in `src/hooks/useStudentClubReads.ts`.

### `useIsAdmin`

Calls `isAdmin(address)`.

### `useClubs`

Flow:

1. Read `getClubIds()`
2. For each ID, call `getClub(clubId)`
3. Map raw tuples into `ClubView`

### `useStudentProfile`

Calls `getStudentProfile(address)` and returns:

- `activeClubId`
- `isRegisteredStudent`

### `useRequests`

For one student:

1. Read `getStudentRequestIds(address)`
2. Read each request with `getRequest(requestId)`
3. Map tuples into `RequestView`

### `useAllRequests`

This one is important.

It reads `nextRequestId`, then builds a synthetic list of every ID from `1` to `nextRequestId - 1`, and reads all requests one by one.

Why this exists:

- the contract has no "all request IDs" array
- admins and leads need broader visibility than student-only request lists

Tradeoff:

- simple implementation
- but it becomes less efficient as request count grows

For a small student-club system, this is acceptable. At larger scale, contract events or a dedicated indexing approach would be better.

## 9. Student Submission Flow in Detail

The student workflow lives mainly in `src/pages/StudentActionsPage.tsx` and `src/components/dashboard/SubmitExpenseCard.tsx`.

Detailed sequence:

1. The page checks whether the wallet is connected and registered as a student.
2. The form pre-fills the student's active club if available.
3. The user enters:
   - club
   - amount
   - purpose
   - receipt file
4. The frontend computes `SHA-256` of the file with `crypto.subtle.digest`.
5. The file is uploaded to `/api/receipts`.
6. The backend stores the file and returns a numeric `id` and the hash.
7. The frontend calls `submitExpenseRequest(clubId, amountPaise, purpose, receiptId, receiptHash)`.
8. The UI waits for confirmation.
9. React Query invalidates relevant queries and re-fetches the latest request list.

This hybrid design is one of the most important architectural choices in the repo:

- large files stay off-chain
- immutable references to those files go on-chain

That is far cheaper than storing file content on-chain, while still preserving a verifiable link.

## 10. Receipt Backend and Why It Exists

The backend in `server/index.js` handles receipt storage.

### What it does

- accepts file uploads with Multer
- stores files on local disk under `server/uploads`
- stores metadata in SQLite under `server/data/receipts.sqlite3`
- serves metadata by ID
- serves uploaded files from `/uploads/...`

### Database schema

Each receipt stores:

- original file name
- stored file name
- MIME type
- file size
- SHA-256 hash
- creation timestamp

### Why the backend is necessary

The contract only stores text fields. It does not store or serve files.

So the backend acts as:

- receipt file store
- receipt metadata lookup service
- bridge between browser file upload and on-chain request references

### Important trust model note

The server currently trusts the frontend-provided SHA-256 string format, but it does not recompute the file hash server-side before storing it.

That means:

- the frontend computes the hash
- the server records that hash
- the contract stores that same hash

This is enough for demos and internal workflows, but a stronger design would recompute the hash on the backend too, to avoid trusting the client for integrity metadata.

## 11. Lead Review Flow

The lead workflow is split across:

- `LeadActionsPage`
- `PendingRequestsTable`
- `ClubTransactionsExplorer`
- `LeadContractActions`

Flow:

1. The app derives which clubs the current wallet leads.
2. It loads all requests.
3. It filters requests to those club IDs.
4. It further filters pending requests (`status === 0n`) for the action table.
5. The lead selects a request.
6. The UI fetches receipt metadata and preview content from the backend.
7. The lead approves or denies and optionally adds a note.
8. The frontend calls `reviewRequest`.
9. On success, cached contract reads are invalidated.

This is a strong example of why the app uses both on-chain and off-chain data:

- request state is on-chain
- the evidence file preview is off-chain

## 12. Admin Flow

The admin workflow is handled by `AdminActionsPage` and `AdminContractActions`.

Admin capabilities include:

- grant/revoke admin rights
- create clubs
- edit club budget
- change club lead
- add students
- remove students
- disburse approved requests

This is intentionally centralized. The contract puts all structural management under admin control.

Why this likely was chosen:

- clearer governance
- easier to reason about
- avoids user-managed self-registration and related abuse cases

## 13. Club and Transaction Exploration

`ClubTransactionsExplorer` is more important than it first appears.

It acts as the main audit-style UI for each club by combining:

- club budget numbers
- transaction counts
- request status
- receipt previews
- lead notes
- payout references

This component is where the system becomes understandable for a real operator, because it brings together:

- contract state
- receipt metadata
- human-readable formatting

In other words, this is the clearest "operational dashboard" in the codebase.

## 14. Formatting and Domain Decisions

### 14.1 Money stored in paise

Amounts are stored in paise, not decimals.

Why:

- Solidity should avoid floating-point concepts
- integer accounting is deterministic
- rupees with two decimal places map naturally to paise

Frontend helpers:

- `parseAmountToPaise` converts input strings into integer paise
- `formatPaise` converts `bigint` values into INR strings

This is the correct design for financial values in smart contracts.

### 14.2 BigInt throughout the frontend

Contract numeric values are handled as `bigint`.

Why:

- blockchain values can exceed normal JS number precision
- Viem/Wagmi already work naturally with `bigint`

### 14.3 Custom Solidity errors

The contract uses custom errors like:

- `AdminOnly`
- `ClubLeadOnly`
- `BudgetExceeded`

Why:

- cheaper than long revert strings
- more structured semantics

The frontend converts thrown errors into shorter readable text with `errorMessage`.

## 15. Important Design Decisions and Why They Make Sense

Below are the main design decisions I can infer from the codebase.

### Decision: split approval and disbursal

Why it makes sense:

- separates business approval from treasury execution
- supports oversight
- allows approved items to wait for actual payout

### Decision: use `reservedPaise`

Why it makes sense:

- prevents over-approval
- models committed-but-not-yet-paid funds
- keeps budget usage honest

This is one of the best choices in the contract.

### Decision: one active club per student

Why it makes sense:

- avoids confusion over who can approve a student's requests
- keeps membership logic simple
- avoids multi-club edge cases

### Decision: keep receipts off-chain

Why it makes sense:

- file storage on-chain is impractical and expensive
- storing only ID + hash keeps the chain record light
- backend can serve previews and downloads efficiently

### Decision: use React Query invalidation after writes

Why it makes sense:

- simpler than local optimistic state synchronization
- safer for contract-driven apps
- avoids stale UI when transactions revert or state changes elsewhere

### Decision: use manual contract reads instead of an indexer

Why it makes sense:

- less infrastructure
- easier for a small app
- enough for modest data volume

Tradeoff:

- `useAllRequests` does not scale indefinitely

## 16. Important Caveats and Limitations

These are not necessarily bugs, but they are important to understand.

### 16.1 Receipt integrity is not fully verified server-side

The backend stores the provided hash but does not recompute it from the uploaded file.

Implication:

- integrity reference exists
- but the server trusts the client to provide the correct hash

### 16.2 `useAllRequests` scales linearly with request count

For every request ID, the frontend performs a separate read.

Implication:

- fine for small usage
- inefficient at higher volume

### 16.3 No event indexing layer

The app mostly reconstructs state from direct reads instead of using events as an index.

Implication:

- simpler stack
- weaker scalability for analytics/history-heavy use

### 16.4 Receipt storage is local

Uploaded files are stored on local disk.

Implication:

- simple for development
- not durable or distributed by default

### 16.5 No on-chain payment transfer

`disburseRequest` records payout reference and accounting state, but the contract does not hold or transfer ETH/tokens.

Implication:

- the contract is a tracker and approval ledger, not a treasury vault
- actual money movement likely happens off-chain

This is a very important conceptual point. The name "Fund Tracker" is accurate. It is not a direct payment contract.

## 17. Small but Important Parts of the Codebase

### `HeaderBar`

This component is more than navigation. It reflects role-derived access and therefore reinforces the contract's authority model in the UI.

### `ContractDebugSection`

This helps users verify:

- wallet
- chain
- contract address
- role context

That is valuable in dapps because many "bugs" are actually wrong network or wrong wallet issues.

### `ClubTransactionsExplorer`

This is effectively the audit console for the project.

### `src/lib/format.ts`

This file is small but essential because it centralizes:

- amount parsing
- amount formatting
- address shortening
- request status labels
- error normalization

That keeps the domain language consistent across the UI.

### `src/components/metamask/lifecycleEvent.tsx`

This component logs connect/disconnect events with `useAccountEffect`, but it does not appear to be wired into the running app.

So it currently looks like exploratory or leftover support code rather than part of the active flow.

## 18. End-to-End Example

To make the whole system concrete, here is one full example:

1. Admin creates "Robotics Club" with a budget of Rs 50,000 and lead wallet `L`.
2. Admin adds student wallet `S` to that club.
3. Student `S` uploads a PDF receipt for Rs 1,250.50.
4. Frontend computes SHA-256 for the PDF.
5. Backend stores the PDF and returns something like:
   - `receiptId = 17`
   - `sha256 = ...`
6. Frontend calls `submitExpenseRequest(clubId, 125050, "Components", "17", "<hash>")`.
7. Contract creates request `#1` with status `Submitted`.
8. Lead `L` reviews request `#1` and approves it.
9. Contract checks that:
   - `reserved + spent + 125050 <= budget`
10. Contract sets request `#1` to `Approved` and adds `125050` to `reservedPaise`.
11. Admin later pays the student off-chain and enters a payout reference like `UTR12345`.
12. Admin calls `disburseRequest(1, "UTR12345")`.
13. Contract moves `125050` from reserved to spent and marks the request `Disbursed`.
14. The UI now shows:
   - receipt preview from backend
   - approved/disbursed history from contract
   - payout reference from contract

That is the full architecture in one path.

## 19. Final Summary

This codebase is best understood as an approval and accounting system for student-club expenses.

The smart contract is responsible for:

- permissions
- club membership
- budget accounting
- request lifecycle

MetaMask is responsible for:

- authenticating the acting wallet
- signing transactions for each role

The backend is responsible for:

- storing receipt files
- returning receipt metadata for preview and audit

The strongest design choices in this project are:

- integer money accounting in paise
- separation of approval from disbursal
- reservation-based budget protection
- role derivation from on-chain state
- off-chain file storage with on-chain references

The main limitations are:

- local receipt storage
- no server-side hash recomputation
- no scalable request indexing layer
- manual ABI maintenance

Even with those limitations, the architecture is coherent and the flow is easy to reason about, which is a strong property for a student blockchain project.
