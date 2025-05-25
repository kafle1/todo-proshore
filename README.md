# 📝 TodoApp - Full-Stack Task Management Application

A modern, feature-rich todo application built with React, TypeScript, Node.js, and MySQL. Features email verification, Google OAuth, and a beautiful responsive UI.

![TodoApp Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18+-blue)

## ✨ Features

### 🔐 Authentication & Security
- **Email Verification** - OTP-based email verification system
- **JWT Authentication** - Secure access and refresh token system
- **Google OAuth** - Sign in with Google integration
- **Password Reset** - Secure password reset via email
- **Rate Limiting** - API protection against abuse
- **Input Sanitization** - XSS protection with sanitize-html

### 📱 User Interface
- **Modern Design** - Built with shadcn/ui and Tailwind CSS
- **Responsive Layout** - Mobile-first design approach
- **Intuitive UX** - Clean, professional interface
- **Real-time Updates** - Instant UI updates

### 📋 Todo Management
- **CRUD Operations** - Create, read, update, delete todos
- **Status Filtering** - Filter by all, pending, or completed
- **Due Date Tracking** - Visual overdue indicators
- **Rich Descriptions** - Detailed task descriptions
- **Soft Delete** - Safe deletion with recovery options

### 🛠️ Technical Features
- **TypeScript** - Full type safety across the stack
- **API Documentation** - Comprehensive Swagger/OpenAPI docs
- **Docker Support** - Containerized deployment
- **CI/CD Pipeline** - GitHub Actions workflow
- **Database Migrations** - TypeORM with MySQL
- **Error Handling** - Comprehensive error management
- **Logging** - Structured logging with Winston

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/kafle1/todo-proshore.git
cd todo-proshore
```

### 2. Environment Setup
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env with your configuration
# Edit frontend/.env with your configuration
```

### 3. Start with Docker (Recommended)
```bash
# Install dependencies and start all services
make install
make docker-up
```

### 4. Start Development Servers
```bash
# Start backend and frontend in development mode
make dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs

## 📁 Project Structure

```
todo-proshore/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── entities/       # TypeORM entities
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── docs/          # API documentation
│   │   └── index.ts       # Application entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React/TypeScript UI
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── api/           # API client
│   │   └── lib/           # Utilities
│   ├── Dockerfile
│   └── package.json
├── nginx/                 # Nginx configuration
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Docker services
└── Makefile              # Development commands
```

## 🔧 Configuration

### Backend Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=todo_db

# JWT
JWT_SECRET=your_jwt_secret
ACCESS_TOKEN_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=2592000

# Email (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM="TodoApp <your-email@gmail.com>"

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## 📚 API Documentation

The API is fully documented with Swagger/OpenAPI. Access the interactive documentation at:
- **Development**: http://localhost:3000/api-docs
- **Production**: https://your-domain.com/api-docs

### Key Endpoints
- `POST /api/auth/register` - User registration with OTP
- `POST /api/auth/verify-otp` - Email verification
- `POST /api/auth/login` - User login
- `GET /api/todos` - Get user todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

## 🛠️ Development

### Available Commands
```bash
# Install dependencies
make install

# Start development servers
make dev

# Run linting
make lint

# Run tests
make test

# Build for production
make build

# Docker commands
make docker-up      # Start all services
make docker-down    # Stop all services

# View all commands
make help
```

### Development Workflow
1. **Backend**: Auto-reloads with ts-node-dev
2. **Frontend**: Hot module replacement with Vite
3. **Database**: MySQL with TypeORM auto-sync
4. **API Docs**: Auto-generated from code annotations

## 🚀 Deployment

### Docker Deployment
```bash
# Production build and deploy
docker-compose up -d
```

### Manual Deployment
```bash
# Build applications
make build

# Start production servers
cd backend && npm start
cd frontend && npm run preview
```

### CI/CD Pipeline
The project includes GitHub Actions workflow for:
- Automated testing
- Docker image building
- Deployment to production

## 🔒 Security Features

- **Password Hashing** - Argon2 for secure password storage
- **JWT Tokens** - Secure authentication with refresh tokens
- **Rate Limiting** - Protection against brute force attacks
- **Input Validation** - class-validator for request validation
- **CORS Protection** - Configured for production security
- **Helmet.js** - Security headers middleware
- **SQL Injection Protection** - TypeORM query builder

## 🧪 Testing

```bash
# Run all tests
make test

# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && npm test
```

## 📱 Mobile Support

The application is fully responsive and optimized for:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1440px+)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeORM](https://typeorm.io/) - TypeScript ORM
- [React Hook Form](https://react-hook-form.com/) - Form management
- [Lucide Icons](https://lucide.dev/) - Beautiful icons

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the API documentation
- Review the configuration examples

---

**Built with ❤️ by [Niraj Kafle](https://github.com/kafle1)** 