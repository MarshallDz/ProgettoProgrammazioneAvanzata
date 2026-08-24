import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { adminSchema } from '../validation/user.validation';

// Controller to update user credits (admin only)
export const updateUserCredits = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params["id"] as string;
  console.log(id)
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

    res.json({ message: 'User credits updated successfully.', user });
  } catch (error) {
    console.error(error);
    return next(ErrorFactory.createError(ErrorTypes.InternalServerError, 'Internal server error.'));
  }
};