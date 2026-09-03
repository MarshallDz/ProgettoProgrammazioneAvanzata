import {Request, Response, NextFunction} from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { IUpdateRequestRepository } from '../interfaces/repositories/IUpdateRequestRepository';
import { IGridRepository } from '../interfaces/repositories/IGridRepository';
import { UpdateStatus } from '../types/updateStatus';
import UpdateRequest from '../models/UpdateRequest';
import { SuccessFactory, SuccessTypes } from '../utils/successFactory';
import sequelize from '../config/database';
import { Transaction } from 'sequelize';
import { checkOwner } from '../utils/grid.helper';

export class UpdateRequestController {
    constructor(private updateRequestRepository: IUpdateRequestRepository, private gridRepository: IGridRepository) {}

    /**
     * Approves or rejects a complete update request.
     *
     * Verifies that the authenticated user owns the associated grid and updates
     * the request status according to `toApprove`.
     *
     * @param req - Request with `req.params.id`, `req.body.toApprove`, and
     * `req.user.id`.
     * @param res - Response with status 200 after the status update.
     * @param next - Express middleware callback for forwarding validation or
     * authorization errors.
     */
    updateRequest = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const { toApprove } = req.body;
            // Get update_request_id of the grid to update
            const id = req.params.id as string;
            
            const currentUserId = req.user.id;
            const isOwner = await checkOwner(id, currentUserId, this.updateRequestRepository, this.gridRepository);

            if(!isOwner){
                return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Unauthorized to accept/reject the request. Not the owner.'));
            }

            await this.applyUpdateDecision(id, toApprove);

            SuccessFactory.createSuccess(SuccessTypes.Updated, `Richiesta ${id} aggiornata con successo`).send(res);
        }
        catch(err){
            next(err);
        }        
    }

    /**
     * Approves or rejects selected cells from an update request.
     *
     * When approving, copies the selected cells into the grid. When rejecting,
     * restores those cells to their previous values. The grid and request are
     * updated in the same transaction.
     *
     * @param req - Request with `req.params.id`, `req.body.cellsToUpdate`,
     * `req.body.toApprove`, and `req.user.id`.
     * @param res - Response with status 200 after updating the grid and request.
     * @param next - Express middleware callback for forwarding validation or
     * authorization errors.
     */
    updateRequestByCells = async(req: Request, res: Response, next: NextFunction) => {
        try{
            // Get update_request_id of the grid to update
            const id = req.params.id as string;
            const currentUserId = req.user.id;
            const isOwner = await checkOwner(id, currentUserId, this.updateRequestRepository, this.gridRepository);
            if(!isOwner){
                return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Unauthorized to accept/reject the request. Not the owner.'));
            }

            const { cellsToUpdate, toApprove } = req.body;
            
            // Fetch the update request from db
            const updateRequest = await this.updateRequestRepository.getUpdateRequestById(id);

            // Fetch the grid from db
            const grid = await this.gridRepository.getGridById(updateRequest!.modelId);

            let oldGrid = grid!.gridData;
            let newGrid = updateRequest!.gridData;

            // For each cell to update change the grid data in grid (do not take all grid data in the update request)
            if (toApprove){
                for(const cellToUpdate of cellsToUpdate){
                    // in a tipical matrix where x is the row and y is the column, in this case is the opposite
                    // x is the column
                    // y is the row 
                    /*
                          |x0 x1 x2 x3 |
                          |------------|
                       y0 |0   0  1  0 |
                       y1 |0   0  0  1 |
                       y2 |0   1  0  0 |
                       y3 |0   1  0  0 |
                           ------------
                        |
                        v
                        y
                    */
                    oldGrid[cellToUpdate.y][cellToUpdate.x] = newGrid[cellToUpdate.y][cellToUpdate.x];
                }
            }
            // In this case the old grid became the new grid except for the cells rejected
            else{
                for(const cellToUpdate of cellsToUpdate){
                    // in a tipical matrix where x is the row and y is the column, in this case is the opposite
                    // x is the column
                    // y is the row 
                    /*
                          |x0 x1 x2 x3 |
                          |------------|
                       y0 |0   0  1  0 |
                       y1 |0   0  0  1 |
                       y2 |0   1  0  0 |
                       y3 |0   1  0  0 |
                           ------------
                        |
                        v
                        y
                    */
                    newGrid[cellToUpdate.y][cellToUpdate.x] = oldGrid[cellToUpdate.y][cellToUpdate.x];
                }
                oldGrid = newGrid;  
            }

            await sequelize.transaction(async (transaction: Transaction) => {                
                await this.gridRepository.updateGrid(grid!.id, oldGrid, transaction);
                await this.updateRequestRepository.updateRequest(toApprove, id, transaction);
            });

            SuccessFactory.createSuccess(SuccessTypes.Updated, `Richiesta ${id} aggiornata con successo`).send(res);
        }
        catch(err){
            next(err);
        }        
    }

    /**
     * Approves or rejects multiple update requests in one call.
     *
     * Updates only requests belonging to grids owned by the user and returns
     * valid and unauthorized ids separately.
     *
     * @param req - Request with `req.body.ids` and `req.body.toApprove`.
     * @param res - Response with status 200 containing updated and rejected ids.
     * @param next - Express middleware callback for forwarding validation or
     * database errors.
     */
    updateRequestBatch = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const { ids, toApprove } = req.body;
            const currentUserId = req.user.id;

            // Array of valid ids that can be accepted/reject
            let validIds : string[] = [];
            // Array of invalid ids (current user is not the owner of the grid ids)
            let invalidIds : string[] = [];
            // For each id check if the user is the owner
            for (const id of ids) {
                const isOwner = await checkOwner(id, currentUserId, this.updateRequestRepository, this.gridRepository);
                
                if (!isOwner) {
                    invalidIds.push(id);
                }
                else{
                    validIds.push(id);
                }                
            }

            // For each update request in the batch update the status with approve/reject             
            for (const id of validIds) {
                await this.applyUpdateDecision(id, toApprove);
            }
            SuccessFactory.createSuccess(SuccessTypes.Updated, `Request for valid ids successfully updated`, {validIds: validIds, invalidIds: invalidIds}).send(res);
        }
        catch(err){
            next(err);
        }        
    }

    /**
     * Returns the update requests associated with a grid.
     *
     * Supports optional filters for status, start date, and end date.
     *
     * @param req - Request with `req.params.modelId` and optional query
     * parameters `from`, `to`, and `status`.
     * @param res - Response with status 200 containing the ordered requests.
     * @param next - Express middleware callback for forwarding validation or
     * database errors.
     */
    getRequestsByModelId = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const {from, to, status} = req.query as any;
            const modelId = req.params["modelId"] as string;
            
            // Retrieve the update request from db
            const queryResult = await this.updateRequestRepository.getUpdateRequestsByModelId(modelId, status, from, to);
                SuccessFactory.createSuccess(
                    SuccessTypes.Ok, queryResult.length === 0 ? 
                        (status !== undefined ? 
                            `the model with id ${modelId} has no update requests with status '${status}'` : 
                            `the model with id ${modelId} has no update requests`) 
                        : `found ${queryResult.length} update request(s) for model ${modelId}`,
                     queryResult)
                .send(res);          
        }
        catch(err){
            next(err);
        }
    }

    /**
     * Returns the pending requests associated with a grid.
     *
     * @param req - Request with `req.params.modelId`.
     * @param res - Response with status 200 containing pending requests.
     * @param next - Express middleware callback for forwarding errors.
     */
    getPendingRequestsByModelId = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const modelId = req.params["modelId"] as string;
            
            // Retrieve the update request from db
            const queryResult = await this.updateRequestRepository.GetPendingUpdateRequestsByModelId(modelId);

            SuccessFactory.createSuccess(SuccessTypes.Ok, queryResult.length === 0 ? `the model with id ${modelId} has no update requests in pending`: '', queryResult).send(res);
        }
        catch(err){
            next(err);
        }
    }

    /**
     * Returns all pending requests for the authenticated user's grids.
     *
     * Loads the grids owned by the user and collects their pending requests.
     *
     * @param req - Request with the user id available in `req.user.id`.
     * @param res - Response with status 200 containing pending requests.
     * @param next - Express middleware callback for forwarding errors.
     */
    getPendingRequests = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const id = req.user.id;
            
            // Fetch all grids of the current user
            var userGrids = await this.gridRepository.getAllGridsByUserId(id);
            
            // For each grid fetch the update requests in pending
            let updateRequests: UpdateRequest[] = [];
            for(const grid of userGrids){
                updateRequests.push(...await this.updateRequestRepository.getUpdateRequestsByModelId(grid.id, UpdateStatus.PENDING));
            }

            SuccessFactory.createSuccess(SuccessTypes.Ok, updateRequests.length === 0 ? `current user has no update requests in pending` : '', updateRequests).send(res);
        }
        catch(err){
            next(err);
        }
    }

    /**
     * Applies the final decision for an update request.
     *
     * If the request is approved, the associated grid is updated with the
     * pending data and the request status is persisted in the same database
     * transaction. If the request is rejected, only the request status is
     * updated without modifying the grid.
     *
     * @param id - Identifier of the update request to process.
     * @param toApprove - Whether the update request should be approved.
     * @param transaction - Optional existing transaction to reuse when the
     * caller is already inside a DB transaction.
     */
    private async applyUpdateDecision(id: string, toApprove: boolean, transaction?: Transaction) {
        // Fetch the update request from db
        const updateRequest = await this.updateRequestRepository.getUpdateRequestById(id);

        // If the update request is approved, the grid is updated, otherwise the update only the status of update request
        if(toApprove){
            await sequelize.transaction(async (transaction: Transaction) => {                
                await this.gridRepository.updateGrid(updateRequest!.modelId, updateRequest!.gridData, transaction);
                await this.updateRequestRepository.updateRequest(toApprove, id, transaction);
            });
        }
        else{
            await this.updateRequestRepository.updateRequest(toApprove, id);
        }
    }
}

