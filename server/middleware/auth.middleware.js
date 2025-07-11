import jwt from "jsonwebtoken";

/**
 * Middleware to authenticate users by verifying a JWT from the Authorization header.
 * If the token is valid, it decodes the payload and attaches it to `req.user`.
 * If the token is missing or invalid, it sends a 401 or 403 error response.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error(
      "[AuthMiddleware] Server configuration error: JWT_SECRET is not defined."
    );
    res
      .status(500)
      .json({ message: "Authentication configuration error on server." });
    return;
  }

  try {
    const decodedPayload = jwt.verify(token, jwtSecret);

    req.user = {
      userId: decodedPayload.userId,
      roleId: decodedPayload.roleId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Access denied. Token expired." });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ message: "Access denied. Invalid token." });
      return;
    }
    console.error(
      "[AuthMiddleware] Unexpected error during token verification: ",
      error
    );
    res.status(500).json({ message: "Failed to authenticate token." });
    return;
  }
};

/**
 * Middleware to authorize users based on their role.
 * @param allowedRoleIds An array of role IDs that are permitted to access the route.
 */
export const authorizeRoles = (allowedRoleIds) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !user.roleId) {
      res.status(403).json({ message: "Forbidden: User role not identified." });
      return;
    }

    if (allowedRoleIds.includes(user.roleId)) {
      next();
    } else {
      res.status(403).json({
        message:
          "Forbidden: You do not have permission to access this resource.",
      });
      return;
    }
  };
};
