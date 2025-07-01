import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import * as authService from "../services/authService";
import api, { setLogoutCallback } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const verifyToken = useCallback(async (tokenToVerify) => {
    try {
      api.defaults.headers.common["Authorization"] = `Bearer ${tokenToVerify}`;

      const userData = await authService.verifyToken();

      setUser(userData);
      setToken(tokenToVerify);
      return true;
    } catch (error) {
      console.error("Token verification failed:", error);

      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
      setToken(null);

      return false;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const storedToken = localStorage.getItem("token");

        if (storedToken) {
          const isValid = await verifyToken(storedToken);
          if (!isValid) {
            console.log("Stored token is invalid, user needs to login again");
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setError("Failed to initialize authentication");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [verifyToken]);

  // sync token with local storage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const register = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await authService.register(credentials);

      // Optionally auto-login after registration
      // setToken(data.token);
      // setUser(data.user);

      return data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Registration failed";
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await authService.login(credentials);

      if (!data.token || !data.user) {
        throw new Error("Invalid login response: missing token or user data");
      }

      setToken(data.token);
      setUser(data.user);

      return data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      setError(errorMessage);

      setToken(null);
      setUser(null);

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      if (token) {
        try {
          await authService.logout();
        } catch (error) {
          console.warn(
            "Server logout failed, proceeding with client logout:",
            error
          );
        }
      }

      setToken(null);
      setUser(null);
      setError(null);

      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
    } catch (error) {
      console.error("Logout error:", error);
      setError("Logout failed");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // send logout event to axios
  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  // Check if user is authenticated
  const isAuthenticated = Boolean(user && token);

  const value = {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    clearError,
    verifyToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Optional: Higher-order component for protected routes
export const withAuth = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>; // Or your loading component
    }

    if (!isAuthenticated) {
      // Redirect to login or show unauthorized message
      return <div>Please login to access this page</div>;
    }

    return <WrappedComponent {...props} />;
  };
};
