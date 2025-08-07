# Task Management API Design Document

## 1. Overview

This design document outlines the architecture and implementation details for a Task Management API based on the requirements specified in the project README, using Express.js and PostgreSQL.

### 1.1 Project Summary

We will create a RESTful API for a task management application that allows users to create, update, and view tasks. The API will enforce authentication and authorization to ensure users can only access their own tasks.

## 2. Technology Stack

### 2.1 Core Technologies

- **Language**: TypeScript (as specified in requirements)
- **API Framework**: Express.js for REST API with optional Apollo Server for GraphQL
- **Database**: PostgreSQL with TypeORM or Sequelize ORM
  - Provides strong data integrity and relationship management
  - Excellent support for complex queries and transactions
- **Authentication**: JSON Web Tokens (JWT) with Basic Auth for token endpoint
- **Containerization**: Docker (as specified in requirements)

### 2.2 Third-Party Libraries

- **express**: Web server framework
- **pg**: PostgreSQL client for Node.js
- **typeorm** or **sequelize**: ORM for database interactions
- **jsonwebtoken**: JWT implementation for authentication
- **bcrypt**: Password hashing
- **cors**: Cross-origin resource sharing middleware
- **helmet**: Security middleware
- **winston**: Logging library
- **joi** or **zod**: Request validation
- **apollo-server-express**: (Optional) GraphQL server integration with Express
- **graphql**: (Optional) GraphQL implementation

## 3. API Design

### 3.1 REST API Endpoints

#### Authentication Endpoints

```
POST /api/auth/register - Create a new user account
POST /api/auth/token   - Get an authentication token using Basic Auth
```

#### Task Endpoints

```
GET    /api/tasks           - Get all tasks for authenticated user
POST   /api/tasks           - Create a new task
PATCH  /api/tasks/:task_id  - Update a task (including status changes)
```

### 3.2 GraphQL API (Extra Credit)

We will implement a GraphQL schema with the following operations:

```graphql
type Query {
  tasks: [Task!]!
  task(id: ID!): Task
}

type Mutation {
  createTask(input: TaskInput!): Task!
  updateTask(id: ID!, input: TaskInput!): Task!
}
```

## 4. Database Design

### 4.1 PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task status enum
CREATE TYPE task_status AS ENUM ('To do', 'In Progress', 'Done', 'Archived');

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'To do',
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster task lookup by user
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
```

### 4.2 TypeORM Entities

```typescript
// User entity
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'created_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => Task, task => task.user)
  tasks: Task[];
}

// Task entity
@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['To do', 'In Progress', 'Done', 'Archived'],
    default: 'To do'
  })
  status: string;

  @ManyToOne(() => User, user => user.tasks)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'created_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```

## 5. Authentication & Authorization

### 5.1 Authentication Implementation

#### User Registration

```typescript
// User registration endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if user already exists
    const userRepository = getRepository(User);
    const existingUser = await userRepository.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = userRepository.create({
      email,
      password: hashedPassword
    });
    
    await userRepository.save(user);
    
    // Return success without sending back sensitive data
    return res.status(201).json({ 
      message: 'User registered successfully',
      userId: user.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
```

#### Token Generation with Basic Auth

```typescript
// Token generation endpoint using Basic Auth
router.post('/token', async (req: Request, res: Response) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ 
        message: 'Authentication required',
        authScheme: 'Basic'
      });
    }
    
    // Extract credentials from Basic Auth header
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');
    
    // Validate credentials
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Return the token
    return res.json({
      token,
      expiresIn: 86400, // 24 hours in seconds
      tokenType: 'Bearer'
    });
  } catch (error) {
    console.error('Token generation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
```

### 5.2 Authentication Middleware

```typescript
// Authentication middleware
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: 'Authentication required',
      authScheme: 'Bearer'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
```

## 6. Task Endpoints Implementation

### 6.1 Get All Tasks for Current User

```typescript
// Get all tasks for the authenticated user
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    
    const taskRepository = getRepository(Task);
    const tasks = await taskRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC'
      }
    });
    
    return res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
```

### 6.2 Create a New Task

```typescript
// Create a new task
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.user.userId;
    const { title, description, status = 'To do' } = req.body;
    
    // Validate input
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Validate status
    const validStatuses = ['To do', 'In Progress', 'Done', 'Archived'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status',
        validValues: validStatuses
      });
    }
    
    // Create task
    const taskRepository = getRepository(Task);
    const task = taskRepository.create({
      title,
      description,
      status,
      userId
    });
    
    const savedTask = await taskRepository.save(task);
    
    return res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
```

### 6.3 Update an Existing Task

```typescript
// Update an existing task
router.patch('/:task_id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.task_id);
    const userId = req.user.userId;
    const { title, description, status } = req.body;
    
    // Find the task
    const taskRepository = getRepository(Task);
    const task = await taskRepository.findOne({
      where: { id: taskId }
    });
    
    // Check if task exists
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check ownership
    if (task.userId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to update this task' });
    }
    
    // Validate status if provided
    if (status) {
      const validStatuses = ['To do', 'In Progress', 'Done', 'Archived'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status',
          validValues: validStatuses
        });
      }
    }
    
    // Update task
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    
    // Update the updatedAt timestamp
    task.updatedAt = new Date();
    
    const updatedTask = await taskRepository.save(task);
    
    return res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
```

## 7. Testing Strategy

### 7.1 Testing Framework

- **Jest**: Primary testing framework
- **Supertest**: HTTP assertions for API testing
- **ts-jest**: TypeScript support for Jest

### 7.2 Test Types

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints with database interactions
- **Authentication Tests**: Verify JWT validation and authorization logic

### 7.3 Database Testing

- Use a separate test database
- Implement test fixtures to seed test data
- Use transactions to roll back changes after tests

```typescript
// Example test setup
beforeAll(async () => {
  await createConnection({
    type: 'postgres',
    database: 'task_app_test',
    // other connection options
    synchronize: true,
    dropSchema: true,
  });
});

beforeEach(async () => {
  // Seed test data
  await seedTestData();
});

afterAll(async () => {
  const connection = getConnection();
  await connection.close();
});
```

## 8. Project Structure

```
/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Custom middleware (auth, validation)
│   ├── entities/         # TypeORM entity definitions
│   ├── migrations/       # Database migrations
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── graphql/          # GraphQL schema and resolvers (optional)
│   └── app.ts            # Express application setup
├── tests/                # Test files
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose configuration
├── jest.config.js        # Jest configuration
├── tsconfig.json         # TypeScript configuration
├── ormconfig.js          # TypeORM configuration
└── package.json          # Project dependencies
```

## 9. Docker Configuration

### 9.1 Docker Compose Setup

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://postgres:postgres@db:5432/task_app
      - JWT_SECRET=your_jwt_secret
    depends_on:
      - db
    volumes:
      - ./src:/app/src
    command: npm run dev

  db:
    image: postgres:13
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=task_app
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 9.2 Dockerfile

```dockerfile
FROM node:16-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist
COPY ormconfig.js .

EXPOSE 3000

CMD ["node", "dist/app.js"]
```

## 10. Security Considerations

1. **HTTPS**: Ensure all API endpoints are served over HTTPS to prevent credential interception.

2. **Password Requirements**: Implement password strength requirements during registration.

3. **Rate Limiting**: Apply rate limiting to the `/token` endpoint to prevent brute force attacks:

   ```typescript
   import rateLimit from 'express-rate-limit';

   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // 5 requests per window per IP
     message: { message: 'Too many login attempts, please try again later' }
   });

   router.post('/token', authLimiter, tokenHandler);
   ```

4. **Token Expiration**: Consider the appropriate token expiration time based on your application's security requirements.

5. **CORS Configuration**: Configure CORS properly to restrict which domains can access your API.

## 11. Error Handling

To ensure consistent error handling across all endpoints, we'll implement a simple error handling middleware:

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  return res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Add to app.ts
app.use(errorHandler);
```

## 12. Future Considerations

- Implement rate limiting to prevent abuse
- Add pagination for task lists as they grow
- Add task categories or tags
- Implement task search functionality
- Add task sharing between users
- Implement webhooks for task status changes

This design document provides a comprehensive plan for implementing the Task Management API according to the requirements while maintaining good practices for code quality, scalability, and security.
