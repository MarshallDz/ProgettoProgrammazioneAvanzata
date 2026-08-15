import Router from "express";
import provaAuth from "../controllers/prova.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/protected", authenticateToken, provaAuth);

export default router;