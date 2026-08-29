import { Request, Response, NextFunction } from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { AStarFinder } from 'astar-typescript';
import { IUserRepository } from '../interfaces/repositories/IUserRepository';
import { IGridRepository } from '../interfaces/repositories/IGridRepository';
import { IUpdateRequestRepository } from "../interfaces/repositories/IUpdateRequestRepository";
import Grid from "../models/Grid";
import { checkSufficientUserCredit, countChangedCells, COST_PER_CELL_CREATION, COST_PER_CELL_UPDATE } from '../utils/grid.helper';
import UpdateRequest from '../models/UpdateRequest';
import { UpdateStatus } from '../types/updateStatus';
import sequelize from '../config/database';
import { Transaction } from 'sequelize';
import { SuccessFactory, SuccessTypes } from '../utils/successFactory';



export class GridController {
    constructor(private userRepository: IUserRepository, private gridRepository: IGridRepository, private updateRequestRepository: IUpdateRequestRepository) { }

    /**
     * Creates a new grid for the authenticated user.
     *
     * Accepts a matrix or width and height, builds the grid using AStarFinder,
     * calculates the cost based on the number of cells, and saves the grid and
     * updated credit in the same transaction.
     *
     * @param req - Request with `req.body.name` and either `matrix` or `width`
     * and `height`; the user id is read from `req.user.id`.
     * @param res - Response with status 201 and the newly created grid.
     * @param next - Express middleware callback for forwarding validation,
     * insufficient-credit, or database errors.
     */
    createGrid = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, matrix, width, height } = req.body;

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
                const user = await checkSufficientUserCredit(this.userRepository, userId, totalCost, transaction);

                const grid = new Grid();
                grid.name = name;
                grid.ownerId = userId;
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

    /**
     * Updates an existing grid or creates an update request.
     *
     * If the authenticated user is the owner, the matrix is applied directly.
     * Otherwise, a pending request is created for the owner. In both cases,
     * the cost depends on the changed cells.
     *
     * @param req - Request with `req.params.modelId`, `req.body.matrix`, and
     * `req.user.id`.
     * @param res - Response with status 200 for a direct update or 201 for a
     * created update request.
     * @param next - Express middleware callback for forwarding errors.
     */
    updateGrid = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let updateRequest: UpdateRequest = new UpdateRequest();
            const { matrix } = req.body;

            // Get grid_id of the grid to update
            const id = req.params.modelId as string;

            const user = req.user;
            const isChangeApplied = await sequelize.transaction(async (transaction: Transaction) => {
                const gridDb = await this.gridRepository.getGridById(id, transaction);
                if (!gridDb) throw ErrorFactory.createError(ErrorTypes.NotFound, "Grid not found");

                const cellsUpdated = countChangedCells(gridDb.gridData, matrix);
                const totalCost = cellsUpdated * COST_PER_CELL_UPDATE;
                const userDb = await checkSufficientUserCredit(this.userRepository, user.id, totalCost, transaction);

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

    /**
     * Runs the A* algorithm on the requested grid.
     *
     * Loads the grid, calculates the path between the start and goal positions,
     * measures the execution time, and charges the user.
     *
     * @param req - Request with `req.params.modelId`, `req.body.start`,
     * `req.body.goal`, and `req.user.id`.
     * @param res - Response with status 200 containing the path, total cost, and
     * execution time.
     * @param next - Express middleware callback for forwarding errors.
     */
    runGrid = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const gridId = req.params["modelId"] as string;
            const userId = req.user.id;
            const {start, goal} = req.body;

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
                totalCost: costOfExecution,
                time: `${executionTime.toFixed(3)} ms`
            }
            
            // Update the user token credit
            const totalCost = aStarInstance.getGrid().numberOfFields * COST_PER_CELL_CREATION;

            // Fetch user from db
            const user = await checkSufficientUserCredit(this.userRepository, userId, totalCost);

            await this.userRepository.updateCredit(userId, user!.tokenCredit - totalCost);
            SuccessFactory.createSuccess(SuccessTypes.Ok, `Run completed successfully`, executionResult).send(res);
        }
        catch(err){
            next(err);
        }
    }
}
