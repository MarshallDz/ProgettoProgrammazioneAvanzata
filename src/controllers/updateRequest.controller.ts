import {Request, Response, NextFunction} from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { IUpdateRequestRepository } from '../interfaces/repositories/IUpdateRequestRepository';
import { IGridRepository } from '../interfaces/repositories/IGridRepository';
import { updateRequestSchema, updateRequestBatchSchema, getRequestsByModelIdSchema, updateRequestByCellsSchema } from '../validation/updateRequest.validation';
import { UpdateStatus } from '../types/updateStatus';
import UpdateRequest from '../models/UpdateRequest';
import { SuccessFactory, SuccessTypes } from '../utils/successFactory';
import sequelize from '../config/database';
import { Transaction } from 'sequelize';
import { checkOwner } from '../utils/grid.helper';

export class UpdateRequestController {
    constructor(private updateRequestRepository: IUpdateRequestRepository, private gridRepository: IGridRepository) {}

    updateRequest = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await updateRequestSchema.safeParseAsync(req.body);
            if (!result.success) {
                const errorMessage = result.error.issues.map(issue => issue.message).join(", ");
                return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
            }
            const { toApprove } = result.data;
            // Get update_request_id of the grid to update
            const id = req.params.id as string;
            
            const currentUserId = req.user.id;
            const isOwner = await checkOwner(id, currentUserId, this.updateRequestRepository, this.gridRepository);

            if(!isOwner){
                return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Unauthorized to accept/reject the request. Not the owner.'));
            }

            // Approve or reject the update request by id
            await this.updateRequestRepository.updateRequest(toApprove, id);
            SuccessFactory.createSuccess(SuccessTypes.Updated, `Richiesta ${id} aggiornata con successo`).send(res);
        }
        catch(err){
            next(err);
        }        
    }

    updateRequestByCells = async(req: Request, res: Response, next: NextFunction) => {
        try{
            // Get update_request_id of the grid to update
            const id = req.params.id as string;
            const currentUserId = req.user.id;
            const isOwner = await checkOwner(id, currentUserId, this.updateRequestRepository, this.gridRepository);
            if(!isOwner){
                return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Unauthorized to accept/reject the request. Not the owner.'));
            }

            const result = await updateRequestByCellsSchema.safeParseAsync(req.body);
            if (!result.success) {
                const errorMessage = result.error.issues.map(issue => issue.message).join(", ");
                return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
            }
            const { cellsToUpdate, toApprove } = result.data;
            
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

    updateRequestBatch = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await updateRequestBatchSchema.safeParseAsync(req.body);
            if (!result.success) {
                const errorMessage = result.error.issues.map(issue => issue.message).join(", ");
                return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
            }
            const { ids, toApprove } = result.data;
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
                await this.updateRequestRepository.updateRequest(toApprove, id);
            }
            SuccessFactory.createSuccess(SuccessTypes.Updated, `Request for valid ids successfully updated`, {validIds: validIds, invalidIds: invalidIds}).send(res);
        }
        catch(err){
            next(err);
        }        
    }

    getRequestsByModelId = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await getRequestsByModelIdSchema.safeParseAsync(req.query);
            if (!result.success) {
                const errorMessage = result.error.issues.map(issue => issue.message).join(", ");
                return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
            }

            const {from, to, status} = result.data;
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
}

