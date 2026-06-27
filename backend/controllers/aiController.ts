import { Request, Response } from 'express';
import { success, error } from '../utils/responseHelper';
import * as aiEngine from '../services/aiEngine';

export const getInsights = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const insights = await aiEngine.generateInsights(data);
    return success(res, insights, 'Insights generated successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
