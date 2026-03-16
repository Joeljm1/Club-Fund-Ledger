import { NavLink } from "react-router-dom";
import { ConnectButton } from "../connectBtn";
import { shortAddress } from "../../lib/format";
import { useUserRoles } from "../../hooks/useStudentClubReads";

type HeaderBarProps = {
  address?: string;
  networkLabel: string;
};

export function HeaderBar({ address, networkLabel }: HeaderBarProps) {
  const { isAdmin, isLead, isRegisteredStudent } = useUserRoles(
    address as `0x${string}` | undefined,
  );

  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">
            Student Club
          </div>
          <h1 className="text-lg font-bold text-slate-950 sm:text-xl">
            Fund Tracking System
          </h1>
          <div className="mt-3 flex gap-2 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-full px-3 py-1 ${isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`
              }
            >
              Dashboard
            </NavLink>
            {isAdmin ? (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 ${isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`
                }
              >
                Admin
              </NavLink>
            ) : null}
            {isLead ? (
              <NavLink
                to="/lead"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 ${isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`
                }
              >
                Lead
              </NavLink>
            ) : null}
            {isRegisteredStudent ? (
              <NavLink
                to="/student"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 ${isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`
                }
              >
                Student
              </NavLink>
            ) : null}
            <NavLink
              to="/contract"
              className={({ isActive }) =>
                `rounded-full px-3 py-1 ${isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`
              }
            >
              Contract
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-sm text-slate-700 md:flex">
            <span className="font-semibold text-slate-900">{networkLabel}</span>
            <span className="text-slate-400">|</span>
            <span>{shortAddress(address)}</span>
          </div>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
