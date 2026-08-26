import 'express';
import { SuccessTypes } from '../../utils/successFactory';

declare global {
  namespace Express {

    export interface Request {
      user: { id: string; role: string };
    }

    interface Response {
      success<T>(type: SuccessTypes, message: string, data?: T): Response;
    }
  }
}

export {};   