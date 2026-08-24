import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { AStarFinder } from 'astar-typescript';
import { gridSchema, gridUpdateSchema } from '../validation/grid.validation';
import { IUserRepository } from '../interfaces/repositories/IUserRepository';
import { IGridRepository } from '../interfaces/repositories/IGridRepository';
import { IUpdateRequestRepository } from "../interfaces/repositories/IUpdateRequestRepository";
import Grid from "../models/Grid";
import { countChangedCells } from '../utils/grid.helper';
import UpdateRequest from '../models/UpdateRequest';
import { UpdateStatus } from '../types/updateStatus';

const COST_PER_CELL_CREATION = 0.025;
const COST_PER_CELL_UPDATE = 0.3;

export class GridController {
    constructor(private userRepository: IUserRepository, private gridRepository: IGridRepository, private updateRequestRepository: IUpdateRequestRepository) { }

    createGrid = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await gridSchema.safeParseAsync(req.body);
            if (!result.success) {
                const errorMessage = result.error.issues.map(issue => issue.message).join(", ");
                return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
            }

            const { name, matrix, width, height } = result.data;

            let aStarInstance: AStarFinder;
            if (matrix) {
                aStarInstance = new AStarFinder({
                    grid: {
                        matrix: matrix
                    }
                });
            }
            else if (width && height) {
                aStarInstance = new AStarFinder({
                    grid: {
                        width: width,
                        height: height
                    }
                });
            }
            else {
                return next(ErrorFactory.createError(ErrorTypes.BadRequest, "Error while creating the grid"));
            }
            const aStarGrid = aStarInstance.getGrid();
            // Calculate the cost of the operation
            const totalCost = aStarGrid.numberOfFields * COST_PER_CELL_CREATION;

            // Check if the user has enough credit tokens to process the request
            const userId = req.user.id;
            const user = await this.userRepository.getUserById(userId);
            if (!user) return next(ErrorFactory.createError(ErrorTypes.NotFound, "User not found"))

            if (user.tokenCredit < totalCost) {
                return next(ErrorFactory.createError(ErrorTypes.InsufficientCreditError, 'Insuffuficient credit'));
            }

            // Save the matrix of the grid
            let gridDataToSave = aStarGrid.getGridNodes().map(row =>
                row.map(cella => cella.getIsWalkable() ? 0 : 1)
            );

            // Create the object that will be stored in db
            let grid = new Grid();
            grid.name = name;
            grid.ownerId = user.id;
            grid.width = aStarGrid.width;
            grid.height = aStarGrid.height;
            grid.currentVersion = 1;
            grid.gridData = gridDataToSave
            // Save the grid in db
            await this.gridRepository.createGrid(grid);
            // Update the credit in db
            await this.userRepository.updateCredit(userId, user.tokenCredit - totalCost);

            res.status(201).json({ message: "Grid data is valid.", data: result.data });
        } catch (error) {
            next(error);
        }
    }

    updateGrid = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await gridUpdateSchema.safeParseAsync(req.body);
            if (!result.success) {
                const errorMessage = result.error.issues.map(issue => issue.message).join(", ");
                return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
            }
            const { matrix } = result.data;

            // Get grid_id of the grid to update
            const id = req.params.id as string;

            // Retrieve grid from db
            const gridDb = await this.gridRepository.getGridById(id);
            if (!gridDb) {
                return next(ErrorFactory.createError(ErrorTypes.NotFound, "Grid not found"));
            }

            // determine how many cells have changed and calculate the cost
            const cellsUpdated = countChangedCells(gridDb.gridData, matrix);
            const totalCost = cellsUpdated * COST_PER_CELL_UPDATE;

            // Check if the current user is the owner or not
            const user = req.user;
            let isChangeApplied: boolean = false;
            // Get the user from db to retrieve token credits
            const userDb = await this.userRepository.getUserById(user.id);
            if (!userDb) return next(ErrorFactory.createError(ErrorTypes.NotFound, "User not found"))
            if(userDb.tokenCredit < totalCost){
                return next(ErrorFactory.createError(ErrorTypes.InsufficientCreditError, 'Insuffuficient credit'));
            }
            if (gridDb.ownerId === user.id) {
                // Current user is the owner so the change can be applied
                await this.gridRepository.updateGrid(gridDb.id, matrix);   
                isChangeApplied = true;             
            }
            else {
                // Add the update request in pending
                const updateRequest = new UpdateRequest({
                    modelId: gridDb.id,
                    userId: user.id,
                    status: UpdateStatus.PENDING
                });
                await this.updateRequestRepository.createUpdateRequest(updateRequest);
            }
            
            // Update user credit
            await this.userRepository.updateCredit(user.id, userDb.tokenCredit - totalCost);
            isChangeApplied ? res.status(201).json({ message: "Changes applied correctly.", data: result.data }) : res.status(201).json({ message: "Update request created.", data: result.data });
        }
        catch (err) {
            next(err);
        }
    }
}
