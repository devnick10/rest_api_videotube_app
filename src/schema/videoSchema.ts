import z from "zod";

const getAllVideosSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  query: z.string(),
  sortBy: z.string(),
  sortType: z.string(),
  userId: z.string(),
});

const publishVideoSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const getVideoByIdSchema = z.object({
  videoId: z.string(),
});

const updateVideoSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const updateVideoParamsSchema = z.object({
  videoId: z.string(),
});

const deleteVideoSchema = z.object({
  videoId: z.string(),
});

const togglePublishStatusSchema = z.object({
  videoId: z.string(),
});

export {
  deleteVideoSchema,
  getAllVideosSchema,
  getVideoByIdSchema,
  publishVideoSchema,
  togglePublishStatusSchema,
  updateVideoParamsSchema,
  updateVideoSchema,
};
