import { Router, Request, Response, NextFunction, type RequestHandler } from 'express';
import { isUUID, IsNotEmpty, IsString, IsDateString, MaxLength } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import sanitizeHtml from 'sanitize-html';
import { Todo } from '../entities/Todo.entity';
import { AppDataSource } from '../config/db';
import logger from '../config/logger';
import { User } from '../entities/User.entity';

const router = Router();
const todoRepo = AppDataSource.getRepository(Todo);

// DTO for creating a todo
class CreateTodoDTO {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  shortDescription!: string;

  @IsNotEmpty()
  @IsDateString()
  dateTime!: Date;
}

/**
 * @swagger
 * /api/todos:
 *   post:
 *     summary: Create a new todo
 *     description: |
 *       Creates a new todo item for the authenticated user. All input is sanitized to prevent XSS attacks.
 *       
 *       **Features:**
 *       - Input sanitization with sanitize-html
 *       - Automatic user association
 *       - Validation of required fields
 *       - Date/time scheduling support
 *       
 *       **Authentication Required:**
 *       This endpoint requires a valid JWT access token in the Authorization header.
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTodoRequest'
 *           examples:
 *             simple_todo:
 *               summary: Simple todo example
 *               value:
 *                 name: "Complete project documentation"
 *                 shortDescription: "Write comprehensive API documentation including all endpoints, examples, and error codes"
 *                 dateTime: "2024-01-20T15:30:00Z"
 *             urgent_todo:
 *               summary: Urgent todo with near deadline
 *               value:
 *                 name: "Fix critical bug"
 *                 shortDescription: "Resolve the authentication issue causing login failures"
 *                 dateTime: "2024-01-16T09:00:00Z"
 *     responses:
 *       201:
 *         description: Todo created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174001"
 *               name: "Complete project documentation"
 *               shortDescription: "Write comprehensive API documentation including all endpoints, examples, and error codes"
 *               dateTime: "2024-01-20T15:30:00Z"
 *               isDone: false
 *               userId: "123e4567-e89b-12d3-a456-426614174000"
 *               createdAt: "2024-01-15T10:30:00Z"
 *               updatedAt: "2024-01-15T10:30:00Z"
 *               deletedAt: null
 *       400:
 *         description: Validation error - missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               errors:
 *                 - property: "name"
 *                   constraints:
 *                     isNotEmpty: "name should not be empty"
 *                 - property: "dateTime"
 *                   constraints:
 *                     isDate: "dateTime must be a valid date"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Authorization header required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to create todo"
 */
router.post('/todos', (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = plainToInstance(CreateTodoDTO, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) return res.status(400).json({ errors });
    const user = req.user as User;
    const todo = new Todo();
    todo.name = sanitizeHtml(dto.name);
    todo.shortDescription = sanitizeHtml(dto.shortDescription);
    todo.dateTime = new Date(dto.dateTime);
    todo.user = user;
    todo.userId = user.id;
    await todoRepo.save(todo);
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: Get user's todos with optional filtering
 *     description: |
 *       Retrieves all todos for the authenticated user with optional status filtering. Results are ordered by due date (ascending).
 *       
 *       **Filtering Options:**
 *       - No filter: Returns all todos (completed and upcoming)
 *       - `status=COMPLETED`: Returns only completed todos (isDone = true)
 *       - `status=UPCOMING`: Returns only upcoming/pending todos (isDone = false)
 *       
 *       **Features:**
 *       - User-specific todos only (data isolation)
 *       - Ordered by due date (earliest first)
 *       - Soft-deleted todos are excluded
 *       - Optional status filtering
 *       
 *       **Authentication Required:**
 *       This endpoint requires a valid JWT access token in the Authorization header.
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [COMPLETED, UPCOMING]
 *         required: false
 *         description: Filter todos by completion status
 *         examples:
 *           all:
 *             summary: Get all todos
 *             value: ""
 *           completed:
 *             summary: Get completed todos only
 *             value: "COMPLETED"
 *           upcoming:
 *             summary: Get upcoming todos only
 *             value: "UPCOMING"
 *     responses:
 *       200:
 *         description: Todos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 *             examples:
 *               all_todos:
 *                 summary: All todos (mixed status)
 *                 value:
 *                   - id: "123e4567-e89b-12d3-a456-426614174001"
 *                     name: "Complete project documentation"
 *                     shortDescription: "Write comprehensive API documentation"
 *                     dateTime: "2024-01-20T15:30:00Z"
 *                     isDone: false
 *                     userId: "123e4567-e89b-12d3-a456-426614174000"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *                     deletedAt: null
 *                   - id: "123e4567-e89b-12d3-a456-426614174002"
 *                     name: "Review code changes"
 *                     shortDescription: "Review and approve pending pull requests"
 *                     dateTime: "2024-01-18T14:00:00Z"
 *                     isDone: true
 *                     userId: "123e4567-e89b-12d3-a456-426614174000"
 *                     createdAt: "2024-01-14T09:15:00Z"
 *                     updatedAt: "2024-01-17T16:45:00Z"
 *                     deletedAt: null
 *               completed_only:
 *                 summary: Completed todos only
 *                 value:
 *                   - id: "123e4567-e89b-12d3-a456-426614174002"
 *                     name: "Review code changes"
 *                     shortDescription: "Review and approve pending pull requests"
 *                     dateTime: "2024-01-18T14:00:00Z"
 *                     isDone: true
 *                     userId: "123e4567-e89b-12d3-a456-426614174000"
 *                     createdAt: "2024-01-14T09:15:00Z"
 *                     updatedAt: "2024-01-17T16:45:00Z"
 *                     deletedAt: null
 *               empty_list:
 *                 summary: No todos found
 *                 value: []
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Authorization header required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to retrieve todos"
 */
router.get('/todos', (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string;
    const user = req.user as User;
    const qb = todoRepo.createQueryBuilder('todo').where('todo.userId = :userId', { userId: user.id });
    if (status === 'COMPLETED') {
      qb.andWhere('todo.isDone = :done', { done: true });
    } else if (status === 'UPCOMING') {
      qb.andWhere('todo.isDone = :done', { done: false });
    }
    const todos = await qb.orderBy('todo.dateTime', 'ASC').getMany();
    res.json(todos);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * @swagger
 * /api/todos/{id}:
 *   put:
 *     summary: Update an existing todo
 *     description: |
 *       Updates an existing todo item. Only the todo owner can update their todos. All fields are optional - only provided fields will be updated.
 *       
 *       **Updatable Fields:**
 *       - `name`: Todo title/name (sanitized)
 *       - `shortDescription`: Detailed description (sanitized)
 *       - `dateTime`: Due date and time
 *       - `isDone`: Completion status (boolean)
 *       
 *       **Features:**
 *       - Partial updates (only send fields you want to change)
 *       - Input sanitization for text fields
 *       - User ownership validation
 *       - UUID validation for todo ID
 *       
 *       **Authentication Required:**
 *       This endpoint requires a valid JWT access token in the Authorization header.
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the todo to update
 *         example: "123e4567-e89b-12d3-a456-426614174001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTodoRequest'
 *           examples:
 *             complete_todo:
 *               summary: Mark todo as completed
 *               value:
 *                 isDone: true
 *             update_details:
 *               summary: Update todo details
 *               value:
 *                 name: "Complete project documentation (Updated)"
 *                 shortDescription: "Write comprehensive API documentation with examples and testing guide"
 *                 dateTime: "2024-01-21T15:30:00Z"
 *             reschedule:
 *               summary: Reschedule todo
 *               value:
 *                 dateTime: "2024-01-25T10:00:00Z"
 *             full_update:
 *               summary: Update all fields
 *               value:
 *                 name: "Finalize project documentation"
 *                 shortDescription: "Complete and review all API documentation before release"
 *                 dateTime: "2024-01-22T16:00:00Z"
 *                 isDone: false
 *     responses:
 *       200:
 *         description: Todo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174001"
 *               name: "Complete project documentation (Updated)"
 *               shortDescription: "Write comprehensive API documentation with examples and testing guide"
 *               dateTime: "2024-01-21T15:30:00Z"
 *               isDone: false
 *               userId: "123e4567-e89b-12d3-a456-426614174000"
 *               createdAt: "2024-01-15T10:30:00Z"
 *               updatedAt: "2024-01-16T14:20:00Z"
 *               deletedAt: null
 *       400:
 *         description: Invalid todo ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid ID"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Authorization header required"
 *       404:
 *         description: Todo not found or not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Todo not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to update todo"
 */
router.put('/todos/:id', (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user as User;
    if (!isUUID(id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const todo = await todoRepo.findOneBy({ id, userId: user.id });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    if (req.body.name) todo.name = sanitizeHtml(req.body.name);
    if (req.body.shortDescription) todo.shortDescription = sanitizeHtml(req.body.shortDescription);
    if (req.body.dateTime) todo.dateTime = new Date(req.body.dateTime);
    if (typeof req.body.isDone === 'boolean') todo.isDone = req.body.isDone;
    await todoRepo.save(todo);
    res.json(todo);
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

/**
 * @swagger
 * /api/todos/{id}:
 *   delete:
 *     summary: Delete a todo (soft delete)
 *     description: |
 *       Soft deletes a todo item. The todo is not permanently removed from the database but marked as deleted and will not appear in future queries.
 *       
 *       **Soft Delete Benefits:**
 *       - Data recovery possible if needed
 *       - Audit trail preservation
 *       - Referential integrity maintained
 *       - Compliance with data retention policies
 *       
 *       **Features:**
 *       - User ownership validation
 *       - UUID validation for todo ID
 *       - Audit logging of deletion
 *       - Immediate removal from user's todo list
 *       
 *       **Authentication Required:**
 *       This endpoint requires a valid JWT access token in the Authorization header.
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the todo to delete
 *         example: "123e4567-e89b-12d3-a456-426614174001"
 *     responses:
 *       204:
 *         description: Todo deleted successfully (no content returned)
 *       400:
 *         description: Invalid todo ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid ID"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Authorization header required"
 *       404:
 *         description: Todo not found or not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Todo not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to delete todo"
 */
router.delete('/todos/:id', (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user as User;
    if (!isUUID(id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const todo = await todoRepo.findOneBy({ id, userId: user.id });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    await todoRepo.softRemove(todo);
    logger.info('Todo soft-deleted', { todoId: id, performedBy: user.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}) as RequestHandler);

export default router; 