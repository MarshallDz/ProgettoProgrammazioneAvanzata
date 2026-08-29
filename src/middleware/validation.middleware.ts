import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';


/**
 * Express middleware factory to validate `req.body` using a Zod schema.
 *
 * Usage:
 *   router.post('/', validateData(adminSchema), handler)
 *
 * Behavior:
 * - Calls `schema.safeParseAsync(req.body)` and, on success, simply calls
 *   `next()` so the route handler can use the validated `req.body`.
 * - On validation failure it forwards a `ZodError` wrapped by
 *   `ErrorFactory.createError(ErrorTypes.ZodError, message)` to the next
 *   error-handling middleware.
 * - On unexpected errors it forwards a `BadRequest` generic error.
 *
 * Note: this middleware validates only the request body. If you need to
 * validate `req.query` or `req.params`, either adapt this factory or run a
 * separate validation step before the handler.
 *
 * @param schema - Zod schema to validate against (expects an object schema)
 */
/**
 * Express middleware factory to validate a request source using a Zod schema.
 *
 * Usage:
 *   router.post('/', validateData(schema))              // validates req.body
 *   router.get('/', validateData(schema, 'query'))     // validates req.query
 *   router.get('/:id', validateData(schema, 'params')) // validates req.params
 *
 * On success the parsed value replaces the original source (e.g. `req.body`)
 * so downstream handlers receive the typed/parsed data.
 *
 * On validation failure the middleware forwards a Zod error via ErrorFactory.
 *
 * @param schema Zod object schema
 * @param source One of 'body'|'query'|'params' (default: 'body')
 */
export function validateData(schema: z.ZodObject<any, any>, source: 'body' |'query' | 'params' = 'body') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const toValidate = (req as any)[source];
      const result = await schema.safeParseAsync(toValidate);

      if (!result.success) {
        const errorMessage = result.error.issues.map((issue) => issue.message).join(', ');
        return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
      }

      // Replace the original source with the validated data
      (req as any)[source] = result.data;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues.map((issue) => issue.message).join(', ');
        return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
      }

      return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'Internal Server Error'));
    }
  };
}
