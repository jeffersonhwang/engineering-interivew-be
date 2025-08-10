# Task Management API

A RESTful API for task management built with Express.js, TypeScript, PrismaORM and PostgreSQL.

## Features

- User registration and authentication
- Task creation and management

## Requirements

- Node.js (v20+)
- PostgreSQL
- Docker and Docker Compose

## Getting Started

### Local Development

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

Optional: Install VSCode extension [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) and use [calls.http](/calls.http) file to execute requests against the endpoints.

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
    "status": "To do",
    "isArchived": false
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
docker-compose run --rm app sh -c "export DATABASE_URL=postgresql://postgres:postgres@db:5432/task_app_test && npx prisma db push && npm test"
```

