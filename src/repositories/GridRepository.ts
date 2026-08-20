import {IGridRepository} from "../interfaces/repositories/IGridRepository";
import Grid from "../models/Grid";

export class GridRepository implements IGridRepository {

    async createGrid(gridData: Grid): Promise<Grid> {
        return await Grid.create(gridData);
    }

    async getGridById(id: string): Promise<Grid | null> {
        return await Grid.findByPk(id);
    }

    async updateGrid(id: string, updatedData: Grid): Promise<Grid | null> {
        const grid = await Grid.findByPk(id);
        if (!grid) {
            return null;
        }   
        return await grid.update(updatedData);
    }

    async deleteGrid(id: string): Promise<boolean> {
        const deletedCount = await Grid.destroy({ where: { id } });
        return deletedCount > 0;
    }

    async getAllGrids(): Promise<Grid[]> {
        return await Grid.findAll();
    }

}
