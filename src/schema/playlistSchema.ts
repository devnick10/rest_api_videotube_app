import z from "zod";

const createPlaylistSchema = z.object({
  name: z.string(),
  description: z.string(),
});
const getUserPlaylistsSchema = z.object({
  userId: z.string(),
});
const getPlaylistByIdSchema = z.object({
  playlistId: z.string(),
});
const addVideoToPlaylistSchema = z.object({
  playlistId: z.string(),
  videoId: z.string(),
});
const removeVideoFromPlaylistSchema = z.object({
  playlistId: z.string(),
  videoId: z.string(),
});
const deletePlaylistSchema = z.object({
  playlistId: z.string(),
});
const updatePlaylistParamsSchema = z.object({
  playlistId: z.string(),
});
const updatePlaylistSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export {
  createPlaylistSchema,
  getUserPlaylistsSchema,
  getPlaylistByIdSchema,
  addVideoToPlaylistSchema,
  removeVideoFromPlaylistSchema,
  deletePlaylistSchema,
  updatePlaylistParamsSchema,
  updatePlaylistSchema,
};
