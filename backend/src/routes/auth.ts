import { Router, Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import argon2 from 'argon2';
import { type Secret, sign, verify } from 'jsonwebtoken';
import env from '../config/env';
import { AppDataSource } from '../config/db';
import { User } from '../entities/User.entity';
import { OAuth2Client } from 'google-auth-library';
import { authenticate } from '../middleware/auth';

const router = Router();
const userRepo = AppDataSource.getRepository(User);

// Use a typed JWT secret
const JWT_SECRET: Secret = env.jwtSecret;

class RegisterDTO {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

class LoginDTO {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  password!: string;
}

class VerifyOtpDTO {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  otp!: string;
}

class ResendOtpDTO {
  @IsEmail()
  email!: string;
}

// Helper function to generate OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to generate tokens
function generateTokens(userId: string) {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const accessTokenExp = now + parseInt(env.accessTokenExpiresIn, 10); // 15 minutes from now
  const refreshTokenExp = now + parseInt(env.refreshTokenExpiresIn, 10); // 30 days from now
  
  console.log('🔧 Generating tokens:');
  console.log('- Current time:', new Date(now * 1000).toISOString());
  console.log('- Access token expires:', new Date(accessTokenExp * 1000).toISOString());
  console.log('- Refresh token expires:', new Date(refreshTokenExp * 1000).toISOString());
  
  // @ts-ignore: bypass sign overload mismatch
  const accessToken = sign({ sub: userId, exp: accessTokenExp }, JWT_SECRET) as string;
  // @ts-ignore: bypass sign overload mismatch
  const refreshToken = sign({ sub: userId, exp: refreshTokenExp }, JWT_SECRET) as string;
  return { accessToken, refreshToken };
}

/**
 * @swagger
 * /api/auth/health:
 *   get:
 *     summary: Health check for authentication service
 *     description: Returns the health status of the authentication service. Used for monitoring and load balancer health checks.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             example:
 *               status: "ok"
 *               message: "Auth service is running"
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Auth service is running' });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: |
 *       Creates a new user account with email and password. The password is securely hashed using Argon2.
 *       Upon successful registration, returns JWT tokens for immediate authentication.
 *       
 *       **Security Features:**
 *       - Password hashing with Argon2
 *       - Email uniqueness validation
 *       - Input sanitization and validation
 *       - Rate limiting protection
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             valid_registration:
 *               summary: Valid registration request
 *               value:
 *                 email: "newuser@example.com"
 *                 password: "securePassword123"
 *             minimal_password:
 *               summary: Minimum password length
 *               value:
 *                 email: "user@test.com"
 *                 password: "123456"
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               message: "User registered"
 *               user:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 email: "newuser@example.com"
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/Error'
 *             examples:
 *               validation_error:
 *                 summary: Validation errors
 *                 value:
 *                   errors:
 *                     - property: "email"
 *                       constraints:
 *                         isEmail: "email must be an email"
 *               email_exists:
 *                 summary: Email already registered
 *                 value:
 *                   error: "Email already registered"
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Too many requests, please try again later"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Internal server error"
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('📝 Registration attempt for:', req.body.email);
    const dto = plainToInstance(RegisterDTO, req.body);
    const errors = await validate(dto);
    if (errors.length) { 
      console.log('❌ Validation errors:', errors);
      res.status(400).json({ errors }); 
      return; 
    }
    
    const existing = await userRepo.findOneBy({ email: dto.email });
    if (existing) { 
      console.log('❌ Email already exists:', dto.email);
      res.status(400).json({ error: 'Email already registered' }); 
      return; 
    }
    
    const hashed = await argon2.hash(dto.password);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    const user = userRepo.create({ 
      email: dto.email, 
      password: hashed,
      emailVerificationOtp: otp,
      emailVerificationExpires: otpExpires,
      isEmailVerified: false
    });
    await userRepo.save(user);
    
    // Send OTP email
    try {
      await (await import('../config/mailer')).default.sendMail({
        from: env.MAIL_FROM,
        to: user.email,
        subject: 'Verify Your Email - TodoApp',
        text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to TodoApp!</h2>
            <p>Thank you for registering. Please verify your email address using the code below:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>This verification code will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
        `,
      });
      console.log('✅ OTP email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      // Don't fail registration if email fails, but log it
    }
    
    console.log('✅ User registered, OTP sent:', user.email);
    res.status(201).json({ 
      message: 'Registration successful. Please check your email for verification code.',
      email: user.email,
      requiresVerification: true
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    next(err);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get tokens
 *     description: |
 *       Authenticates a user with email and password credentials. Returns JWT tokens for API access.
 *       
 *       **Token Information:**
 *       - Access Token: Valid for 15 minutes, used for API requests
 *       - Refresh Token: Valid for 30 days, used to get new access tokens
 *       
 *       **Security Features:**
 *       - Secure password verification with Argon2
 *       - Rate limiting protection
 *       - JWT token generation
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             valid_login:
 *               summary: Valid login credentials
 *               value:
 *                 email: "user@example.com"
 *                 password: "securePassword123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               message: "Logged in"
 *               user:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 email: "user@example.com"
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid credentials or validation error
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_credentials:
 *                 summary: Wrong email or password
 *                 value:
 *                   error: "Invalid credentials"
 *               validation_error:
 *                 summary: Missing or invalid fields
 *                 value:
 *                   errors:
 *                     - property: "email"
 *                       constraints:
 *                         isEmail: "email must be an email"
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔐 Login attempt for:', req.body.email);
    const dto = plainToInstance(LoginDTO, req.body);
    const errors = await validate(dto);
    if (errors.length) { 
      console.log('❌ Validation errors:', errors);
      res.status(400).json({ errors }); 
      return; 
    }
    
    const user = await userRepo.findOneBy({ email: dto.email });
    if (!user || !(await argon2.verify(user.password, dto.password))) {
      console.log('❌ Invalid credentials for:', dto.email);
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log('❌ Email not verified for:', dto.email);
      res.status(400).json({ 
        error: 'Email not verified',
        message: 'Please verify your email before logging in.',
        requiresVerification: true,
        email: user.email
      });
      return;
    }
    
    const { accessToken, refreshToken } = generateTokens(user.id);
    user.refreshToken = refreshToken;
    await userRepo.save(user);
    
    console.log('✅ Login successful for:', user.email);
    res.json({ 
      message: 'Logged in',
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    next(err);
  }
});

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify email with OTP
 *     description: |
 *       Verifies a user's email address using the OTP sent during registration.
 *       Upon successful verification, the user can log in normally.
 *       
 *       **Verification Process:**
 *       1. User registers and receives OTP via email
 *       2. User submits email and OTP to this endpoint
 *       3. System validates OTP and expiration
 *       4. Email is marked as verified
 *       5. User can now log in normally
 *       
 *       **Security Features:**
 *       - OTP expiration (10 minutes)
 *       - Single-use OTPs (cleared after verification)
 *       - Rate limiting protection
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to verify
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: 6-digit verification code
 *                 example: "123456"
 *             required: [email, otp]
 *           example:
 *             email: "user@example.com"
 *             otp: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email verified successfully"
 *                 verified:
 *                   type: boolean
 *                   example: true
 *               required: [message, verified]
 *             example:
 *               message: "Email verified successfully"
 *               verified: true
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_otp:
 *                 summary: Invalid OTP
 *                 value:
 *                   error: "Invalid or expired OTP"
 *               validation_error:
 *                 summary: Validation errors
 *                 value:
 *                   errors:
 *                     - property: "otp"
 *                       constraints:
 *                         minLength: "otp must be at least 6 characters"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-otp', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔍 OTP verification attempt for:', req.body.email);
    const dto = plainToInstance(VerifyOtpDTO, req.body);
    const errors = await validate(dto);
    if (errors.length) { 
      console.log('❌ Validation errors:', errors);
      res.status(400).json({ errors }); 
      return; 
    }
    
    const user = await userRepo.findOneBy({ email: dto.email });
    if (!user) {
      console.log('❌ User not found for OTP verification:', dto.email);
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Check if OTP is valid and not expired
    if (!user.emailVerificationOtp || 
        user.emailVerificationOtp !== dto.otp || 
        !user.emailVerificationExpires || 
        user.emailVerificationExpires < new Date()) {
      console.log('❌ Invalid or expired OTP for:', dto.email);
      res.status(400).json({ error: 'Invalid or expired OTP' });
      return;
    }
    
    // Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationExpires = undefined;
    await userRepo.save(user);
    
    console.log('✅ Email verified successfully for:', user.email);
    res.json({ 
      message: 'Email verified successfully',
      verified: true
    });
  } catch (err) {
    console.error('❌ OTP verification error:', err);
    next(err);
  }
});

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP for email verification
 *     description: |
 *       Resends a new OTP to the user's email address for verification.
 *       Can be used if the original OTP expired or was lost.
 *       
 *       **Features:**
 *       - Generates new 6-digit OTP
 *       - 10-minute expiration time
 *       - Rate limiting protection
 *       - Only works for unverified accounts
 *       
 *       **Security Notes:**
 *       - Previous OTP is invalidated
 *       - New expiration time is set
 *       - Only available for registered but unverified users
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to resend OTP to
 *                 example: "user@example.com"
 *             required: [email]
 *           example:
 *             email: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP resent successfully"
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "user@example.com"
 *               required: [message, email]
 *             example:
 *               message: "OTP resent successfully"
 *               email: "user@example.com"
 *       400:
 *         description: Email already verified or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               already_verified:
 *                 summary: Email already verified
 *                 value:
 *                   error: "Email is already verified"
 *               validation_error:
 *                 summary: Invalid email format
 *                 value:
 *                   errors:
 *                     - property: "email"
 *                       constraints:
 *                         isEmail: "email must be an email"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/resend-otp', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔄 OTP resend request for:', req.body.email);
    const dto = plainToInstance(ResendOtpDTO, req.body);
    const errors = await validate(dto);
    if (errors.length) { 
      console.log('❌ Validation errors:', errors);
      res.status(400).json({ errors }); 
      return; 
    }
    
    const user = await userRepo.findOneBy({ email: dto.email });
    if (!user) {
      console.log('❌ User not found for OTP resend:', dto.email);
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    if (user.isEmailVerified) {
      console.log('❌ Email already verified for:', dto.email);
      res.status(400).json({ error: 'Email is already verified' });
      return;
    }
    
    // Generate new OTP
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    user.emailVerificationOtp = otp;
    user.emailVerificationExpires = otpExpires;
    await userRepo.save(user);
    
    // Send OTP email
    try {
      await (await import('../config/mailer')).default.sendMail({
        from: env.MAIL_FROM,
        to: user.email,
        subject: 'Verify Your Email - TodoApp (Resent)',
        text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Email Verification - TodoApp</h2>
            <p>Here's your new verification code:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>This verification code will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      console.log('✅ OTP resent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to resend OTP email:', emailError);
      res.status(500).json({ error: 'Failed to send OTP email' });
      return;
    }
    
    console.log('✅ OTP resent successfully for:', user.email);
    res.json({ 
      message: 'OTP resent successfully',
      email: user.email
    });
  } catch (err) {
    console.error('❌ OTP resend error:', err);
    next(err);
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: |
 *       Exchanges a valid refresh token for new access and refresh tokens. Use this endpoint when your access token expires.
 *       
 *       **Token Lifecycle:**
 *       1. Login/Register to get initial tokens
 *       2. Use access token for API requests
 *       3. When access token expires (15 min), use refresh token to get new tokens
 *       4. Repeat until refresh token expires (30 days)
 *       
 *       **Security Notes:**
 *       - Refresh tokens are single-use (invalidated after refresh)
 *       - New refresh token is provided with each refresh
 *       - Tokens are tied to specific users
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *             example:
 *               message: "Tokens refreshed"
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_token:
 *                 summary: No refresh token provided
 *                 value:
 *                   error: "Refresh token required"
 *               invalid_token:
 *                 summary: Invalid or expired token
 *                 value:
 *                   error: "Invalid refresh token"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔄 Token refresh attempt');
    const { refreshToken } = req.body;
    if (!refreshToken) { 
      console.log('❌ No refresh token provided');
      res.status(401).json({ error: 'Refresh token required' }); 
      return; 
    }
    
    const payload = verify(refreshToken, JWT_SECRET) as { sub: string };
    const user = await userRepo.findOneBy({ id: payload.sub });
    if (!user || user.refreshToken !== refreshToken) { 
      console.log('❌ Invalid refresh token');
      res.status(401).json({ error: 'Invalid refresh token' }); 
      return; 
    }
    
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);
    user.refreshToken = newRefreshToken;
    await userRepo.save(user);
    
    console.log('✅ Tokens refreshed for user:', user.email);
    res.json({ 
      message: 'Tokens refreshed',
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('❌ Token refresh error:', err);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate tokens
 *     description: |
 *       Logs out the user by invalidating their refresh token. This prevents the refresh token from being used to generate new access tokens.
 *       
 *       **Security Notes:**
 *       - Invalidates the refresh token on the server
 *       - Access tokens remain valid until expiration (15 minutes)
 *       - For complete security, client should also discard tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to invalidate (optional)
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Logged out"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🚪 Logout attempt');
    const { refreshToken } = req.body;
    if (refreshToken) {
      try {
        const payload = verify(refreshToken, JWT_SECRET) as { sub: string };
        const user = await userRepo.findOneBy({ id: payload.sub });
        if (user) {
          user.refreshToken = undefined;
          await userRepo.save(user);
          console.log('✅ User logged out:', user.email);
        }
      } catch (err) {
        console.log('⚠️ Invalid refresh token during logout');
      }
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('❌ Logout error:', err);
    next(err);
  }
});

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Authenticate with Google OAuth
 *     description: |
 *       Authenticates a user using Google OAuth ID token. If the user doesn't exist, creates a new account automatically.
 *       
 *       **OAuth Flow:**
 *       1. Client obtains Google ID token from Google OAuth
 *       2. Client sends token to this endpoint
 *       3. Server verifies token with Google
 *       4. Server creates user if needed or finds existing user
 *       5. Server returns JWT tokens for API access
 *       
 *       **Security Features:**
 *       - Google token verification
 *       - Automatic account creation for new users
 *       - Secure random password generation for OAuth users
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleAuthRequest'
 *           example:
 *             token: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjdkYzAyYjg1..."
 *     responses:
 *       200:
 *         description: Google authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               message: "Signed in with Google"
 *               user:
 *                 id: "123e4567-e89b-12d3-a456-426614174000"
 *                 email: "user@gmail.com"
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid or missing Google token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_token:
 *                 summary: No token provided
 *                 value:
 *                   error: "Token is required"
 *               invalid_token:
 *                 summary: Invalid Google token
 *                 value:
 *                   error: "Invalid Google token"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const googleClient = new OAuth2Client(env.googleClientId);
router.post('/google', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔍 Google OAuth request received');
    const { token } = req.body;
    if (!token) { 
      console.log('❌ No Google token provided');
      res.status(400).json({ error: 'Token is required' }); 
      return; 
    }
    
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: env.googleClientId });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) { 
      console.log('❌ Invalid Google token');
      res.status(400).json({ error: 'Invalid Google token' }); 
      return; 
    }
    
    console.log('✅ Google token verified for email:', payload.email);
    
    let user = await userRepo.findOneBy({ email: payload.email });
    if (!user) {
      console.log('📝 Creating new user for Google OAuth');
      const tempPassword = (await import('crypto')).randomBytes(16).toString('hex');
      user = userRepo.create({ email: payload.email, password: await argon2.hash(tempPassword) });
      await userRepo.save(user);
    } else {
      console.log('👤 Existing user found for Google OAuth');
    }
    
    const { accessToken, refreshToken } = generateTokens(user.id);
    user.refreshToken = refreshToken;
    await userRepo.save(user);
    
    console.log('✅ Google OAuth successful for:', user.email);
    res.json({ 
      message: 'Signed in with Google',
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('❌ Google OAuth error:', err);
    next(err);
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: |
 *       Initiates a password reset process by sending a reset link to the user's email address.
 *       
 *       **Reset Process:**
 *       1. User provides email address
 *       2. System generates secure reset token
 *       3. Reset link sent to email (if email exists)
 *       4. User clicks link to reset password
 *       
 *       **Security Features:**
 *       - Secure random token generation
 *       - Token expiration (configurable)
 *       - No user enumeration (same response for valid/invalid emails)
 *       - Rate limiting protection
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *           example:
 *             email: "user@example.com"
 *     responses:
 *       200:
 *         description: Reset email sent (or would be sent if email exists)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "If that email is registered, a reset link has been sent."
 *       400:
 *         description: Missing email address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Email is required"
 *       429:
 *         description: Too many requests (rate limit exceeded)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔑 Password reset request for:', req.body.email);
    const { email } = req.body;
    if (!email) { 
      res.status(400).json({ error: 'Email is required' }); 
      return; 
    }
    
    const user = await userRepo.findOneBy({ email });
    if (user) {
      const token = (await import('crypto')).randomBytes(32).toString('hex');
      user.resetPasswordToken = token;
      user.resetPasswordExpires = new Date(Date.now() + parseInt(env.RESET_PASSWORD_EXPIRES_IN, 10) * 1000);
      await userRepo.save(user);
      
      // Send reset email
      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
      await (await import('../config/mailer')).default.sendMail({
        from: env.MAIL_FROM,
        to: user.email,
        subject: 'Password Reset',
        text: `Reset your password by visiting: ${resetUrl}`,
        html: `<p>Reset your password by clicking <a href="${resetUrl}">here</a></p>`,
      });
      console.log('✅ Password reset email sent to:', email);
    }
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error('❌ Password reset error:', err);
    next(err);
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     description: |
 *       Resets a user's password using a valid reset token received via email.
 *       
 *       **Reset Process:**
 *       1. User receives reset token via email
 *       2. User provides token and new password
 *       3. System validates token and expiration
 *       4. Password is updated and token is invalidated
 *       
 *       **Security Features:**
 *       - Token validation and expiration checking
 *       - Secure password hashing with Argon2
 *       - Single-use tokens (invalidated after use)
 *       - Password strength requirements
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *           example:
 *             token: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 *             newPassword: "newSecurePassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Password has been reset"
 *       400:
 *         description: Invalid or expired token, or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_fields:
 *                 summary: Missing required fields
 *                 value:
 *                   error: "Token and new password are required"
 *               invalid_token:
 *                 summary: Invalid or expired token
 *                 value:
 *                   error: "Invalid or expired token"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔑 Password reset attempt with token');
    const { token, newPassword } = req.body;
    if (!token || !newPassword) { 
      res.status(400).json({ error: 'Token and new password are required' }); 
      return; 
    }
    
    const user = await userRepo.findOneBy({ resetPasswordToken: token });
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      console.log('❌ Invalid or expired reset token');
      res.status(400).json({ error: 'Invalid or expired token' });
      return;
    }
    
    // Update password
    user.password = await argon2.hash(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await userRepo.save(user);
    
    console.log('✅ Password reset successful for:', user.email);
    res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error('❌ Password reset error:', err);
    next(err);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: |
 *       Returns the profile information of the currently authenticated user.
 *       
 *       **Authentication Required:**
 *       This endpoint requires a valid JWT access token in the Authorization header.
 *       
 *       **Usage:**
 *       - Verify user authentication status
 *       - Get user information for UI display
 *       - Validate token before making other API calls
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: User unique identifier
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: User email address
 *                   example: "user@example.com"
 *               required: [id, email]
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               email: "user@example.com"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_token:
 *                 summary: No authorization header
 *                 value:
 *                   error: "Authorization header required"
 *               invalid_token:
 *                 summary: Invalid or expired token
 *                 value:
 *                   error: "Invalid token"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticate, (req: Request, res: Response) => {
  const u = req.user as User;
  console.log('👤 User profile requested for:', u.email);
  res.json({ id: u.id, email: u.email });
});

export default router; 