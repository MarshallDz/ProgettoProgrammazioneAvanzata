import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema } from "../validation/user.validation";
import { Request, Response, NextFunction } from "express";
import { ErrorFactory, ErrorTypes } from "../utils/errorFactory";
import { z } from "zod";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  try {
    // Validate the request body
    await registerSchema.parseAsync(req.body);

    // Check if the user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({ username, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully.", user: newUser });
  } catch (error) {
    console.error(error);
    if(error instanceof z.ZodError) {
      const errorMessage = error.issues.map(issue => issue.message).join(", ");
      throw ErrorFactory.createError(ErrorTypes.ZodError, errorMessage);
    }
    return next(ErrorFactory.createError(ErrorTypes.InternalServerError, "Internal server error."));
  }
};

/*
  LOGIN FUNCTION
*/
export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  try {
    // Validate the request body
    await loginSchema.parseAsync(req.body);

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
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful.", token });
  } catch (error) {
    console.error(error);
    if(error instanceof z.ZodError) {
      const errorMessage = error.issues.map(issue => issue.message).join(", ");
      return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
    }

    return next(ErrorFactory.createError(ErrorTypes.InternalServerError, "Internal server error."));
  }
};  