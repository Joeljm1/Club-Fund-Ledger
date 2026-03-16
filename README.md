# Student Club Frontend

This frontend connects MetaMask to the deployed `StudentClubFundTracker` contract on Sepolia.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_STUDENT_CLUB_ADDRESS` to the contract address from Remix.
3. Optionally set `VITE_INFURA_API_KEY` if you want the MetaMask connector to use Infura.
4. Install dependencies with `pnpm install`.
5. Start the app with `pnpm dev`.

## Current contract integration

- [src/contracts/studentClub.ts](/home/joeljm/code/ts/blockchain/studentClub/src/contracts/studentClub.ts) contains the full ABI and reads the deployed address from env.
- [src/App.tsx](/home/joeljm/code/ts/blockchain/studentClub/src/App.tsx) reads `getClubIds` and `getClub` and includes a `submitExpenseRequest` form.
- [src/config.ts](/home/joeljm/code/ts/blockchain/studentClub/src/config.ts) configures Wagmi for MetaMask and Sepolia.

## Notes

- The connected wallet must be on Sepolia.
- `submitExpenseRequest` will revert unless the connected wallet is already registered as a student in the selected club.
- Admin-only methods such as `createClub` and `disburseRequest` should be exposed only to approved admin wallets or moved to a backend service.
