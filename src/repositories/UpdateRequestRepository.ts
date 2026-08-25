import { IUpdateRequestRepository } from "../interfaces/repositories/IUpdateRequestRepository";
import UpdateRequest from "../models/UpdateRequest";
import User from "../models/User";
import Grid from "../models/Grid";
import { UpdateStatus } from "../types/updateStatus";
import { Op, Transaction } from "sequelize";

export class UpdateRequestRepository implements IUpdateRequestRepository{
    async createUpdateRequest(updateRequest: UpdateRequest, transaction?: Transaction): Promise<void> {
        await UpdateRequest.create({
            modelId: updateRequest.modelId,
            userId: updateRequest.userId,
            status: updateRequest.status,
            gridData: updateRequest.gridData
        }, { transaction });
    }

    async updateRequest(toUpdate: boolean, requestId: string): Promise<void> {
        if(toUpdate){
            UpdateRequest.update({
                status: toUpdate ? UpdateStatus.ACCEPTED : UpdateStatus.REJECTED
            },
            {
                where: {
                    id: requestId
                }
            }
        )
      }
    }

    async getUpdateRequestById(requestId: string): Promise<UpdateRequest | null> {
        return await UpdateRequest.findByPk(requestId);
    }

    async getUpdateRequestsByModelId(modelId: string, status: UpdateStatus, from?: Date, to?: Date): Promise<UpdateRequest[]> {
        // Build the where clause
        const whereClause: any = {
            modelId,
            status,
        };

        // If from or to are presents in the query parameters add date filters
        if (from || to) {
            whereClause.createdAt = {};

            if (from) {
                // Op.gte = Greater than or equal (>=)
                whereClause.createdAt[Op.gte] = from;
            }

            if (to) {
                // Op.lte = Less than or equal (<=)
                whereClause.createdAt[Op.lte] = to;
            }
        }

        const requests = await UpdateRequest.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']], 
        });

        return requests;
    }

    async GetPendingUpdateRequestsByModelId(modelId: string): Promise<UpdateRequest[]>{
        return await UpdateRequest.findAll({
            where: {
                modelId: modelId,
                status: UpdateStatus.PENDING
            }
        })
    }

    async GetPendingUpdateRequests(userId: string): Promise<UpdateRequest[]>{
        return await UpdateRequest.findAll({
            include: [
                {
                    model: User,
                    required: true,
                    where: {
                        
                    }
                },
                {
                    model: Grid,
                    required: true
                }
            ],
            where: {
                userId: userId
            }
        })
    }
}