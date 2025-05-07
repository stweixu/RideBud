import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

export default function RegistrationPage() {
  const [displayName, setdisplayName] = useState("");
  const [emailUsername, setEmailUsername] = useState("");
  const [emailDomain, setEmailDomain] = useState("gmail.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const fullEmail = `${emailUsername}@${emailDomain}`;
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          email: fullEmail,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg =
          data.errors?.[0]?.msg || data.message || "Registration failed";
        throw new Error(errorMsg);
      }

      alert("Registration successful");
      setError("");
      setdisplayName("");
      setEmailUsername("");
      setEmailDomain("gmail.com");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>RideBud Register</h2>
        <div style={styles.formGroup}>
          <label htmlFor="username" style={styles.label}>
            Display name:
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setdisplayName(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="email" style={styles.label}>
            Email:
          </label>
          <div style={styles.emailWrapper}>
            <input
              id="email"
              type="text"
              value={emailUsername}
              onChange={(e) => setEmailUsername(e.target.value)}
              required
              style={styles.input}
            />
            <span style={{ marginLeft: "5px" }}> @ </span>
            <select
              name="domain"
              value={emailDomain}
              onChange={(e) => setEmailDomain(e.target.value)}
              style={styles.select}
            >
              <option value="gmail.com">gmail.com</option>
              <option value="outlook.com">outlook.com</option>
              <option value="yahoo.com">yahoo.com</option>
              <option value="hotmail.com">hotmail.com</option>
            </select>
          </div>
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>
            Password:
          </label>
          <div style={styles.passwordWrapper}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.toggleButton}
              tabIndex={-1}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="confirmPassword" style={styles.label}>
            Confirm Password:
          </label>
          <div style={styles.passwordWrapper}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.toggleButton}
              tabIndex={-1}
            >
              <FontAwesomeIcon
                icon={showConfirmPassword ? faEyeSlash : faEye}
              />
            </button>
          </div>
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <div style={styles.submitWrapper}>
          <button type="submit" style={styles.submitButton}>
            Register
          </button>
        </div>
        <div style={styles.loginLink}>
          Already have an account?{" "}
          <Link to="/login" style={styles.loginAnchor}>
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f3f3",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "16px",
    textAlign: "center",
  },
  form: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    width: "35%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formGroup: {
    marginBottom: "16px",
    width: "90%",
    display: "flex",
    flexDirection: "column",
    alignSelf: "center",
  },
  label: {
    display: "block",
    fontSize: "1rem",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px 0px 12px 6px",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "8px",
    alignSelf: "center",
  },
  emailWrapper: {
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  select: {
    padding: "11px 12px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginLeft: "8px", // Space between input and select
    width: "40%", // Adjust width of select dropdown
  },
  passwordWrapper: {
    position: "relative",
    width: "100%",
    alignSelf: "left",
  },
  toggleButton: {
    position: "absolute",
    right: "0%",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "none",
    cursor: "pointer",
    color: "#007bff",
    fontSize: "1.2rem",
  },
  error: {
    color: "#f87171",
    fontSize: "0.875rem",
    textAlign: "center",
  },
  submitWrapper: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    marginTop: "16px",
  },
  submitButton: {
    padding: "12px",
    backgroundColor: "#007bff",
    color: "#fff",
    fontWeight: "bold",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "background-color 0.3s ease",
    width: "50%",
  },
  loginLink: {
    textAlign: "center",
    marginTop: "12px",
    fontSize: "0.9rem",
    color: "#555",
  },
  loginAnchor: {
    color: "#007bff",
    textDecoration: "none",
    fontWeight: "bold",
    marginLeft: "4px",
  },
};
