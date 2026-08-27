import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { adminSchema } from '../validation/user.validation';
import { SuccessFactory, SuccessTypes } from '../utils/successFactory';
/**
 * Updates a user's token credit.
 *
 * The route requires authentication, administrator role, and the existence of
 * the user identified in the URL. The new credit value is validated and saved
 * directly on the User model.
 *
 * @param req - Express request with `req.params.id` and `req.body.newCredit`.
 * @param res - Express response containing the updated user.
 * @param next - Express middleware callback for forwarding errors.
 */
export const updateUserCredits = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params["id"] as string;
  var result = await adminSchema.safeParseAsync(req.body);
  if (!result.success) {
    const errorMessage = result.error.issues.map(issue => issue.message).join(", ");
    return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
  }

  const { newCredit } = result.data;
  try {
    const user = await User.findOne({ where: { id: id } });
    if (!user) {
      throw ErrorFactory.createError(ErrorTypes.NotFound, 'User not found.');
    }

    user.tokenCredit = newCredit;
    await user.save();
    SuccessFactory.createSuccess(SuccessTypes.Updated, `User credit updated successfully.`, user).send(res);
  } 
  catch (error) {
    return next(ErrorFactory.createError(ErrorTypes.InternalServerError, 'Internal server error.'));
  }
};