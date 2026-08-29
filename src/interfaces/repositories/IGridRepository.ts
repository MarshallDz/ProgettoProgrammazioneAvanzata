import Grid from "../../models/Grid";
import { Transaction } from "sequelize";

export interface IGridRepository {
    createGrid(gridData: Grid, transaction?: Transaction): Promise<Grid>;
    getGridById(id: string, transaction?: Transaction): Promise<Grid | null>;
    updateGrid(id: string, updatedData: number[][], transaction?: Transaction): Promise<void>;
    getAllGridsByUserId(userId: string): Promise<Grid[]>;
}
