import z from "zod";

const toggleSubscriptionSchema = z.object({
  channelId: z.string(),
});
const getUserChannelSubscribersSchema = z.object({
  channelId: z.string(),
});
const getSubscribedChannelsSchema = z.object({
  subscriberId: z.string(),
});

export {
  toggleSubscriptionSchema,
  getUserChannelSubscribersSchema,
  getSubscribedChannelsSchema,
};
