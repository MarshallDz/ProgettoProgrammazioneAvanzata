import {Request, Response, NextFunction} from 'express';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { IUpdateRequestRepository } from '../interfaces/repositories/IUpdateRequestRepository';
import { IGridRepository } from '../interfaces/repositories/IGridRepository';
import { updateRequestSchema, updateRequestBatchSchema, getRequestsByModelIdSchema } from '../validation/updateRequest.validation';
import { UpdateStatus } from '../types/updateStatus';
import UpdateRequest from '../models/UpdateRequest';

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
            const isOwner = await this.checkOwner(id, currentUserId);

            if(!isOwner){
                return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Unauthorized to accept/reject the request. Not the owner.'));
            }

            // Approve or reject the update request by id
            await this.updateRequestRepository.updateRequest(toApprove, id);
            
            return res.status(200).json({
                message: `Richiesta ${id} aggiornata con successo`,
            });
        }
        catch(err){
            next(err);
        }        
    }

    updateRequestBatch = async(req: Request, res: Response, next: NextFunction) => {
        let isOwner : boolean = false;
        try{
            const result = await updateRequestBatchSchema.safeParseAsync(req.body);
            if (!result.success) {
                const errorMessage = result.error.issues.map(issue => issue.message).join(", ");
                return next(ErrorFactory.createError(ErrorTypes.ZodError, errorMessage));
            }
            const { ids, toApprove } = result.data;
            const currentUserId = req.user.id;
            // For each id check if the user is the owner
            for (const id of ids) {
                const isOwner = await this.checkOwner(id, currentUserId);
                
                if (!isOwner) {
                    // If not the owner reject the update
                    return next(ErrorFactory.createError(
                        ErrorTypes.Unauthorized, 
                        `Unauthorized to accept/reject the request with id: ${id}. Not the owner.`
                    ));
                }
            }

            // For each update request in the batch update the status with approve/reject             
            for (const id of ids) {
                await this.updateRequestRepository.updateRequest(toApprove, id);
            }

            return res.status(200).json({
                message: `Request for ids ${ids} successfully updated`,
            });
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

            return res.status(200).json(queryResult);
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

            return res.status(200).json(queryResult);
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

            return res.status(200).json(updateRequests);
        }
        catch(err){
            next(err);
        }
    }

    // Private helper
    private async checkOwner(requestId: string, currentUserId: string): Promise<boolean> {
        // Get the update request from db
        const updateRequest = await this.updateRequestRepository.getUpdateRequestById(requestId);
        if(!updateRequest){
            throw ErrorFactory.createError(ErrorTypes.NotFound, 'Update request not found');
        }
        // Get the grid that is gonna be updated
        const gridId = updateRequest?.modelId;
        const grid = await this.gridRepository.getGridById(gridId);

        //check if the current user is the owner that can accept/reject the request
        const ownerId = grid?.ownerId;
        return currentUserId === ownerId;
    }
}

