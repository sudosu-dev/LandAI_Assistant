import pool from "#db/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { toCamelCase } from "#utils/object.utils";

/**
 * Logs a user in.
 * @param {object} loginData Object with email and plaintext password values.
 * @returns {object} Object with token and user object values.
 */
export const loginUser = async (loginData) => {
  const { email, password_plaintext } = loginData;
  const normalizedEmail = email.trim().toLowerCase();

  const userQueryResult = await pool.query(
    "SELECT id, email, role_id, password_hash FROM users WHERE email = $1",
    [normalizedEmail]
  );

  if (userQueryResult.rows.length === 0) {
    throw new Error("Invalid email or password.");
  }

  const user = toCamelCase(userQueryResult.rows[0]);

  const passwordMatches = await bcrypt.compare(
    password_plaintext,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password.");
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is not defined in environment variable.");
    throw new Error("Authentication configuration error.");
  }

  const payload = {
    userId: user.id,
    roleId: user.roleId,
  };

  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  return {
    token,
    user: {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    },
  };
};

/**
 * Registers a new user in the database.
 * @param {object} userData Object containing user registration data.
 * @returns {object} The newly created user object.
 */
export const registerUser = async (userData) => {
  const { email, password_plaintext, firstName, lastName, company } = userData;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUserResult = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [normalizedEmail]
  );

  if (existingUserResult.rows.length > 0) {
    throw new Error("User with this email already exists.");
  }

  const roleResult = await pool.query(
    "SELECT id FROM roles WHERE name = 'user'"
  );
  if (roleResult.rows.length === 0) {
    throw new Error("Default user role not found. Please seed the database.");
  }
  const userRoleId = roleResult.rows[0].id;

  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password_plaintext, saltRounds);

  const insertQuery = `
    INSERT INTO users (email, password_hash, first_name, last_name, company, role_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [
    normalizedEmail,
    password_hash,
    firstName,
    lastName,
    company,
    userRoleId,
  ];

  try {
    const newUserResult = await pool.query(insertQuery, values);
    if (newUserResult.rows.length === 0) {
      throw new Error("User registration failed, user not created.");
    }
    return toCamelCase(newUserResult.rows[0]);
  } catch (error) {
    console.error("Error during registration", error);
    throw new Error("Could not register user due to a database error.");
  }
};

/**
 * Handles the server-side logout process.
 * @returns {object} A confirmation message.
 */
export const logoutUser = async () => {
  return { message: "Logout process initiated on server." };
};

/**
 * Generates and stores a password reset token for a user.
 * @param {string} email The user's email address.
 * @returns {string|null} The plaintext reset token, or null if user not found.
 */
export const requestPasswordReset = async (email) => {
  const userQueryResult = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email.trim().toLowerCase()]
  );

  if (userQueryResult.rows.length === 0) {
    console.log(
      `[AuthService - RequestReset] No active user found for email: ${email}`
    );
    return null;
  }

  const userId = userQueryResult.rows[0].id;
  const plaintextToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(plaintextToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  try {
    await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [
      userId,
    ]);

    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [userId, tokenHash, expiresAt]
    );

    console.log(
      `[AuthService - RequestReset] Password reset token generated for user: ${userId}`
    );

    return plaintextToken;
  } catch (error) {
    console.error(
      "[AuthService - RequestReset] Error during token operation",
      error
    );
    throw new Error("Could not process password reset due to a server error.");
  }
};

/**
 * Resets a user's password using a valid reset token.
 * @param {object} resetData Object containing the token and new password.
 * @returns {void}
 */
export const resetPassword = async (resetData) => {
  const { token, newPassword_plaintext } = resetData;

  const incomingTokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const tokenQueryResult = await pool.query(
    "SELECT user_id, expires_at FROM password_reset_tokens WHERE token_hash = $1",
    [incomingTokenHash]
  );

  if (tokenQueryResult.rows.length === 0) {
    console.log(
      "[AuthService - ResetPassword] Invalid or non-existent token hash provided."
    );
    throw new Error("Invalid or expired password reset token.");
  }

  const tokenData = tokenQueryResult.rows[0];
  const userId = tokenData.user_id;
  const expiresAt = new Date(tokenData.expires_at);

  if (expiresAt < new Date()) {
    console.log(
      `[AuthService - ResetPassword] Expired token provided for user_id: ${userId}`
    );
    await pool.query(
      "DELETE FROM password_reset_tokens WHERE token_hash = $1",
      [incomingTokenHash]
    );
    throw new Error("Invalid or expired password reset token.");
  }

  const saltRounds = 10;
  const newPasswordHash = await bcrypt.hash(newPassword_plaintext, saltRounds);

  const updateUserPasswordResult = await pool.query(
    "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [newPasswordHash, userId]
  );

  if (updateUserPasswordResult.rowCount === 0) {
    console.error(
      `[AuthService - ResetPassword] Failed to update the password for user ${userId}. User might not exist or DB issue.`
    );
    throw new Error("Failed to update password.");
  }

  await pool.query("DELETE FROM password_reset_tokens WHERE token_hash = $1", [
    incomingTokenHash,
  ]);

  console.log(
    `[AuthService - ResetPassword] Password successfully reset for user ${userId}`
  );
};
