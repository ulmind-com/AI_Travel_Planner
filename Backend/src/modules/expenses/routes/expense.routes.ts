import express from 'express';
import {
    addExpense,
    getGroupExpenses,
    getExpenseSummary,
    sendExpenseReportEmail,
    getUserExpenses,
    updateExpense,
    deleteExpense,
    getExpenseGraph
} from '../controllers/expenseController';
import protect from '../../../shared/middleware/firebaseAuthMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /api/v1/expenses/add
router.post('/add', addExpense);

// GET /api/v1/expenses/user  (MUST come before /:groupId wildcard)
router.get('/user', getUserExpenses);

// GET /api/v1/expenses/graph/:groupId  (MUST come before /:groupId wildcard)
router.get('/graph/:groupId', getExpenseGraph);

// GET /api/v1/expenses/summary/:groupId  (MUST come before /:groupId wildcard)
router.get('/summary/:groupId', getExpenseSummary);

// POST /api/v1/expenses/summary/:groupId/send-email  (MUST come before /:groupId wildcard)
router.post('/summary/:groupId/send-email', sendExpenseReportEmail);

// GET /api/v1/expenses/group/:groupId
router.get('/group/:groupId', getGroupExpenses);

// GET /api/v1/expenses/:groupId  (wildcard - must be LAST among GET routes)
router.get('/:groupId', getGroupExpenses);

// PUT /api/v1/expenses/:id
router.put('/:id', updateExpense);

// DELETE /api/v1/expenses/:id
router.delete('/:id', deleteExpense);

export default router;
