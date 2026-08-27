import UpdateRequest from "../../models/UpdateRequest";
import { Transaction } from "sequelize";
import { UpdateStatus } from "../../types/updateStatus";

export interface IUpdateRequestRepository{
    createUpdateRequest(updateRequest: UpdateRequest, transaction?: Transaction): Promise<void>;
    updateRequest(toUpdate: boolean, requestId: string, transaction?: Transaction): Promise<void>;
    getUpdateRequestById(requestId: string): Promise<UpdateRequest | null>;
    getUpdateRequestsByModelId(modelId: string, status?: UpdateStatus, from?: Date, to?: Date): Promise<UpdateRequest[]>;
    GetPendingUpdateRequestsByModelId(modelId: string): Promise<UpdateRequest[]>;
}