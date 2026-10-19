
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const API_URL = "http://localhost:3000/api/v1";

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") === "staff" ? "staff" : "user";

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/forgot-password`, 
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, type }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send reset email.");
      }

      setMessage(data.message);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-2xl">
          🔐
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Forgot Password?
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          No worries! Enter your registered email address and
          we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Registered Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {message && (
            <div
              role="status"
              className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
            >
              {message}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending reset link..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-5 text-center">
          <Link
            to={type === "staff" ? "/staff-login" : "/login"}
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
