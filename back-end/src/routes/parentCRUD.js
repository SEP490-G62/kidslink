const express = require('express');
const router = express.Router();
const parentCRUDController = require('../controllers/parentCRUDController');
const { authenticate, authorize } = require('../middleware/auth');

// CRUD routes for school_admin/admin
router.post('/', authenticate, authorize(['school_admin', 'admin']), parentCRUDController.createParent);
router.put('/:id', authenticate, authorize(['school_admin', 'admin']), parentCRUDController.updateParent);
router.delete('/:id', authenticate, authorize(['school_admin', 'admin']), parentCRUDController.deleteParent);

module.exports = router;
