import { IGridRepository } from "../interfaces/repositories/IGridRepository";
import { literal, Transaction } from "sequelize";
import Grid from "../models/Grid";

export class GridRepository implements IGridRepository {

    async createGrid(gridData: Grid, transaction?: Transaction): Promise<Grid> {
        return await Grid.create({
            name: gridData.name,
            ownerId: gridData.ownerId,
            width: gridData.width,
            height: gridData.height,
            gridData: gridData.gridData,
            currentVersion: gridData.currentVersion
        }, { transaction });
    }

    async getGridById(id: string, transaction?: Transaction): Promise<Grid | null> {
        return await Grid.findByPk(id, { transaction });
    }

    async updateGrid(id: string, updatedData: number[][], transaction?: Transaction): Promise<void> {
        await Grid.update(
            {
                gridData: updatedData,
                currentVersion: literal('"currentVersion" + 1'),
            },
            {
                where: {
                    id: id
                },
                transaction,
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

    async getAllGridsByUserId(userId: string): Promise<Grid[]> {
        return await Grid.findAll({
            where: {
                ownerId: userId
            }
        });
    }
}
