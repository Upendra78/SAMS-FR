import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

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
  }

  function validateForm() {
    if (!credentials.role) {
      return "Please select a role.";
    }

    if (!credentials.email.trim()) {
      return "Email is required.";
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
        setMessage("Login succeeded, but the user role was not provided.");
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
    <main>
      <section>
        <h1>SAMS-FR Login</h1>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="role">Role</label>

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

          <div>
            <label htmlFor="email">Email</label>

            <input
              id="email"
              name="email"
              type="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="student@example.com"
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={credentials.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={loading}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={loading}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && <p>{message}</p>}
      </section>
    </main>
  );
}

export default Login;