import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Load the OpenAPI specification from YAML file
const yamlPath = path.join(__dirname, '../docs/api.yaml');
let specs: any;

try {
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  specs = yaml.load(yamlContent);
} catch (error) {
  console.error('Error loading OpenAPI YAML file:', error);
  // Fallback to JSDoc if YAML file is not found
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'TodoApp API',
        version: '1.0.0',
        description: `
# TodoApp API Documentation

A comprehensive REST API for managing todos with user authentication, built with Node.js, Express, TypeScript, and MySQL.

## Features
- 🔐 **JWT Authentication** - Secure user authentication with access and refresh tokens
- 🌐 **Google OAuth** - Sign in with Google integration
- 📝 **Todo Management** - Full CRUD operations for todos
- 🔒 **Password Reset** - Secure password reset via email
- 📊 **Filtering** - Filter todos by status (all, completed, upcoming)
- 🛡️ **Security** - Rate limiting, CORS, helmet, input sanitization
- 📈 **Monitoring** - Prometheus metrics endpoint

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting
API is rate limited to 100 requests per 15 minutes per IP address.

## Error Handling
All errors follow a consistent format:
\`\`\`json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
\`\`\`
        `,
        contact: {
          name: 'TodoApp Support',
          email: 'support@todoapp.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        },
        {
          url: 'https://api.todoapp.com',
          description: 'Production server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token obtained from login or register endpoint'
          }
        }
      },
      tags: [
        {
          name: 'Authentication',
          description: 'User authentication and authorization endpoints'
        },
        {
          name: 'Todos',
          description: 'Todo management endpoints'
        },
        {
          name: 'Health',
          description: 'Health check and monitoring endpoints'
        }
      ]
    },
    apis: [
      './src/routes/*.ts',
      './dist/routes/*.js',
      './src/entities/*.ts',
      './dist/entities/*.js'
    ],
  };
  
  specs = swaggerJsdoc(options);
}

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TodoApp API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true
    }
  }));
} 