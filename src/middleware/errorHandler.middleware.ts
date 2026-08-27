import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errorFactory';

/**
 * Handles application errors and sends a normalized JSON response.
 *
 * Uses the error's status code, error code, and message when available, and
 * falls back to an internal-server-error response for missing values.
 *
 * @param err - Application error containing optional response metadata.
 * @param req - Express request that caused the error.
 * @param res - Express response used to send the error payload.
 * @param next - Express error middleware callback, available for middleware
 * chaining.
 */
export const errorHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        error: {
            statusCode,
            code,
            message,
        },
    });
};