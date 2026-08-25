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
import sequelize from '../config/database';
import { Transaction } from 'sequelize';

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
            const userId = req.user.id;
            let gridDataToSave = aStarGrid.getGridNodes().map(row =>
                row.map(cella => cella.getIsWalkable() ? 0 : 1)
            );

            await sequelize.transaction(async (transaction: Transaction) => {
                const totalCost = aStarGrid.numberOfFields * COST_PER_CELL_CREATION;
                const user = await this.userRepository.getUserById(userId, transaction);
                if (!user) throw ErrorFactory.createError(ErrorTypes.NotFound, "User not found");
                if (user.tokenCredit < totalCost) {
                    throw ErrorFactory.createError(ErrorTypes.InsufficientCreditError, 'Insufficient credit');
                }

                const grid = new Grid();
                grid.name = name;
                grid.ownerId = user.id;
                grid.width = aStarGrid.width;
                grid.height = aStarGrid.height;
                grid.currentVersion = 1;
                grid.gridData = gridDataToSave;
                await this.gridRepository.createGrid(grid, transaction);
                await this.userRepository.updateCredit(userId, user.tokenCredit - totalCost, transaction);
            });

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

            const user = req.user;
            const isChangeApplied = await sequelize.transaction(async (transaction: Transaction) => {
                const gridDb = await this.gridRepository.getGridById(id, transaction);
                if (!gridDb) throw ErrorFactory.createError(ErrorTypes.NotFound, "Grid not found");

                const cellsUpdated = countChangedCells(gridDb.gridData, matrix);
                const totalCost = cellsUpdated * COST_PER_CELL_UPDATE;
                const userDb = await this.userRepository.getUserById(user.id, transaction);
                if (!userDb) throw ErrorFactory.createError(ErrorTypes.NotFound, "User not found");
                if (userDb.tokenCredit < totalCost) {
                    throw ErrorFactory.createError(ErrorTypes.InsufficientCreditError, 'Insufficient credit');
                }

                if (gridDb.ownerId === user.id) {
                    await this.gridRepository.updateGrid(gridDb.id, matrix, transaction);
                } else {
                    const updateRequest = new UpdateRequest({
                        modelId: gridDb.id,
                        userId: user.id,
                        status: UpdateStatus.PENDING,
                        gridData: matrix
                    });
                    await this.updateRequestRepository.createUpdateRequest(updateRequest, transaction);
                }

                await this.userRepository.updateCredit(user.id, userDb.tokenCredit - totalCost, transaction);
                return gridDb.ownerId === user.id;
            });
            isChangeApplied ? res.status(201).json({ message: "Changes applied correctly.", data: result.data }) : res.status(201).json({ message: "Update request created.", data: result.data });
        }
        catch (err) {
            next(err);
        }
    }

    runGrid = async (req: Request, res: Response, next: NextFunction) => {
        
    }
}
