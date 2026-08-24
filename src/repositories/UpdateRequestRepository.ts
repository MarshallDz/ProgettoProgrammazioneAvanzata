import { IUpdateRequestRepository } from "../interfaces/repositories/IUpdateRequestRepository";
import UpdateRequest from "../models/UpdateRequest";
import { UpdateStatus } from "../types/updateStatus";

export class UpdateRequestRepository implements IUpdateRequestRepository{
    async createUpdateRequest(updateRequest: UpdateRequest): Promise<void> {
        await UpdateRequest.create({
            modelId: updateRequest.modelId,
            userId: updateRequest.userId,
            status: updateRequest.status
        })
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
}