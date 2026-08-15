import {Request, Response} from "express";

const provaAuth = async (req: Request, res: Response) => {
    res.json({ message: "Access granted to protected route.", user: (req as any).user });
};

export default provaAuth;