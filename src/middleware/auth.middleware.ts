import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw ErrorFactory.createError(ErrorTypes.Unauthorized, 'Accesso negato. Nessun token fornito.'); // Unauthorized
  }
    console.log('Token ricevuto:', token); // Log the received token for debugging
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
        if (err) {
            throw ErrorFactory.createError(ErrorTypes.Forbidden, 'Token non valido.'); // Forbidden
        }
    (req as any).user = decoded; // Attach user to request object
    next();
  });
};

// Middleware to authorize admin users
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user.ruolo !== 'admin') {
    throw ErrorFactory.createError(ErrorTypes.Forbidden, 'Accesso negato. Solo gli amministratori possono accedere a questa risorsa.'); // Forbidden
  }
  next();
};

// Altra versione 
export const roleMiddleware = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.ruolo !== requiredRole) {
      throw ErrorFactory.createError(ErrorTypes.Forbidden, 'Accesso negato. Ruolo non autorizzato.'); // Forbidden
    }
    next();
  };
};