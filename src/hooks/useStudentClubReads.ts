import { useQuery } from "@tanstack/react-query";
import {
  studentClubAddressConfigured,
  studentClubContract,
} from "../contracts/studentClub";
import {
  type ClubResult,
  type ClubView,
  type RequestResult,
  type RequestView,
  type StudentProfileResult,
} from "../types/dashboard";

type LoadedRequest = {
  id: bigint;
  request: RequestResult;
};

async function loadRequests(requestIds: bigint[]) {
  const results = await Promise.allSettled(
    requestIds.map(async (requestId) => ({
      id: requestId,
      request: (await studentClubContract.read.getRequest([requestId])) as RequestResult,
    })),
  );

  return results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
}

function mapRequestView({ id, request }: LoadedRequest): RequestView {
  const [
    clubId,
    student,
    amountPaise,
    purpose,
    receiptId,
    receiptHash,
    status,
    leadNote,
    payoutReference,
  ] = request;

  return {
    id,
    clubId,
    student,
    amountPaise,
    purpose,
    receiptId,
    receiptHash,
    status: BigInt(status),
    leadNote,
    payoutReference,
  };
}

export function useIsAdmin(address?: `0x${string}`) {
  return useQuery({
    queryKey: ["studentClub", "isAdmin", address],
    queryFn: () => studentClubContract.read.isAdmin([address as `0x${string}`]),
    enabled: studentClubAddressConfigured && Boolean(address),
  });
}

export function useClubs() {
  const clubIdsQuery = useQuery({
    queryKey: ["studentClub", "clubIds"],
    queryFn: () => studentClubContract.read.getClubIds(),
    enabled: studentClubAddressConfigured,
  });

  const clubIds = (clubIdsQuery.data as readonly bigint[] | undefined) ?? [];

  const clubsQuery = useQuery({
    queryKey: ["studentClub", "clubs", clubIds.map((clubId) => clubId.toString())],
    queryFn: async () =>
      Promise.all(clubIds.map((clubId) => studentClubContract.read.getClub([clubId]))),
    enabled: studentClubAddressConfigured && clubIds.length > 0,
  });

  const clubs: ClubView[] =
    clubsQuery.data?.map((club, index) => {
      const [name, lead, budgetPaise, reservedPaise, spentPaise, active] =
        club as ClubResult;

      return {
        id: clubIds[index],
        name,
        lead,
        budgetPaise,
        reservedPaise,
        spentPaise,
        active,
      };
    }) ?? [];

  return {
    clubIds,
    clubs,
    isLoadingClubIds: clubIdsQuery.isLoading,
    isLoadingClubs: clubsQuery.isLoading,
    refetchClubIds: clubIdsQuery.refetch,
    refetchClubs: clubsQuery.refetch,
  };
}

export function useUserRoles(address?: `0x${string}`) {
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsAdmin(address);
  const { clubs, isLoadingClubs } = useClubs();
  const {
    activeClubId,
    isRegisteredStudent,
    isLoading: isLoadingStudentProfile,
  } = useStudentProfile(address);

  const leadClubs = address
    ? clubs.filter((club) => club.lead.toLowerCase() === address.toLowerCase())
    : [];

  return {
    isAdmin: Boolean(isAdmin),
    isLead: leadClubs.length > 0,
    leadClubs,
    activeClubId,
    isRegisteredStudent,
    isLoadingRoles: isLoadingAdmin || isLoadingClubs || isLoadingStudentProfile,
  };
}

export function useStudentProfile(address?: `0x${string}`) {
  const query = useQuery({
    queryKey: ["studentClub", "studentProfile", address],
    queryFn: () =>
      studentClubContract.read.getStudentProfile([address as `0x${string}`]),
    enabled: studentClubAddressConfigured && Boolean(address),
  });

  const studentProfile = query.data as StudentProfileResult | undefined;
  const activeClubId = studentProfile?.[0] ?? 0n;
  const isRegisteredStudent = studentProfile?.[1] ?? false;

  return {
    ...query,
    studentProfile,
    activeClubId,
    isRegisteredStudent,
    refetchStudentProfile: query.refetch,
  };
}

export function useRequests(address?: `0x${string}`) {
  const requestIdsQuery = useQuery({
    queryKey: ["studentClub", "requestIds", address],
    queryFn: () =>
      studentClubContract.read.getStudentRequestIds([address as `0x${string}`]),
    enabled: studentClubAddressConfigured && Boolean(address),
  });

  const requestIds = (requestIdsQuery.data as readonly bigint[] | undefined) ?? [];

  const requestsQuery = useQuery({
    queryKey: [
      "studentClub",
      "requests",
      requestIds.map((requestId) => requestId.toString()),
    ],
    queryFn: () => loadRequests([...requestIds]),
    enabled: studentClubAddressConfigured && requestIds.length > 0,
  });

  const requests: RequestView[] = requestsQuery.data?.map(mapRequestView) ?? [];

  return {
    requestIds,
    requests,
    isLoadingRequests: requestsQuery.isLoading,
    refetchRequestIds: requestIdsQuery.refetch,
    refetchRequests: requestsQuery.refetch,
  };
}

export function useAllRequests() {
  const nextRequestIdQuery = useQuery({
    queryKey: ["studentClub", "nextRequestId"],
    queryFn: () => studentClubContract.read.nextRequestId(),
    enabled: studentClubAddressConfigured,
  });

  const nextRequestId = nextRequestIdQuery.data ?? 1n;
  const requestIds =
    nextRequestId > 1n
      ? Array.from({ length: Number(nextRequestId - 1n) }, (_, index) =>
          BigInt(index + 1),
        )
      : [];

  const requestsQuery = useQuery({
    queryKey: [
      "studentClub",
      "allRequests",
      requestIds.map((requestId) => requestId.toString()),
    ],
    queryFn: () => loadRequests(requestIds),
    enabled: studentClubAddressConfigured && requestIds.length > 0,
  });

  const requests: RequestView[] = requestsQuery.data?.map(mapRequestView) ?? [];

  return {
    requests,
    isLoadingRequests: nextRequestIdQuery.isLoading || requestsQuery.isLoading,
    refetchAllRequests: requestsQuery.refetch,
  };
}
