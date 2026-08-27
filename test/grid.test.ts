import { Request, Response, NextFunction } from 'express';
import { checkGridExists } from '../src/middleware/grid.middleware';
import { IGridRepository } from '../src/interfaces/repositories/IGridRepository';

describe('checkGridExists', () => {
	it('calls next when the requested grid exists', async () => {
		// Arrange: mock a repository that returns an existing grid.
		const gridRepository: IGridRepository = {
			getGridById: jest.fn().mockResolvedValue({ id: 'grid-1' }),
		} as unknown as IGridRepository;
		const request = { params: { modelId: 'grid-1' } } as unknown as Request;
		const response = {} as Response;
		const next = jest.fn() as NextFunction;

		// Act: execute the middleware with the grid id from the request.
		await checkGridExists(gridRepository)(request, response, next);

		// Assert: verify the repository lookup and successful continuation.
		expect(gridRepository.getGridById).toHaveBeenCalledWith('grid-1');
		expect(next).toHaveBeenCalledTimes(1);
	});
});
