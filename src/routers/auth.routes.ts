import Router from "express";
import {UserController} from "../controllers/auth.controller";
import { UserRepository } from "../repositories/UserRepository";
import { validateData } from '../middleware/validation.middleware';
import { authSchema } from '../validation/user.validation';

const router = Router();

const userRepository = new UserRepository();
const userController = new UserController(userRepository);

router.post("/register", validateData(authSchema, 'body'), userController.register);
router.post("/login", validateData(authSchema, 'body'), userController.login);

export default router;