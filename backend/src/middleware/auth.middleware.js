import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/customErrors.js';

/**
 * Middleware to authenticate requests using JWT Access Tokens
 */
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Access token is missing or invalid');
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_prod';

  try {
    const decoded = jwt.verify(token, jwtSecret);
    
    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new UnauthorizedError('Invalid token payload structure');
    }
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Access token has expired'));
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid access token'));
    } else {
      next(err);
    }
  }
};

/**
 * Middleware to restrict route access to specific roles
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('You do not have permission to access this resource');
    }

    next();
  };
};
