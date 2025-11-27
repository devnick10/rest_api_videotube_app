import z from "zod";

const getChannelVideosSchema = z.object({
  page: z.number().default(1).optional(),
  limit: z.number().default(10).optional(),
});

export { getChannelVideosSchema };
