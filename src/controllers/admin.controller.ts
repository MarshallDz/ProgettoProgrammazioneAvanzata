import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { adminSchema } from '../validation/user.validation';
import { SuccessFactory, SuccessTypes } from '../utils/successFactory';
import { UserRepository } from '../repositories/UserRepository';
import { toUserResponseDto } from '../DTOs/UserResponseDto';

const userRepository = new UserRepository();
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
  /**
   * Expect body: { newCredit: number }
   */
  const { newCredit } = req.body;
  try {
    const user = await userRepository.getUserById(id);
    if (!user) {
      return next(ErrorFactory.createError(ErrorTypes.NotFound, 'User not found.'));
    }

    await userRepository.updateCredit(id, newCredit);
    const updatedUser = await userRepository.getUserById(id);
    const responseUser = toUserResponseDto(updatedUser!);
    SuccessFactory.createSuccess(SuccessTypes.Updated, `User credit updated successfully.`, responseUser).send(res);
  } 
  catch (error) {
    return next(ErrorFactory.createError(ErrorTypes.InternalServerError, 'Internal server error.'));
  }
};