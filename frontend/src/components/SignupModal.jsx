import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BROWN = "#2C1810";
const GOLD  = "#D4A853";
const CREAM = "#FAF7F2";

const CONTENT = {
  download: {
    headline: "Download Your Resume",
    sub: "Create a free account to download your resume and save your progress.",
    benefits: [
      "1 free PDF download every month",
      "Resume auto-saves to your account",
      "Access from any device, anytime",
    ],
  },
  pro_feature: {
    headline: "Upgrade to Use This Feature",
    sub: "Unlock AI-powered features designed to supercharge your job search.",
    benefits: [
      "30-day free Pro trial",
      "Unlimited AI improvements",
      "All 16 premium templates",
    ],
  },
  save: {
    headline: "Sign Up to Save Your Progress",
    sub: "Create a free account to save your resume and access it anywhere.",
    benefits: [
      "Resume auto-saves securely",
      "Access from any device",
      "Never lose your work",
    ],
  },
};

export default function SignupModal({ isOpen, onClose, reason = "download", featureName = "" }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const content = CONTENT[reason] || CONTENT.download;
  const headline =
    reason === "pro_feature" && featureName
      ? `Sign Up to Use ${featureName}`
      : content.headline;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: CREAM, borderRadius: "1.5rem", width: "100%", maxWidth: "440px", padding: "2rem", position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "#9A8070", padding: "0.25rem", borderRadius: "0.5rem" }}
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <p style={{ fontSize: "1.1rem", fontWeight: 800, color: BROWN, marginBottom: "1.5rem" }}>HireMind AI</p>

        {/* Headline */}
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: BROWN, marginBottom: "0.5rem", lineHeight: 1.3, paddingRight: "2rem" }}>
          {headline}
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#6B4C3B", marginBottom: "1.75rem", lineHeight: 1.65 }}>
          {content.sub}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <button
            onClick={() => { navigate("/signup"); onClose(); }}
            style={{ padding: "0.9rem", borderRadius: "0.875rem", background: BROWN, color: "#fff", fontSize: "0.95rem", fontWeight: 700, border: "none", cursor: "pointer" }}
          >
            🚀 Get Started Free
          </button>
          <button
            onClick={() => { navigate("/login"); onClose(); }}
            style={{ padding: "0.9rem", borderRadius: "0.875rem", background: "transparent", color: BROWN, fontSize: "0.9rem", fontWeight: 600, border: "1px solid #E8DDD4", cursor: "pointer" }}
          >
            Already have an account? Sign in
          </button>
        </div>

        {/* Benefits */}
        <div style={{ borderTop: "1px solid #E8DDD4", paddingTop: "1.25rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9A8070", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            What you get
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {content.benefits.map((b) => (
              <li key={b} style={{ fontSize: "0.875rem", color: "#6B4C3B", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: GOLD, fontWeight: 700 }}>✓</span> {b}
              </li>
            ))}
          </ul>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.72rem", color: "#9A8070", marginTop: "1rem", lineHeight: 1.6 }}>
          ✓ Free to start &nbsp;·&nbsp; ✓ No credit card required &nbsp;·&nbsp; ✓ Your data is safe
        </p>
      </div>
    </div>
  );
}
