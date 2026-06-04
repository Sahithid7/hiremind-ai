import { Check, Minus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const BROWN  = "#2C1810";
const GOLD   = "#D4A853";
const CREAM  = "#FAF7F2";
const BORDER = "#E8DDD4";
const MUTED  = "#6B4C3B";
const FAINT  = "#9A8070";

const FREE_FEATURES = [
  { text: "Build unlimited resumes",     included: true  },
  { text: "ATS score checker",           included: true  },
  { text: "3 basic templates",           included: true  },
  { text: "Preview your resume",         included: true  },
  { text: "1 PDF download / month",      included: true  },
  { text: "AI bullet improvements",      included: false },
  { text: "JD Match analyzer",           included: false },
  { text: "Cover letter generator",      included: false },
  { text: "All 16 premium templates",    included: false },
];

const PRO_FEATURES = [
  { text: "Everything in Free",          },
  { text: "Unlimited PDF downloads",     },
  { text: "All 16 premium templates",    },
  { text: "AI bullet improvements",      },
  { text: "AI summary rewriter",         },
  { text: "JD Match analyzer",           },
  { text: "Cover letter generator",      },
  { text: "Resume tailoring to JD",      },
  { text: "Priority support",            },
];

const FAQS = [
  {
    q: "Can I try Pro for free?",
    a: "Yes! Every new account gets 30 days of Pro free. No credit card required to start.",
  },
  {
    q: "What happens after my trial?",
    a: "You'll automatically move to the Free plan unless you add a payment method. We'll remind you 3 days before.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel with one click from your account settings. No questions asked, no hidden fees.",
  },
  {
    q: "Is my resume data secure?",
    a: "Yes. Your data is encrypted at rest and in transit. We never sell or share your information.",
  },
];

export default function Pricing() {
  const navigate  = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ background: CREAM, minHeight: "100vh", color: BROWN, fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0.875rem 2rem", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ fontSize: "1.2rem", fontWeight: 800, color: BROWN, textDecoration: "none" }}>
            HireMind AI
          </Link>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <Link to="/app/resume-expert" style={{ color: MUTED, fontSize: "0.875rem", textDecoration: "none", fontWeight: 500 }}>
              Build Resume
            </Link>
            <Link
              to="/login"
              style={{ color: BROWN, fontSize: "0.875rem", fontWeight: 700, textDecoration: "none", padding: "0.5rem 1.1rem", borderRadius: "0.75rem", border: `1px solid ${BORDER}` }}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              style={{ color: "#fff", fontSize: "0.875rem", fontWeight: 700, textDecoration: "none", padding: "0.5rem 1.1rem", borderRadius: "0.75rem", background: BROWN }}
            >
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign: "center", padding: "5rem 1.5rem 3.5rem", maxWidth: "680px", margin: "0 auto" }}>
        <span style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}40`, padding: "0.35rem 1rem", borderRadius: "999px", marginBottom: "1.5rem" }}>
          SIMPLE PRICING
        </span>
        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.25rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: "1.25rem", color: BROWN }}>
          Free to start.<br />Upgrade when ready.
        </h1>
        <p style={{ fontSize: "1.05rem", color: MUTED, lineHeight: 1.75, maxWidth: "520px", margin: "0 auto" }}>
          Build and preview your resume for free. Download and unlock all features for less than a coffee per month.
        </p>
      </section>

      {/* ── Pricing Cards ── */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.5rem", maxWidth: "780px", margin: "0 auto 4rem", padding: "0 1.5rem" }}>

        {/* Free Card */}
        <div style={{ background: "#fff", borderRadius: "1.5rem", padding: "2rem", border: `1px solid ${BORDER}`, boxShadow: "0 2px 12px rgba(44,24,16,0.06)" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: BROWN, marginBottom: "0.3rem" }}>Free</h2>
            <p style={{ fontSize: "0.875rem", color: FAINT }}>Job seekers getting started</p>
          </div>
          <div style={{ marginBottom: "1.75rem" }}>
            <span style={{ fontSize: "3rem", fontWeight: 900, color: BROWN, lineHeight: 1 }}>$0</span>
            <p style={{ fontSize: "0.78rem", color: FAINT, marginTop: "0.35rem" }}>always free · no card required</p>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {FREE_FEATURES.map((f) => (
              <li key={f.text} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", color: f.included ? BROWN : FAINT }}>
                {f.included
                  ? <Check size={15} style={{ color: BROWN, flexShrink: 0 }} />
                  : <Minus size={15} style={{ color: BORDER, flexShrink: 0 }} />}
                {f.text}
                {!f.included && (
                  <span style={{ fontSize: "0.65rem", color: GOLD, marginLeft: "auto", fontWeight: 800, background: `${GOLD}18`, padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                    Pro
                  </span>
                )}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate("/signup")}
            style={{ width: "100%", padding: "0.875rem", borderRadius: "0.875rem", border: `1.5px solid ${BROWN}`, background: "transparent", color: BROWN, fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e => (e.target.style.background = CREAM)}
            onMouseLeave={e => (e.target.style.background = "transparent")}
          >
            Start Free
          </button>
        </div>

        {/* Pro Card */}
        <div style={{ background: BROWN, borderRadius: "1.5rem", padding: "2rem", position: "relative", overflow: "hidden", boxShadow: "0 8px 32px rgba(44,24,16,0.22)" }}>
          {/* Gold accent top bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: GOLD }} />

          <div style={{ position: "absolute", top: "1.1rem", right: "1.1rem", background: "#be123c", color: "#fff", fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em", padding: "0.3rem 0.75rem", borderRadius: "999px" }}>
            MOST POPULAR
          </div>

          <div style={{ marginBottom: "1.5rem", marginTop: "0.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: CREAM, marginBottom: "0.3rem" }}>Pro</h2>
            <p style={{ fontSize: "0.875rem", color: "rgba(250,247,242,0.6)" }}>Serious job seekers</p>
          </div>
          <div style={{ marginBottom: "1.75rem" }}>
            <span style={{ fontSize: "3rem", fontWeight: 900, lineHeight: 1, color: CREAM }}>$7.99</span>
            <p style={{ fontSize: "0.78rem", color: "rgba(250,247,242,0.55)", marginTop: "0.35rem" }}>per month · cancel anytime</p>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {PRO_FEATURES.map((f) => (
              <li key={f.text} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", color: CREAM }}>
                <Check size={15} style={{ color: GOLD, flexShrink: 0 }} />
                {f.text}
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate("/signup")}
            style={{ width: "100%", padding: "0.875rem", borderRadius: "0.875rem", border: "none", background: GOLD, color: BROWN, fontSize: "0.9rem", fontWeight: 800, cursor: "pointer" }}
          >
            Start Free Trial →
          </button>
          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "rgba(250,247,242,0.5)", marginTop: "0.75rem" }}>
            30 days free, then $7.99/month
          </p>
        </div>
      </section>

      {/* ── Trust badges ── */}
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "1.5rem", marginBottom: "5rem", color: MUTED, fontSize: "0.875rem", padding: "0 1.5rem" }}>
        {["Cancel anytime", "No hidden fees", "Instant access", "Secure payment"].map((t) => (
          <span key={t} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Check size={14} style={{ color: GOLD }} /> {t}
          </span>
        ))}
      </div>

      {/* ── FAQ ── */}
      <section style={{ maxWidth: "640px", margin: "0 auto 5rem", padding: "0 1.5rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.75rem", fontWeight: 900, marginBottom: "2rem", color: BROWN }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "1rem", border: `1px solid ${BORDER}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(44,24,16,0.04)" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: "100%", padding: "1.1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", color: BROWN, fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", textAlign: "left", gap: "1rem" }}
              >
                {faq.q}
                <span style={{ fontSize: "1.2rem", flexShrink: 0, color: GOLD, fontWeight: 400 }}>
                  {openFaq === i ? "−" : "+"}
                </span>
              </button>
              {openFaq === i && (
                <div style={{ padding: "0 1.5rem 1.1rem", color: MUTED, fontSize: "0.875rem", lineHeight: 1.75, borderTop: `1px solid ${BORDER}`, paddingTop: "1rem" }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ maxWidth: "680px", margin: "0 auto 5rem", padding: "0 1.5rem" }}>
        <div style={{ background: BROWN, borderRadius: "1.5rem", padding: "2.5rem 2rem", textAlign: "center", boxShadow: "0 8px 32px rgba(44,24,16,0.18)" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: CREAM, marginBottom: "0.75rem" }}>
            Ready to land your next role?
          </h2>
          <p style={{ fontSize: "0.9rem", color: "rgba(250,247,242,0.7)", marginBottom: "1.75rem", lineHeight: 1.65 }}>
            Join thousands of job seekers using HireMind AI to build winning resumes.
          </p>
          <button
            onClick={() => navigate("/signup")}
            style={{ padding: "0.9rem 2.5rem", borderRadius: "0.875rem", border: "none", background: GOLD, color: BROWN, fontSize: "0.95rem", fontWeight: 800, cursor: "pointer" }}
          >
            Get Started Free →
          </button>
          <p style={{ fontSize: "0.75rem", color: "rgba(250,247,242,0.45)", marginTop: "0.75rem" }}>
            No credit card required
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "2rem 1.5rem", textAlign: "center", color: FAINT, fontSize: "0.8rem", background: "#fff" }}>
        <Link to="/" style={{ color: BROWN, fontWeight: 800, textDecoration: "none", display: "block", marginBottom: "0.5rem" }}>
          HireMind AI
        </Link>
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          <span>© 2026 HireMind AI</span>
          <Link to="/pricing" style={{ color: FAINT, textDecoration: "none" }}>Pricing</Link>
          <Link to="/app/resume-expert" style={{ color: FAINT, textDecoration: "none" }}>Build Resume</Link>
          <Link to="/login" style={{ color: FAINT, textDecoration: "none" }}>Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
