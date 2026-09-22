import DevPortalTester from "../../components/DevPortalTester";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [credentials, setCredentials] = useState({
    role: "STUDENT",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setCredentials((current) => ({
      ...current,
      [name]: value,
    }));

    if (message) {
      setMessage("");
    }
  }

  function validateForm() {
    if (!credentials.role) {
      return "Please select your role.";
    }

    if (!credentials.email.trim()) {
      return "Email address is required.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(credentials.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!credentials.password) {
      return "Password is required.";
    }

    return null;
  }

  function redirectByRole(role) {
    switch (role) {
      case "ADMIN":
        navigate("/admin", { replace: true });
        break;

      case "FACULTY":
        navigate("/faculty", { replace: true });
        break;

      case "STUDENT":
        navigate("/student", { replace: true });
        break;

      default:
        navigate("/unauthorized", { replace: true });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");

    const validationError = validateForm();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);

    try {
      const result = await login({
        role: credentials.role,
        email: credentials.email.trim(),
        password: credentials.password,
      });

      if (!result?.success) {
        setMessage(result?.message || "Login failed.");
        return;
      }

      const authenticatedRole = result?.user?.role;

      if (!authenticatedRole) {
        setMessage(
          "Login succeeded, but the authenticated role was not provided.",
        );
        return;
      }

      redirectByRole(authenticatedRole);
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message ||
        "Authentication service is currently unavailable. Please try again later.";

      setMessage(backendMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-background-shape login-background-shape-one" />
      <div className="login-background-shape login-background-shape-two" />

      <section className="login-card">
        {/* =====================================================
            BRANDING PANEL
           ===================================================== */}

        <aside className="login-brand">
          <div className="brand-glow brand-glow-one" />
          <div className="brand-glow brand-glow-two" />

          <div className="brand-content">
            <div className="brand-mark">
              <span>SF</span>
            </div>

            <div className="brand-title">
              <span>SAMS</span>
              <strong>-FR</strong>
            </div>

            <p className="brand-subtitle">
              Smart Attendance
              <br />
              Management System
            </p>

            <div className="brand-divider" />

            <div className="brand-features">
              <div className="brand-feature">
                <span className="feature-icon">✓</span>
                <span>Secure portal access</span>
              </div>

              <div className="brand-feature">
                <span className="feature-icon">✓</span>
                <span>Real-time attendance</span>
              </div>

              <div className="brand-feature">
                <span className="feature-icon">✓</span>
                <span>Face recognition technology</span>
              </div>
            </div>
          </div>

          <div className="brand-footer">
            Smart • Secure • Automated
          </div>
        </aside>

        {/* =====================================================
            LOGIN PANEL
           ===================================================== */}

        <div className="login-panel">
          <div className="login-header">
            <span className="welcome-label">WELCOME BACK</span>

            <h1>Sign in to SAMS-FR</h1>

            <p>
              Access your attendance management portal securely.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Role */}

            <div className="form-group">
              <label htmlFor="role">Login as</label>

              <div className="input-wrapper">
                <span className="input-icon">◉</span>

                <select
                  id="role"
                  name="role"
                  value={credentials.role}
                  onChange={handleChange}
                  disabled={loading}
                  required
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>
            </div>

            {/* Email */}

            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <div className="input-wrapper">
                <span className="input-icon">@</span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={credentials.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="input-wrapper password-wrapper">
                <span className="input-icon">●</span>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error / Status */}

            {message && (
              <div className="login-message" role="alert">
                <span>!</span>
                <p>{message}</p>
              </div>
            )}

            {/* Submit */}

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? "Signing in..." : "Sign In"}</span>

              {!loading && <span className="submit-arrow">→</span>}
            </button>
          </form>

          <div className="security-note">
            <span className="security-icon">✓</span>

            <div>
              <strong>Secure authentication</strong>
              <p>Your account and attendance data are protected.</p>
            </div>
          </div>

          {/* =====================================================
              DEVELOPMENT-ONLY PORTAL TESTER
             ===================================================== */}

          <DevPortalTester />

          <div className="login-footer">
            © 2026 SAMS-FR · Smart Attendance Management System
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;