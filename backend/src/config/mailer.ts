import nodemailer from 'nodemailer';
import env from './env';

const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: Number(env.MAIL_PORT),
  secure: env.MAIL_PORT === '465', // true for port 465, false for other ports
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASS,
  },
});

export default transporter; 