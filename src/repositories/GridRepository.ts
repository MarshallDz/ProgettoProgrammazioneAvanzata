import { IGridRepository } from "../interfaces/repositories/IGridRepository";
import { literal } from "sequelize";
import Grid from "../models/Grid";

export class GridRepository implements IGridRepository {

    async createGrid(gridData: Grid): Promise<Grid> {
        return await Grid.create({
            name: gridData.name,
            ownerId: gridData.ownerId,
            width: gridData.width,
            height: gridData.height,
            gridData: gridData.gridData,
            currentVersion: gridData.currentVersion
        });
    }

    async getGridById(id: string): Promise<Grid | null> {
        return await Grid.findByPk(id);
    }

    async updateGrid(id: string, updatedData: number[][]): Promise<void> {
        await Grid.update(
            {
                gridData: updatedData,
                currentVersion: literal('"currentVersion" + 1'),
            },
            {
                where: {
                    id: id
                }
            }
        );
    }

    async deleteGrid(id: string): Promise<boolean> {
        const deletedCount = await Grid.destroy({ where: { id } });
        return deletedCount > 0;
    }

    async getAllGrids(): Promise<Grid[]> {
        return await Grid.findAll();
    }

}
