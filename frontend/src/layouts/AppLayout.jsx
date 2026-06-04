import {
  FileCheck2,
  FileText,
  Layers3,
  LogOut,
  Menu,
  SearchCheck,
  ShieldCheck,
  X
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";

const BROWN  = "#2C1810";
const BORDER = "#E8DDD4";

const navItems = [
  { to: "/app/resume-expert",       label: "Build Resume",  icon: FileText    },
  { to: "/app/ats-score",           label: "ATS Checker",   icon: ShieldCheck },
  { to: "/app/resume-templates",    label: "Templates",     icon: Layers3     },
  { to: "/app/cover-letter-expert", label: "Cover Letter",  icon: FileCheck2  },
  { to: "/app/job-analytics",       label: "JD Match",      icon: SearchCheck },
];

export default function AppLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAF7F2", color: BROWN }}>
      <header
        className="sticky top-0 z-40 px-4 py-3 shadow-sm backdrop-blur-xl md:px-6"
        style={{ background: "#fff", borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">

          {/* Left: logo — text only, no subtitle, no icon */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((o) => !o)}
              className="rounded-lg p-2 transition lg:hidden"
              style={{ color: BROWN }}
              aria-label="Open navigation"
            >
              {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <NavLink to="/" className="text-[22px] font-bold tracking-tight" style={{ color: BROWN }}>
              HireMind AI
            </NavLink>
          </div>

          {/* Center: nav links — text-base, font-medium */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[16.5px] font-semibold transition ${
                    isActive ? "text-white shadow-sm" : "hover:bg-[#FAF7F2]"
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: BROWN, color: "#fff" }
                    : { color: BROWN }
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Pricing + dark mode + Sign in + Get Started */}
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              to="/pricing"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold transition hover:bg-[#FAF7F2] sm:inline-flex"
              style={{ color: BROWN }}
            >
              Pricing
            </Link>
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="hidden rounded-xl border px-4 py-2 text-base font-medium transition-colors hover:bg-[#FAF7F2] sm:inline-flex"
              style={{ borderColor: BORDER, color: BROWN }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate("/app/resume-expert")}
              className="rounded-xl px-4 py-2 text-base font-bold text-white transition-colors hover:bg-[#4A2318]"
              style={{ background: BROWN }}
            >
              Get Started →
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {isMobileNavOpen && (
          <nav
            className="mx-auto mt-3 grid max-w-[1500px] gap-1 border-t pt-3 lg:hidden"
            style={{ borderColor: BORDER }}
          >
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setIsMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition ${
                    isActive ? "text-white" : ""
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { background: BROWN, color: "#fff" } : { color: BROWN }
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => { setIsMobileNavOpen(false); navigate("/login"); }}
                className="rounded-xl border py-2.5 text-base font-medium transition-colors"
                style={{ borderColor: BORDER, color: BROWN }}
              >
                Sign in
              </button>
              <button
                onClick={() => { setIsMobileNavOpen(false); navigate("/app/resume-expert"); }}
                className="rounded-xl py-2.5 text-base font-bold text-white transition-colors hover:bg-[#4A2318]"
                style={{ background: BROWN }}
              >
                Get Started →
              </button>
              {user && (
                <button
                  className="rounded-xl border py-2.5 text-base font-medium transition-colors sm:col-span-2"
                  style={{ borderColor: BORDER, color: BROWN }}
                  onClick={handleLogout}
                >
                  <LogOut size={15} className="mr-2 inline" />
                  Logout
                </button>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="px-4 py-8 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
