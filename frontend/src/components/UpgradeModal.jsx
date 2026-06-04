import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BROWN = "#2C1810";
const GOLD  = "#D4A853";
const CREAM = "#FAF7F2";

export default function UpgradeModal({ isOpen, onClose, featureName = "this feature" }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.70)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: CREAM, borderRadius: "1.5rem", width: "100%", maxWidth: "380px", padding: "2rem", position: "relative", textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "#9A8070" }}
        >
          <X size={20} />
        </button>

        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⭐</div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: BROWN, marginBottom: "0.5rem" }}>Pro Feature</h2>
        <p style={{ fontSize: "0.875rem", color: "#6B4C3B", marginBottom: "1.75rem", lineHeight: 1.65 }}>
          Upgrade to Pro to access <strong>{featureName}</strong>, unlimited downloads, all AI tools, and JD matching.
        </p>

        <button
          onClick={() => { navigate("/pricing"); onClose(); }}
          style={{ width: "100%", padding: "0.9rem", borderRadius: "0.875rem", background: BROWN, color: "#fff", fontSize: "0.95rem", fontWeight: 700, border: "none", cursor: "pointer", marginBottom: "0.75rem" }}
        >
          Upgrade to Pro — $7.99/mo
        </button>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "#9A8070", fontSize: "0.875rem", cursor: "pointer", textDecoration: "underline" }}
        >
          Maybe later
        </button>

        <p style={{ fontSize: "0.72rem", color: "#9A8070", marginTop: "1rem" }}>
          30 days free trial · Cancel anytime · No hidden fees
        </p>
      </div>
    </div>
  );
}
