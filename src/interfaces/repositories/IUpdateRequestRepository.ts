import UpdateRequest from "../../models/UpdateRequest";

export interface IUpdateRequestRepository{
    createUpdateRequest(updateRequest: UpdateRequest): Promise<void>;
    updateRequest(toUpdate: boolean, requestId: string): Promise<void>;
    getUpdateRequestById(requestId: string): Promise<UpdateRequest | null>;
}