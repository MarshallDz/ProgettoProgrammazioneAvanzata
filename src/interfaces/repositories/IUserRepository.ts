import User from '../../models/User';
import { Transaction } from 'sequelize';

export interface IUserRepository{
    //createUser(user: User): Promise<User>;
    getUserById(id: string, transaction?: Transaction): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    updateCredit(id: string, newCredit: number, transaction?: Transaction): Promise<void>;
}
