import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { Role } from "../types/roles";

dotenv.config();

const public_key = process.env.JWT_PUBLIC_KEY!.replace(/\\n/g, '\n')

/**
 * Authenticates a request using a JWT from the Authorization header.
 *
 * On success, attaches the decoded token payload to `req.user` and passes
 * control to the next middleware. Missing or invalid tokens are forwarded as
 * authentication errors.
 *
 * @param req - Express request containing an Authorization Bearer token.
 * @param res - Express response object.
 * @param next - Express middleware callback for continuing or forwarding errors.
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Accesso negato. Nessun token fornito.')); // Unauthorized
  }
  jwt.verify(token, public_key, { algorithms: ["RS256"] }, (err, decoded) => {
    if (err) {
      return next(ErrorFactory.createError(ErrorTypes.Forbidden, 'Token non valido.')); // Forbidden
    }
    (req as any).user = decoded; // Attach user to request object
    next();
  });
};

/**
 * Authorizes a request for administrator-only resources.
 *
 * Reads the user's role from the JWT payload attached to `req.user`.
 *
 * @param req - Express request containing the authenticated user.
 * @param res - Express response object.
 * @param next - Express middleware callback for continuing the request.
 */
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user.role !== Role.ADMIN) {
    throw ErrorFactory.createError(ErrorTypes.Forbidden, 'Accesso negato. Solo gli amministratori possono accedere a questa risorsa.'); // Forbidden
  }
  next();
};
