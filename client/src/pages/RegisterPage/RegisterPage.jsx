import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import styles from "../LoginPage/AuthForm.module.css"; // Imports the shared styles

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth(); // Correctly destructure register
  const navigate = useNavigate();

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
      await register(formData);
      navigate("/login", {
        state: { message: "Registration successful! Please log in" },
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // 👇 This div gets the main container class
    <div className={styles.authContainer}>
      {/* 👇 This form gets the form class */}
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2>Register for LandAI</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="company"
          placeholder="Company (Optional)"
          value={formData.company}
          onChange={handleChange}
        />
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
          {loading ? "Registering..." : "Register"}
        </button>
        <p className={styles.authSwitch}>
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </form>
    </div>
  );
}
