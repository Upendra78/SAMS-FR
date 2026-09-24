import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  faArrowLeft,
  faEnvelope,
  faMobileScreenButton,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [method, setMethod] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleMethodChange(nextMethod) {
    setMethod(nextMethod);
    setIdentifier("");
    setError("");
  }

  function handleIdentifierChange(event) {
    setIdentifier(event.target.value);
    setError("");
  }

  function validateIdentifier() {
    const value = identifier.trim();

    if (!value) {
      setError(
        method === "email"
          ? "Please enter your email address."
          : "Please enter your phone number."
      );
      return false;
    }

    if (method === "email") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(value)) {
        setError("Please enter a valid email address.");
        return false;
      }
    }

    if (method === "phone") {
      const phonePattern = /^[0-9]{10}$/;

      if (!phonePattern.test(value.replace(/\s+/g, ""))) {
        setError("Please enter a valid 10-digit phone number.");
        return false;
      }
    }

    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateIdentifier()) {
      return;
    }

    /*
     * Backend password-reset API is not implemented yet.
     * This loading state is kept ready for the real API integration.
     */
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      navigate("/auth/verify-otp", {
        state: {
          method,
          identifier: identifier.trim(),
        },
      });
    }, 500);
  }

  return (
    <main className="forgot-password-page">
      <section className="forgot-password-card">
        <div className="forgot-password-brand">
          <img
            src="/sams-logo.png"
            alt="SAMS-FR"
            className="forgot-password-logo"
          />

          <div>
            <h1>SAMS-FR</h1>
            <p>Smart Attendance Management System</p>
          </div>
        </div>

        <div className="forgot-password-icon">
          <FontAwesomeIcon icon={faShieldHalved} />
        </div>

        <div className="forgot-password-heading">
          <h2>Forgot Password?</h2>

          <p>
            Recover your account using your registered email
            address or phone number.
          </p>
        </div>

        <form
          className="forgot-password-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="recovery-method">
            <span className="recovery-label">
              Recovery Method
            </span>

            <div className="recovery-options">
              <button
                type="button"
                className={`recovery-option ${
                  method === "email"
                    ? "recovery-option-active"
                    : ""
                }`}
                onClick={() => handleMethodChange("email")}
                disabled={loading}
                aria-pressed={method === "email"}
              >
                <FontAwesomeIcon icon={faEnvelope} />
                <span>Email</span>
              </button>

              <button
                type="button"
                className={`recovery-option ${
                  method === "phone"
                    ? "recovery-option-active"
                    : ""
                }`}
                onClick={() => handleMethodChange("phone")}
                disabled={loading}
                aria-pressed={method === "phone"}
              >
                <FontAwesomeIcon icon={faMobileScreenButton} />
                <span>Phone</span>
              </button>
            </div>
          </div>

          <div className="recovery-field">
            <label htmlFor="recovery-identifier">
              {method === "email"
                ? "Registered Email"
                : "Registered Phone Number"}
            </label>

            <div
              className={`recovery-input-wrapper ${
                error ? "recovery-input-error" : ""
              }`}
            >
              <FontAwesomeIcon
                icon={
                  method === "email"
                    ? faEnvelope
                    : faMobileScreenButton
                }
                className="recovery-input-icon"
              />

              <input
                id="recovery-identifier"
                type={method === "email" ? "email" : "tel"}
                value={identifier}
                onChange={handleIdentifierChange}
                placeholder={
                  method === "email"
                    ? "Enter your registered email"
                    : "Enter your 10-digit phone number"
                }
                disabled={loading}
                autoComplete={
                  method === "email"
                    ? "email"
                    : "tel"
                }
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error ? "recovery-error" : undefined
                }
              />
            </div>

            {error && (
              <p
                id="recovery-error"
                className="recovery-field-error"
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="forgot-password-submit"
            disabled={loading}
          >
            {loading ? "Processing..." : "Send OTP"}
          </button>
        </form>

        <button
          type="button"
          className="forgot-password-back"
          onClick={() => navigate("/auth")}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back to Login</span>
        </button>
      </section>
    </main>
  );
}

export default ForgotPassword;