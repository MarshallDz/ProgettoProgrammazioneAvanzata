import { StatusCodes } from 'http-status-codes';
import { Response } from 'express';

export class SuccessResponse<T = unknown> {
  statusCode: number;
  code: string;
  message: string;
  data?: T;

  constructor(statusCode: number, message: string, code: string, data?: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.code = code;
    this.data = data;
  }

  // Metodo comodo per inviare direttamente la risposta
  send(res: Response) {
    return res.status(this.statusCode).json({
      success: true,
      statusCode: this.statusCode,
      code: this.code,
      message: this.message,
      data: this.data,
    });
  }
}

export enum SuccessTypes {
  Ok = 'Ok',
  Created = 'Created',
  Updated = 'Updated',
  Deleted = 'Deleted',
  NoContent = 'NoContent',
}

export class SuccessFactory {
  static createSuccess<T>(type: SuccessTypes, message: string, data?: T): SuccessResponse<T> {
    switch (type) {
      case SuccessTypes.Created:
        return new SuccessResponse(StatusCodes.CREATED, message, 'CREATED', data);
      case SuccessTypes.Updated:
        return new SuccessResponse(StatusCodes.OK, message, 'UPDATED', data);
      case SuccessTypes.Deleted:
        return new SuccessResponse(StatusCodes.OK, message, 'DELETED', data);
      case SuccessTypes.NoContent:
        return new SuccessResponse(StatusCodes.NO_CONTENT, message, 'NO_CONTENT');
      case SuccessTypes.Ok:
      default:
        return new SuccessResponse(StatusCodes.OK, message, 'OK', data);
    }
  }
}