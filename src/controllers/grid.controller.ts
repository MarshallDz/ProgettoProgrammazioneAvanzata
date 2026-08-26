import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { AStarFinder } from 'astar-typescript';
import { gridSchema, gridUpdateSchema, gridExecutionSchema } from '../validation/grid.validation';
import { IUserRepository } from '../interfaces/repositories/IUserRepository';
import { IGridRepository } from '../interfaces/repositories/IGridRepository';
import { IUpdateRequestRepository } from "../interfaces/repositories/IUpdateRequestRepository";
import Grid from "../models/Grid";
import { countChangedCells } from '../utils/grid.helper';
import UpdateRequest from '../models/UpdateRequest';
import { UpdateStatus } from '../types/updateStatus';
import sequelize from '../config/database';
import { Transaction } from 'sequelize';
import { SuccessFactory, SuccessTypes } from '../utils/successFactory';

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
                SuccessFactory.createSuccess(SuccessTypes.Created, `Grid successfully created`, grid).send(res);
            });
        } catch (error) {
            next(error);
        }
    }

    updateGrid = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let updateRequest: UpdateRequest = new UpdateRequest();
            const result = await gridUpdateSchema.safeParseAsync(req.body);
            if (!result.success) {
                const errorMessage = result.error.issues.map(issue => issue.message).join(", ");
                return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
            }
            const { matrix } = result.data;

            // Get grid_id of the grid to update
            const id = req.params.modelId as string;

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

                // If the user is the owner, changes are applied directly
                if (gridDb.ownerId === user.id) {
                    await this.gridRepository.updateGrid(gridDb.id, matrix, transaction);
                } else { // Create the update request that the owner will accept/reject
                    updateRequest = new UpdateRequest({
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
            
            isChangeApplied ? 
                SuccessFactory.createSuccess(SuccessTypes.Updated, `Changes successfully applied`, matrix).send(res) :
                SuccessFactory.createSuccess(SuccessTypes.Created, `Update request created.`, updateRequest).send(res);
        }
        catch (err) {
            next(err);
        }
    }

    runGrid = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const gridId = req.params["modelId"] as string;
            const result = await gridExecutionSchema.safeParseAsync(req.body);
            if (!result.success) {
                const errorMessage = result.error.issues.map(issue => issue.message).join(", ");
                return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
            }
            
            const {start, goal} = result.data
            // Fetch grid from db
            const grid = await this.gridRepository.getGridById(gridId);
            
            // Create the AStarFinder object
            let aStarInstance: AStarFinder;
            aStarInstance = new AStarFinder({
                grid: {
                    matrix: grid?.gridData
                }
            });
            const t0 = performance.now();

            let myPathway = aStarInstance.findPath(start, goal);

            const tf = performance.now();

            // Time spent for execution
            const executionTime = tf - t0; 
            const costOfExecution = myPathway.length;

            const executionResult = {
                path: myPathway,
                totalCost: costOfExecution
            }
            
            SuccessFactory.createSuccess(SuccessTypes.Ok, `Run completed successfully`, executionResult).send(res);
        }
        catch(err){
            next(err);
        }
    }
}
