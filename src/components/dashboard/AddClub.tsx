import { sepolia } from "viem/chains";
import { useState } from "react";
import { useConnection, useWalletClient } from "wagmi";
import {
  getStudentClubWalletContract,
  studentClubAddressConfigured,
} from "../../contracts/studentClub";
import { errorMessage, parseAmountToPaise } from "../../lib/format";

export default function AddClub() {
  const { address, isConnected } = useConnection();
  const { data: walletClient } = useWalletClient();

  const [name, setName] = useState("");
  const [lead, setLead] = useState("");
  const [budget, setBudget] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!studentClubAddressConfigured) {
      setSubmitError("Set VITE_STUDENT_CLUB_ADDRESS before creating a club.");
      return;
    }

    if (!isConnected || !address) {
      setSubmitError("Connect MetaMask first.");
      return;
    }

    if (!walletClient) {
      setSubmitError("Wallet client is not available.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedLead = lead.trim();
    const budgetPaise = parseAmountToPaise(budget);

    if (!trimmedName) {
      setSubmitError("Enter a club name.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedLead)) {
      setSubmitError("Enter a valid lead wallet address.");
      return;
    }

    if (budgetPaise === null || budgetPaise <= 0n) {
      setSubmitError("Enter a valid budget in rupees.");
      return;
    }

    try {
      setIsPending(true);

      const studentClubContract = getStudentClubWalletContract(walletClient);

      await studentClubContract.write.createClub(
        [trimmedName, trimmedLead as `0x${string}`, budgetPaise],
        { account: address, chain: sepolia },
      );

      setName("");
      setLead("");
      setBudget("");
    } catch (error) {
      setSubmitError(errorMessage(error) ?? "Failed to create club.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={add} className="space-y-4">
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Club name"
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
      <input
        type="text"
        value={lead}
        onChange={(event) => setLead(event.target.value)}
        placeholder="Lead wallet address"
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
      <input
        type="text"
        value={budget}
        onChange={(event) => setBudget(event.target.value)}
        placeholder="Budget in rupees"
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
      {submitError ? (
        <p className="text-sm text-red-600">{submitError}</p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Creating..." : "Create Club"}
      </button>
    </form>
  );
}
