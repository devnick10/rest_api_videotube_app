import z from "zod";

const getVideoCommentsParamsSchema = z.object({
  videoId: z.string(),
});

const getVideoCommentsQuerySchema = z.object({
  page: z.number().default(1).optional(),
  limit: z.number().default(10).optional(),
});

const addCommentParamsSchema = z.object({
  videoId: z.string(),
});

const addCommentSchema = z.object({
  content: z.string(),
});

const updateCommentSchema = z.object({
  content: z.string(),
});

const updateCommentParamsSchema = z.object({
  commentId: z.string(),
});

const deleteCommentSchema = z.object({
  commentId: z.string(),
});

export {
  getVideoCommentsParamsSchema,
  getVideoCommentsQuerySchema,
  addCommentParamsSchema,
  addCommentSchema,
  updateCommentSchema,
  updateCommentParamsSchema,
  deleteCommentSchema,
};
