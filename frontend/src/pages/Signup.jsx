import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/Button";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { getApiErrorMessage } from "../utils/apiError";

export default function Signup() {
  usePageTitle("Signup");
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    password: "",
    target_role: "",
    location: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signup({
        ...form,
        target_role: form.target_role || null,
        location: form.location || null
      });
      navigate("/app", { replace: true });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, "Unable to create your account. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel p-6">
      <div>
        <p className="text-sm font-semibold uppercase text-signal">Start free</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Create your HireMind account</h1>
        <p className="mt-2 text-sm leading-6 text-graphite">Build ATS-ready resumes and generate cover letters with AI guidance.</p>
      </div>

      {error && (
        <div className="mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertCircle size={18} aria-hidden="true" />
          {error}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <FormField
          id="full_name"
          label="Full name"
          name="full_name"
          placeholder="Alex Taylor"
          value={form.full_name}
          onChange={updateField}
          required
        />
        <FormField
          id="email"
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={updateField}
          required
        />
        <FormField
          id="password"
          label="Password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          minLength={8}
          value={form.password}
          onChange={updateField}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="target_role"
            label="Target role"
            name="target_role"
            placeholder="Backend Engineer"
            value={form.target_role}
            onChange={updateField}
          />
          <FormField
            id="location"
            label="Location"
            name="location"
            placeholder="Chicago, IL"
            value={form.location}
            onChange={updateField}
          />
        </div>
        <Button className="w-full" disabled={isSubmitting} type="submit" variant="signal">
          {isSubmitting ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null}
          Create account
          <ArrowRight size={18} aria-hidden="true" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-graphite">
        Already have an account?{" "}
        <Link className="font-semibold text-signal hover:text-blue-700" to="/login">
          Log in
        </Link>
      </p>
    </section>
  );
}
