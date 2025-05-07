import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext"; // Import the useAuth hook

export default function LoginPage() {
  const [form, setForm] = useState({
    emailUsername: "",
    password: "",
    domain: "gmail.com",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const Navigate = useNavigate();
  const { login } = useAuth(); // Access the login function from the auth context

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fullEmail = form.emailUsername + "@" + form.domain; // Combine the email with the selected domain

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fullEmail, password: form.password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      localStorage.setItem("token", data.token);
      login(data.token); // Call the login function from the auth context
      Navigate("/home"); // Redirect to home page after successful login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>RideBud Login</h2>

        <label style={styles.label}>
          Email:
          <div style={styles.emailWrapper}>
            <input
              type="text"
              name="emailUsername"
              value={form.emailUsername}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              style={styles.input}
            />
            <span style={{ marginLeft: "5px" }}> @ </span>
            <select
              name="domain"
              value={form.domain}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="gmail.com">gmail.com</option>
              <option value="outlook.com">outlook.com</option>
              <option value="yahoo.com">yahoo.com</option>
              <option value="hotmail.com">hotmail.com</option>
            </select>
          </div>
        </label>

        <label style={styles.label}>
          Password:
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            style={styles.passwordInput}
          />
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Add the "Register as user" link */}
        <p style={styles.registerLink}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Register here
          </Link>
        </p>
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
  form: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    width: "30%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  title: {
    fontSize: "24px",
    marginBottom: "8px",
    textAlign: "center",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontSize: "14px",
  },
  input: {
    padding: "12px 12px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginTop: "4px",
    width: "70%", // Adjust width of input
  },
  select: {
    padding: "11px 12px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginLeft: "8px", // Space between input and select
    width: "35%", // Adjust width of select dropdown
  },
  emailWrapper: {
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  button: {
    padding: "10px 0",
    marginTop: "16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  passwordInput: {
    padding: "12px 12px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginTop: "4px",
  },
  error: {
    color: "red",
    fontSize: "13px",
    textAlign: "center",
  },
  registerLink: {
    textAlign: "center",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
  },
};
