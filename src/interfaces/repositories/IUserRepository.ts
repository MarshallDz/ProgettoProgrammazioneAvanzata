import User from '../../models/User';

export interface IUserRepository{
    //createUser(user: User): Promise<User>;
    getUserById(id: string): Promise<User | null>;    
    getAllUsers(): Promise<User[]>;
    updateCredit(id: string, newCredit: number): Promise<void>;
}
