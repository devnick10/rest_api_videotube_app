import z from "zod";

const toggleVideoLikeSchema = z.object({
  videoId: z.string(),
});

const toggleCommentLikeSchema = z.object({
  commentId: z.string(),
});

const toggleTweetLikeSchema = z.object({
  tweetId: z.string(),
});

export {
  toggleVideoLikeSchema,
  toggleCommentLikeSchema,
  toggleTweetLikeSchema,
};
