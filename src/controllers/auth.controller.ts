import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authSchema } from "../validation/user.validation";
import { Request, Response, NextFunction } from "express";
import { ErrorFactory, ErrorTypes } from "../utils/errorFactory";
import { z } from "zod";
import { SuccessFactory, SuccessTypes } from "../utils/successFactory";
import dotenv from "dotenv";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { toUserResponseDto } from "../DTOs/UserResponseDto";

dotenv.config();

const private_key = process.env.JWT_PRIVATE_KEY!.replace(/\\n/g, '\n');


export class UserController {
    constructor(private userRepository: IUserRepository) { }

  /**
   * Registers a new user.
   *
   * Validates the username and password, checks that the username is not already
   * in use, hashes the password, and saves the new user to the database.
   *
   * @param req - Express request with `req.body.username` and `req.body.password`.
   * @param res - Express response containing the created user.
   * @param next - Express middleware callback for forwarding validation errors.
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request body
      var result = await authSchema.safeParseAsync(req.body);
      if (!result.success) {
        const errorMessage = result.error.issues.map(issue => issue.message).join(", ");
        return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
      }

      const { username, password } = result.data;
      // Check if the user already exists
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists." });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user
      const newUser = await this.userRepository.createUser(username, hashedPassword);

      SuccessFactory.createSuccess(SuccessTypes.Created, `User registered successfully.`, toUserResponseDto(newUser)).send(res);
    } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues.map(issue => issue.message).join(", ");
        throw ErrorFactory.createError(ErrorTypes.ZodError, errorMessage);
      }
      return next(ErrorFactory.createError(ErrorTypes.InternalServerError, "Internal server error."));
    }
  };

  /**
   * Authenticates a user and generates a JWT.
   *
   * Validates the credentials, finds the user by username, compares the hashed
   * password, and returns a token valid for one hour.
   *
   * @param req - Express request with `req.body.username` and `req.body.password`.
   * @param res - Express response containing the JWT.
   * @param next - Express middleware callback for forwarding authentication or
   * validation errors.
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;

    try {
      // Validate the request body
      await authSchema.parseAsync(req.body);

      // Find the user by username
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return next(ErrorFactory.createError(ErrorTypes.Unauthorized, "Invalid username or password."));
      }
      // Compare the provided password with the hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return next(ErrorFactory.createError(ErrorTypes.Unauthorized, "Invalid username or password."));
      }

      // Generate a JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role }, // Add in the payload the user_id and role (essential informations)
        private_key, {
        expiresIn: "1h",
        algorithm: "RS256"
      });
      SuccessFactory.createSuccess(SuccessTypes.Ok, `Login successfull.`, token).send(res);
    } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues.map(issue => issue.message).join(", ");
        return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
      }

      return next(ErrorFactory.createError(ErrorTypes.InternalServerError, "Internal server error."));
    }
  };  
}