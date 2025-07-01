import api from "./api";

/**
 * Registers a new user.
 * @param {object} credentials - The user's registration data (firstName, lastName, email, password).
 * @returns {Promise<object>} The response data from the API.
 */
export const register = async (credentials) => {
  try {
    const response = await api.post("/auth/register", credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Logs a user in.
 * @param {object} credentials - The user's login data (email, password).
 * @returns {Promise<object>} The response data from the API (includes user and token).
 */
export const login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Verifies a token
 * @returns {Object} user object
 */
export const verifyToken = async () => {
  const response = await api.get("/auth/verify");
  return response.data.user;
};

/**
 * Logs a user out.
 */
export const logout = () => {
  console.log("Logout function called.");
};
