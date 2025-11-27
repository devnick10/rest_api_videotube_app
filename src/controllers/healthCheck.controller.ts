import { Request } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const healthcheck = asyncHandler<Request>(async (req, res) => {
  res.status(200).json(new ApiResponse(200, "OK", "Health checked passed"));
  return;
});

export default healthcheck;
