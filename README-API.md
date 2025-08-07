# Task Management API

A RESTful API for task management built with Express.js, TypeScript, and PostgreSQL.

## Features

- User registration and authentication
- Task creation and management
- Task status updates

## Requirements

- Node.js (v16+)
- PostgreSQL
- Docker and Docker Compose (optional)

## Getting Started

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/task-management-api.git
   cd task-management-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your database credentials and JWT secret.

4. Start PostgreSQL and create a database named `task_app`.

5. Run migrations:
   ```
   npm run migration:run
   ```

6. Start the development server:
   ```
   npm run dev
   ```

### Using Docker

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/task-management-api.git
   cd task-management-api
   ```

2. Start the containers:
   ```
   docker-compose up -d
   ```

3. The API will be available at http://localhost:3000

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

- `POST /api/auth/token` - Get an authentication token (uses Basic Auth)
  ```
  Authorization: Basic dXNlckBleGFtcGxlLmNvbTpzZWN1cmVwYXNzd29yZA==
  ```

### Tasks

All task endpoints require authentication with a Bearer token:
```
Authorization: Bearer your-jwt-token
```

- `GET /api/tasks` - Get all tasks for the authenticated user

- `POST /api/tasks` - Create a new task
  ```json
  {
    "title": "Complete project",
    "description": "Finish the task management API",
    "status": "To do"
  }
  ```

- `PATCH /api/tasks/:task_id` - Update a task
  ```json
  {
    "status": "In Progress",
    "description": "Updated description"
  }
  ```

## Testing

Run tests:
```
npm test
```

## License

ISC
