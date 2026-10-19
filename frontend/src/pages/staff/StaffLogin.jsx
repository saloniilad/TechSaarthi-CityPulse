import { useState } from "react";
import { staffLogin } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";


export default function StaffLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await staffLogin({ email, password });
      login(res.data.data.user, res.data.data.accessToken);
      navigate("/staff/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Staff login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">🧑‍🔧</h1>
          <h2 className="text-3xl font-bold text-gray-800">Staff Login</h2>
          <p className="text-gray-600 mt-2">Welcome back, maintenance team member!</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 border border-red-200 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <Link
          to="/forgot-password?type=user"
          className="mt-2 block text-right text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Forgot Password?
        </Link>

        <p className="text-center text-gray-600 mt-6">
          New to the team?{" "}
          <Link
            to="/staff/register"
            className="text-orange-600 hover:text-orange-700 font-semibold"
          >
            Register here
          </Link>
        </p>

        <p className="text-center text-gray-600 mt-4">
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
