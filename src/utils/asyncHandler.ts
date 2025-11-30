import { Request, Response, NextFunction, RequestHandler } from "express";

export function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response,
>(
  handler: (req: Req, res: Res, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next: NextFunction) => {
    Promise.resolve(handler(req as Req, res as Res, next)).catch(next);
  };
}
