import { Request, Response, NextFunction, RequestHandler } from "express";

export function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response,
>(
  handler: (req: Req, res: Res, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req: any, res: any, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
