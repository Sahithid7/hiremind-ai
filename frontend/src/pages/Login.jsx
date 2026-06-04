import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Button from "../components/Button";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { getApiErrorMessage } from "../utils/apiError";

const DEMO_CREDENTIALS = {
  email: "demo@hiremind.ai",
  password: "DemoPass123!"
};

export default function Login() {
  usePageTitle("Login");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await submitLogin(form);
  }

  async function handleDemoLogin() {
    setForm(DEMO_CREDENTIALS);
    await submitLogin(DEMO_CREDENTIALS);
  }

  async function submitLogin(credentials) {
    setError("");
    setIsSubmitting(true);
    try {
      await login(credentials);
      navigate(location.state?.from?.pathname ?? "/app", { replace: true });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Unable to log in. Create an account or use the demo account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel p-6">
      <div>
        <p className="text-sm font-semibold uppercase text-signal">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Log in to HireMind AI</h1>
        <p className="mt-2 text-sm leading-6 text-graphite">Continue improving your resume and tracking your search.</p>
      </div>

      {error && (
        <div className="mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle size={18} aria-hidden="true" />
          {error}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <FormField
          id="email"
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={updateField}
          required
        />
        <FormField
          id="password"
          label="Password"
          name="password"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
          value={form.password}
          onChange={updateField}
          required
        />
        <Button className="w-full" disabled={isSubmitting} type="submit" variant="signal">
          {isSubmitting ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null}
          Log in
          <ArrowRight size={18} aria-hidden="true" />
        </Button>
        <Button className="w-full" disabled={isSubmitting} type="button" variant="outline" onClick={handleDemoLogin}>
          Use demo account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-graphite">
        New here?{" "}
        <Link className="font-semibold text-signal hover:text-blue-700" to="/signup">
          Create an account
        </Link>
      </p>
    </section>
  );
}
