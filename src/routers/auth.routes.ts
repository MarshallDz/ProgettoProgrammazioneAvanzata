import Router from "express";
import {UserController} from "../controllers/auth.controller";
import { UserRepository } from "../repositories/UserRepository";

const router = Router();

const userRepository = new UserRepository();
const userController = new UserController(userRepository);

router.post("/register", userController.register);
router.post("/login", userController.login);

export default router;