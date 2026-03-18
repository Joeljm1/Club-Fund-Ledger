import { useChainId, useConnection } from "wagmi";
import { sepolia } from "wagmi/chains";
import { HeroSection } from "../components/dashboard/HeroSection";
import { SessionCard } from "../components/dashboard/SessionCard";
import { ClubsSection } from "../components/dashboard/ClubsSection";
import { ContractDebugSection } from "../components/dashboard/ContractDebugSection";
import { StudentProfileSection } from "../components/dashboard/StudentProfileSection";
import { RequestsSection } from "../components/dashboard/RequestsSection";
import { studentClubAddressConfigured } from "../contracts/studentClub";
import {
  useClubs,
  useRequests,
  useUserRoles,
} from "../hooks/useStudentClubReads";

export function DashboardPage() {
  const { address, isConnected } = useConnection();
  const chainId = useChainId();

  const { clubs, isLoadingClubIds, isLoadingClubs } = useClubs();
  const { isAdmin, isLead, leadClubs, activeClubId, isRegisteredStudent } =
    useUserRoles(address);
  const { isLoadingRequests, requests } = useRequests(address);
  const networkLabel =
    chainId === sepolia.id
      ? "Sepolia"
      : isConnected
        ? `Chain ${chainId}`
        : "Offline";

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <HeroSection
          clubsCount={clubs.length}
          isAdmin={isAdmin}
          isLead={isLead}
          isRegisteredStudent={isRegisteredStudent}
          activeClubId={activeClubId}
          leadClubs={leadClubs.map((club) => club.name)}
        />
        <SessionCard
          address={address}
          isConnected={isConnected}
          networkLabel={networkLabel}
          txState="Navigate to your role page"
          hash={undefined}
        />
      </div>

      {!studentClubAddressConfigured ? (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          `VITE_STUDENT_CLUB_ADDRESS` is not configured, so contract reads and
          writes are disabled.
        </div>
      ) : null}

      <div className="mt-8">
        <ClubsSection
          clubs={clubs}
          isLoading={isLoadingClubIds || isLoadingClubs}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <StudentProfileSection
          activeClubId={activeClubId}
          isAdmin={isAdmin}
          isRegisteredStudent={isRegisteredStudent}
        />
        <RequestsSection isLoading={isLoadingRequests} requests={requests} />
      </div>

      <ContractDebugSection
        address={address}
        chainId={chainId}
        isAdmin={isAdmin}
      />
    </>
  );
}
