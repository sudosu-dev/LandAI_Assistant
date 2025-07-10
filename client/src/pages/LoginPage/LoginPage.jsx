import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import styles from "./AuthForm.module.css"; // Imports the new shared styles

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, login } = useAuth(); // Correctly destructure login
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      navigate("/chat");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(formData);
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Failed to login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // 👇 This div gets the main container class
    <div className={styles.authContainer}>
      {/* 👇 This form gets the form class */}
      <form className={styles.authForm} onSubmit={handleSubmit}>
        <h2>Login to LandAI</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
        <p className={styles.authSwitch}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
