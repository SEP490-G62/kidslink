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
  removeStudentFromClass,
  getEligibleStudents,
  addStudentToClass,
} = require("../controllers/classController");

// Áp dụng xác thực cho tất cả routes
router.use(authenticate);

// Chỉ school_admin (và admin) có quyền quản lý lớp
router.get("/", authorize(['school_admin','admin']), listClasses);
router.get("/:id", authorize(['school_admin','admin']), getClassById);
router.post("/", authorize(['school_admin','admin']), createClass);
router.post("/:id/promote", authorize(['school_admin','admin']), promoteClass);
router.get("/:classId/eligible-students", authorize(['school_admin','admin']), getEligibleStudents);
router.post("/:classId/students", authorize(['school_admin','admin']), addStudentToClass);
router.put("/:id", authorize(['school_admin','admin']), updateClass);
router.delete("/:classId/students/:studentId", authorize(['school_admin','admin']), removeStudentFromClass);
router.delete("/:id", authorize(['school_admin','admin']), deleteClass);

module.exports = router;
