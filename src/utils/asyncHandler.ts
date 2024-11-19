import { RequestHandler, Request, Response, NextFunction } from "express";

// we put give asynhandler funtion our controller fun as a parameter on the fuction work we return on error we pass error to next funtion it's not good defination got the point .

const asyncHandler = (
  requestHandler: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch(err => next(err));
  };
};

export { asyncHandler };
