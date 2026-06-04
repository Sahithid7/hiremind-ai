import { BrainCircuit } from "lucide-react";
import { Link } from "react-router-dom";

export default function BrandMark({ to = "/", compact = false, inverse = false }) {
  return (
    <Link to={to} className="flex items-center gap-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-sm ${inverse ? "bg-white text-ink" : "bg-gradient-to-br from-mint to-signal text-white"}`}>
        <BrainCircuit size={22} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={`block text-base font-semibold ${inverse ? "text-white" : "text-ink"}`}>HireMind AI</span>
          <span className={`block text-xs font-medium ${inverse ? "text-slate-300" : "text-graphite"}`}>Career intelligence</span>
        </span>
      )}
    </Link>
  );
}
