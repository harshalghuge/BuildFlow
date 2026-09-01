import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Header({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const name = user?.name || "Owner";
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            CM
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900 sm:text-base">
              Construction Manager
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              Material & Billing Management
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              location.pathname === "/"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Home
          </Link>

          <Link
            to="/dashboard"
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              location.pathname === "/dashboard"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Dashboard
          </Link>

          <Link
            to="/materials"
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              location.pathname.startsWith("/materials")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Materials
          </Link>

          <Link
            to="/deliveries"
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              location.pathname.startsWith("/deliveries")
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Deliveries
          </Link>
        </nav>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {initials}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-32 truncate text-sm font-semibold text-slate-900">
                {name}
              </p>
              <p className="text-xs text-slate-500">
                {user?.role || "OWNER"}
              </p>
            </div>

            <svg
              className="h-4 w-4 text-slate-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {user?.email || ""}
                </p>
                <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                  {user?.role || "OWNER"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="flex w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}