import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { Role } from "../types/roles";

dotenv.config();

const public_key = process.env.JWT_PUBLIC_KEY!.replace(/\\n/g, '\n')

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

// Middleware to authorize admin users
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user.role !== Role.ADMIN) {
    throw ErrorFactory.createError(ErrorTypes.Forbidden, 'Accesso negato. Solo gli amministratori possono accedere a questa risorsa.'); // Forbidden
  }
  next();
};
