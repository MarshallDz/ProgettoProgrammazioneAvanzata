import Grid from "../../models/Grid";

export interface IGridRepository {
    createGrid(gridData: Grid): Promise<Grid>;
    getGridById(id: string): Promise<Grid | null>;
    updateGrid(id: string, updatedData: Grid): Promise<Grid | null>;
    deleteGrid(id: string): Promise<boolean>;
    getAllGrids(): Promise<Grid[]>;
}
