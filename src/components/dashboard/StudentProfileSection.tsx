type StudentProfileSectionProps = {
  activeClubId: bigint;
  isAdmin: boolean | undefined;
  isRegisteredStudent: boolean;
};

export function StudentProfileSection({
  activeClubId,
  isAdmin,
  isRegisteredStudent,
}: StudentProfileSectionProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
      <h3 className="text-xl font-bold text-slate-950">Student profile</h3>
      <p className="mt-1 text-sm text-slate-500">
        Live `getStudentProfile` read for the connected wallet.
      </p>

      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
          <dt className="text-sm text-slate-500">Registered</dt>
          <dd className="text-sm font-semibold text-slate-950">
            {isRegisteredStudent ? "Yes" : "No"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
          <dt className="text-sm text-slate-500">Club ID</dt>
          <dd className="text-sm font-semibold text-slate-950">
            {activeClubId.toString()}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
          <dt className="text-sm text-slate-500">Admin</dt>
          <dd className="text-sm font-semibold text-slate-950">
            {isAdmin ? "Yes" : "No"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
