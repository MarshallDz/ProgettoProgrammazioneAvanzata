import {Request, Response} from 'express';
import User from '../models/User';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';

// Controller to get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: 'Internal server error.'});
  }
};

// Controller to update user credits (admin only)
export const updateUserCredits = async (req: Request, res: Response) => {
  const {username} = req.params;
  const {crediti} = req.body;

  try {
    const user = await User.findOne({ where: { username: username } });
    if (!user) {
      throw ErrorFactory.createError(ErrorTypes.NotFound, 'User not found.');
    }

    user.crediti = crediti;
    await user.save();

    res.json({message: 'User credits updated successfully.', user});
  } catch (error) {
    console.error(error);
    throw ErrorFactory.createError(ErrorTypes.InternalServerError, 'Internal server error.');
  }
};