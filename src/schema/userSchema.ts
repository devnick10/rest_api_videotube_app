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

const fileSchema = z
  .custom<Express.Multer.File>((f) => f !== undefined, {
    message: "Invalid file",
  })
  .refine(
    (f) => ["image/jpeg", "image/png"].includes(f.mimetype),
    "Only JPG/PNG allowed"
  )
  .refine((f) => f.size <= 5 * 1024 * 1024, "Max file size is 5MB");

const multipleUploadSchema = z.object({
  avatar: z.array(fileSchema).max(1).optional(),
  coverImage: z.array(fileSchema).max(1).optional(),
});

const uploadAvatarFileSchema = z.object({
  avatar: z.array(fileSchema).min(1).max(1),
});

const uploadCoverImageFileSchema = z.object({
  coverImage: z.array(fileSchema).min(1).max(1),
});

export {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateAccountDetailsSchema,
  getUserChannelProfileSchema,
  multipleUploadSchema,
  uploadAvatarFileSchema,
  uploadCoverImageFileSchema,
};
