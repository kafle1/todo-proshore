import dotenv from 'dotenv';
import { plainToInstance } from 'class-transformer';
import { IsString, IsNotEmpty, validateSync } from 'class-validator';

dotenv.config();

class EnvConfig {
  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @IsString()
  @IsNotEmpty()
  DB_PORT!: string;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME!: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  DB_DATABASE!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  ACCESS_TOKEN_EXPIRES_IN!: string;

  @IsString()
  @IsNotEmpty()
  REFRESH_TOKEN_EXPIRES_IN!: string;

  @IsString()
  @IsNotEmpty()
  RESET_PASSWORD_EXPIRES_IN!: string;

  @IsString()
  @IsNotEmpty()
  FRONTEND_URL!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_HOST!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_PORT!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_USER!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_PASS!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_FROM!: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_ID!: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_SECRET!: string;
}

const envConfig = plainToInstance(EnvConfig, process.env, { enableImplicitConversion: true });
const errors = validateSync(envConfig, { skipMissingProperties: false });

if (errors.length > 0) {
  console.error('Environment validation failed. Errors:', errors);
  process.exit(1);
}

export default {
  host: envConfig.DB_HOST,
  port: parseInt(envConfig.DB_PORT, 10),
  username: envConfig.DB_USERNAME,
  password: envConfig.DB_PASSWORD,
  database: envConfig.DB_DATABASE,
  jwtSecret: envConfig.JWT_SECRET,
  accessTokenExpiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN,
  MAIL_HOST: envConfig.MAIL_HOST,
  MAIL_PORT: envConfig.MAIL_PORT,
  MAIL_USER: envConfig.MAIL_USER,
  MAIL_PASS: envConfig.MAIL_PASS,
  RESET_PASSWORD_EXPIRES_IN: envConfig.RESET_PASSWORD_EXPIRES_IN,
  FRONTEND_URL: envConfig.FRONTEND_URL,
  MAIL_FROM: envConfig.MAIL_FROM,
  googleClientId: envConfig.GOOGLE_CLIENT_ID,
  googleClientSecret: envConfig.GOOGLE_CLIENT_SECRET,
}; 