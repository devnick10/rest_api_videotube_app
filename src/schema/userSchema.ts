import z from "zod";

const registerSchema = z.object({
  fullname: z.string().max(40),
  username: z.string(),
  email: z.email(),
  password: z.string(),
});

const loginSchema = z.object({
  username: z.string(),
  email: z.email(),
  password: z.string(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
});

const updateAccountDetailsSchema = z.object({
  fullname: z.string().max(40),
  username: z.string(),
  email: z.email(),
});

const getUserChannelProfileSchema = z.object({
  username: z.string(),
});

export {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateAccountDetailsSchema,
  getUserChannelProfileSchema,
};
