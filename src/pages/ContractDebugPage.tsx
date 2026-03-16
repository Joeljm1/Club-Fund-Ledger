import { useChainId, useConnection } from "wagmi";
import { ContractDebugSection } from "../components/dashboard/ContractDebugSection";
import { useIsAdmin } from "../hooks/useStudentClubReads";

export function ContractDebugPage() {
  const { address } = useConnection();
  const chainId = useChainId();
  const { data: isAdmin } = useIsAdmin(address);

  return (
    <ContractDebugSection
      address={address}
      chainId={chainId}
      isAdmin={isAdmin}
    />
  );
}
