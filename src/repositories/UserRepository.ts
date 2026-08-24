import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import User from "../models/User";

export class UserRepository implements IUserRepository{
    /*
    async createUser(user: User): Promise<User> {        
    }
    */
    async getUserById(id: string): Promise<User | null> {
        return await User.findOne({
            where: {
                id: id
            },
        });
    }

    async getAllUsers(): Promise<User[]>{
        return await User.findAll();
    }

    async updateCredit(id: string, newCredit: number): Promise<void> {
        await User.update(
            {
                tokenCredit: newCredit
            },
            {
                where: {
                    id : id
                }
            }
        );
    }
}