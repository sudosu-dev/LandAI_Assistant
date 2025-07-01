import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we're done loading and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#343541",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        Loading application...
      </div>
    );
  }

  return (
    <div className="app-layout">
      <main>
        <Outlet />
      </main>
    </div>
  );
}
