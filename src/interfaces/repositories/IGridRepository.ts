import Grid from "../../models/Grid";
import { Transaction } from "sequelize";

export interface IGridRepository {
    createGrid(gridData: Grid, transaction?: Transaction): Promise<Grid>;
    getGridById(id: string, transaction?: Transaction): Promise<Grid | null>;
    updateGrid(id: string, updatedData: number[][], transaction?: Transaction): Promise<void>;
    deleteGrid(id: string): Promise<boolean>;
    getAllGrids(): Promise<Grid[]>;
    getAllGridsByUserId(userId: string): Promise<Grid[]>;
}
