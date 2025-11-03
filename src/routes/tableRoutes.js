const express = require('express');
const router = express.Router();
const {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable
} = require('../controllers/tableController');

/**
 * GET /api/tables
 * Optional query: number, status, minCapacity, maxCapacity
 */
router.get('/', getAllTables);
router.get('/:id', getTableById);
router.post('/', createTable);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);

module.exports = router;
