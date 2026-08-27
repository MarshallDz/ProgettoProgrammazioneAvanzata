import { Request, Response, NextFunction } from 'express';
import { checkUserCredit } from '../src/middleware/user.middleware';
import { IUserRepository } from '../src/interfaces/repositories/IUserRepository';

describe('checkUserCredit', () => {
	it('calls next when the authenticated user has positive credit', async () => {
		// Arrange: mock a repository that returns a user with positive credit.
		const userRepository: IUserRepository = {
			getUserById: jest.fn().mockResolvedValue({ tokenCredit: 10 }),
		} as unknown as IUserRepository;
		const request = { user: { id: 'user-1' } } as unknown as Request;
		const response = {} as Response;
		const next = jest.fn() as NextFunction;

		// Act: execute the middleware with the authenticated user's id.
		await checkUserCredit(userRepository)(request, response, next);

		// Assert: verify the lookup and successful continuation.
		expect(userRepository.getUserById).toHaveBeenCalledWith('user-1');
		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith();
	});
});
