import { ZodError } from "zod";

export function parseZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "unknown",
    message: issue.message,
  }));
}
