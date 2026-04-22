import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Croissant, Loader2, Lock, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BAKERY } from "@/config/bakery";

const AdminLogin = () => {
  const { session, isAdmin, loading, signInWithPhone } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = `Admin login — ${BAKERY.name}`;
  }, []);

  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  if (!loading && session && isAdmin) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedPhone = phone.trim();
    if (!/^\d{6,15}$/.test(trimmedPhone.replace(/\D/g, ""))) {
      setError("Please enter a valid phone number (digits only).");
      return;
    }
    if (password.length < 4) {
      setError("Please enter your password.");
      return;
    }
    setSubmitting(true);
    const { error: err } = await signInWithPhone(trimmedPhone, password);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    navigate(from, { replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-cream px-4 py-12">
      {/* Decorative blurred warm glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/15 blur-3xl"
      />

      <div className="relative w-full max-w-md animate-scale-in">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-warm text-primary-foreground shadow-warm">
            <Croissant className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl font-semibold text-foreground">
            {BAKERY.name}
          </span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="mb-7 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              Admin access
            </span>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to manage your bakery
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground/70"
              >
                Phone number
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="7095658244"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-base text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground/70"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-base text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="animate-fade-in rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:bg-primary-glow hover:shadow-warm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ← <Link to="/" className="underline-offset-4 hover:text-primary hover:underline">Back to storefront</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
