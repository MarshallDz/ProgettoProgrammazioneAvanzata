import * as z from "zod";

export const updateRequestSchema = z.object({
    toApprove : z.boolean('Parameter must be a boolean value')
})

const singleIdSchema = z.object({
    id : z.string("Each element must be a string")
})

export const updateRequestBatchSchema = z.object({
    ids: z.array(z.string()).nonempty(),
    toApprove : z.boolean('Parameter must be a boolean value')
})