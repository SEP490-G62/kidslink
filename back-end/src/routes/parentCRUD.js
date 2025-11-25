const express = require('express');
const router = express.Router();
const parentCRUDController = require('../controllers/parentCRUDController');
const { authenticate, authorize } = require('../middleware/auth');

// CRUD routes for school_admin/admin
router.get('/', authenticate, authorize(['school_admin', 'admin']), parentCRUDController.getAllParents);
router.post('/', authenticate, authorize(['school_admin', 'admin']), parentCRUDController.createParent);
router.post('/link', authenticate, authorize(['school_admin', 'admin']), parentCRUDController.linkExistingParent);
router.put('/:id', authenticate, authorize(['school_admin', 'admin']), parentCRUDController.updateParent);
router.delete('/:id', authenticate, authorize(['school_admin', 'admin']), parentCRUDController.deleteParent);

module.exports = router;
