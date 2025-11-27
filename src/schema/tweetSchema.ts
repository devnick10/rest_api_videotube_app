import z from "zod";

const createTweetSchema = z.object({
  content: z.string().min(20).max(250),
});
const getUserTweetsSchema = z.object({
  userId: z.string(),
});
const updateTweetParamSchema = z.object({
  tweetId: z.string(),
});
const updateTweetSchema = z.object({
  content: z.string().min(1).max(250),
});
const deleteTweetSchema = z.object({
  tweetId: z.string(),
});

export {
  createTweetSchema,
  getUserTweetsSchema,
  updateTweetParamSchema,
  updateTweetSchema,
  deleteTweetSchema,
};
