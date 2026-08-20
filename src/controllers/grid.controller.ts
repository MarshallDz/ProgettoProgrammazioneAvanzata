import {Request, Response, NextFunction} from 'express';
import {ErrorFactory, ErrorTypes} from '../utils/errorFactory';
import { AStarFinder } from 'astar-typescript'; 

export const createGrid = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { width, height, start, end } = req.body;

        // Validate the request body
        if (!width || !height || !start || !end) {
            return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'Missing required fields: width, height, start, or end.'));
        }

        // Create an instance of AStarFinder
        const finder = new AStarFinder({
            grid: {
                width: parseInt(width),
                height: parseInt(height)
            }
        });

        

    } catch (error) {
        next(error);
    }
};