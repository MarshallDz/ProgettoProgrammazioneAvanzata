import * as z from "zod";
import { UpdateStatus } from "../types/updateStatus";
import { positionSchema} from "./grid.validation";

export const updateRequestSchema = z.object({
    toApprove : z.boolean('Parameter must be a boolean value')
})

export const updateRequestByCellsSchema = z.object({
    cellsToUpdate: z.array(positionSchema).nonempty(),
    toApprove : z.boolean('Parameter must be a boolean value')
})

const singleIdSchema = z.object({
    id : z.string("Each element must be a string")
})

export const updateRequestBatchSchema = z.object({
    ids: z.array(z.string()).nonempty(),
    toApprove : z.boolean('Parameter must be a boolean value')
})

export const getRequestsByModelIdSchema = z.object({
    from: z.iso.date("Invalid date format").transform(val => new Date(val)).optional(),
    to: z.iso.date("Invalid date format").transform(val => new Date(val)).optional(),
    status: z.enum([UpdateStatus.ACCEPTED, UpdateStatus.REJECTED]).optional()
})