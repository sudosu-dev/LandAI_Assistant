import * as authService from "./auth.service.js";

/**
 * Handles new user registration.
 */
export const handleUserRegistration = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, company } = req.body;

    const registrationData = {
      email,
      password_plaintext: password,
      firstName,
      lastName,
      company,
    };

    // FIX: Added 'await' to correctly call the async service function
    const registeredUser = await authService.registerUser(registrationData);

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        userId: registeredUser.id,
        firstName: registeredUser.firstName,
        email: registeredUser.email,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("[AuthController - Register] Error:", error.message);
      if (error.message === "User with this email already exists.") {
        res.status(409).json({ message: error.message });
      } else {
        res.status(500).json({
          message: "User registration failed due to an internal error.",
        });
      }
    } else {
      res.status(500).json({ message: "An unexpected error occurred." });
    }
  }
};

/**
 * Handles user login.
 */
export const handleUserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const loginData = {
      email,
      password_plaintext: password,
    };

    const loginResult = await authService.loginUser(loginData);

    res.status(200).json({
      message: "Login successful!",
      token: loginResult.token,
      user: loginResult.user,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("[AuthController - Login] Error:", error.message);
      if (error.message === "Invalid email or password.") {
        res.status(401).json({ message: "Invalid credentials." });
      } else {
        res
          .status(500)
          .json({ message: "Login failed due to an internal server error." });
      }
    } else {
      res
        .status(500)
        .json({ message: "An unexpected error occurred during login." });
    }
  }
};

/**
 * Handles a request to reset a password.
 */
export const handleRequestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const plainTextToken = await authService.requestPasswordReset(email);

    if (plainTextToken) {
      // In V2, I can use a service like SendGrid or Nodemailer
      // to email the token to the user here.
      console.log(
        `[AuthController - RequestReset] Password reset token for ${email}: ${plainTextToken}`
      );
    }

    res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("[AuthController - RequestReset] Error:", error);
    next(error);
  }
};

/**
 * Handles the actual password reset with a token.
 */
export const handleResetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required." });
    }

    const resetData = {
      token,
      newPassword_plaintext: newPassword,
    };

    await authService.resetPassword(resetData);

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    if (error instanceof Error) {
      console.error("[AuthController-ResetPassword] Error:", error.message);
      if (error.message === "Invalid or expired password reset token.") {
        res.status(400).json({ message: error.message });
      } else {
        next(error); // Pass to a generic error handler
      }
    } else {
      next(error);
    }
  }
};

/**
 * Handles user logout.
 */
export const handleUserLogout = async (req, res, next) => {
  try {
    const result = await authService.logoutUser();
    res.status(200).json({ message: result.message || "Logout successful." });
  } catch (error) {
    console.error("[AuthController - Logout] Error:", error);
    next(error);
  }
};

/**
 * Handles token verification and returns current user data.
 */
export const handleVerifyToken = async (req, res, next) => {
  try {
    const { userId, roleId } = req.user;

    const userData = await authService.getUserById(userId);

    res.status(200).json({
      user: {
        userId: userData.id,
        email: userData.email,
        roleId: userData.roleId,
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
    });
  } catch (error) {
    console.error("[AuthController - VerifyToken] Error:", error);
    res.status(401).json({ message: "Token verification failed" });
  }
};
