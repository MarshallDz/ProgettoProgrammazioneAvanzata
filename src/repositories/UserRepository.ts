import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import User from "../models/User";
import { Transaction } from "sequelize";

export class UserRepository implements IUserRepository{
    
    async createUser(username: string, hashedPassword: string): Promise<User> {  
        return await User.create({ username: username, password: hashedPassword });      
    }
    
    async getUserById(id: string, transaction?: Transaction): Promise<User | null> {
        return await User.findOne({
            where: {
                id: id
            },
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : undefined,
        });
    }

    async getAllUsers(): Promise<User[]>{
        return await User.findAll();
    }

    async updateCredit(id: string, newCredit: number, transaction?: Transaction): Promise<void> {
        await User.update(
            {
                tokenCredit: newCredit
            },
            {
                where: {
                    id : id
                },
                transaction,
            }
        );
    }
}