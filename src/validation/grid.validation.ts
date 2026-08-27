import * as z from "zod";

// Cell validation 
const cellSchema = z.union([z.literal(0), z.literal(1)]);

// Check dimensions of the matrix
const matrixSchema = z.array(z.array(cellSchema))
.min(1, "Matrix must have at least one row")
.refine((matrix) => {
    const rowCount = matrix.length;
    const colCount = rowCount > 0 ? matrix[0].length : 0;
    return matrix.every((row) => row.length === colCount);
}, "All rows in the matrix must have the same number of columns");

// Grid validation schema, matrix or width and height must be provided
export const gridSchema = z.object({
    name: z.string("Name is mandatory"),
    matrix: matrixSchema.optional(),
    width: z.number().int().positive("Width must be a positive integer").optional(),
    height: z.number().int().positive("Height must be a positive integer").optional(),
})
.refine((data) => data.matrix === undefined|| (data.width === undefined && data.height === undefined), "Either matrix or both width and height must be provided");

// Grid validation schema for model updates
export const gridUpdateSchema = z.object({
    matrix: matrixSchema
})

// Single point of the grid (es. start position)
export const positionSchema = z.object({
    x: z.number({ message: "x must be a number" }),
    y: z.number({ message: "y must be a number" })
});

// Grid execution schema
export const gridExecutionSchema = z.object({
    start: positionSchema,
    goal: positionSchema
})
