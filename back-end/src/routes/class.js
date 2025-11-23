const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  listClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  promoteClass,
} = require("../controllers/classController");

// Áp dụng xác thực cho tất cả routes
router.use(authenticate);

// Chỉ school_admin (và admin) có quyền quản lý lớp
router.get("/", authorize(['school_admin','admin']), listClasses);
router.get("/:id", authorize(['school_admin','admin']), getClassById);
router.post("/", authorize(['school_admin','admin']), createClass);
router.post("/:id/promote", authorize(['school_admin','admin']), promoteClass);
router.put("/:id", authorize(['school_admin','admin']), updateClass);
router.delete("/:id", authorize(['school_admin','admin']), deleteClass);

module.exports = router;
