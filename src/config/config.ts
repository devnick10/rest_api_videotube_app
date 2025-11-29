import dotenv from "dotenv";
dotenv.config();

const _config: { [key: string]: string | undefined } = {
  PORT: process.env.PORT,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  DB_URI: process.env.DB_URI,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  NODE_ENV: process.env.NODE_ENV,
};

export const config = {
  get: (key: string) => {
    const value = _config[key];
    if (!value) {
      console.error(
        `The ${key} variable not found, Make sure to pass envorinment variables!`
      );
      process.exit();
    }
    return value;
  },
};
