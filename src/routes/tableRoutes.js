const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable
} = require('../controllers/tableController');

/**
 * GET /api/tables
 * Optional query: number, disponible, minCapacity, maxCapacity
 */
router.get('/', getAllTables);
router.get('/:id', getTableById);
router.post('/', auth, checkRole('admin'), createTable);
router.put('/:id', auth, checkRole('admin'), updateTable);
router.delete('/:id', auth, checkRole('admin'), deleteTable);

module.exports = router;
