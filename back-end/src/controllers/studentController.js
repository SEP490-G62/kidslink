// back-end/src/controllers/studentController.js
const mongoose = require('mongoose');
const Student = require('../models/Student');
const ParentStudent = require('../models/ParentStudent');
const Parent = require('../models/Parent');
const User = require('../models/User');
const PickupStudent = require('../models/PickupStudent');
const Pickup = require('../models/Pickup');
// Nếu có StudentClass và Class, bạn có thể mở comment và dùng thêm
// const StudentClass = require('../models/StudentClass');
// const ClassModel = require('../models/Class');

exports.getStudentDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'student_id không hợp lệ' });
    }

    const student = await Student.findById(id).lean();
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy học sinh' });
    }

    // Lấy danh sách phụ huynh của học sinh (qua bảng trung gian ParentStudent)
    const parentLinks = await ParentStudent.find({ student_id: id }).lean();
    const parentIds = parentLinks.map((p) => p.parent_id);

    let parents = [];
    if (parentIds.length > 0) {
      const parentDocs = await Parent.find({ _id: { $in: parentIds } }).lean();
      const userIds = parentDocs.map((p) => p.user_id);
      const userMap = new Map(
        (await User.find({ _id: { $in: userIds } }).lean()).map((u) => [String(u._id), u])
      );

      parents = parentDocs.map((p) => {
        const u = userMap.get(String(p.user_id)) || null;
        const link = parentLinks.find((l) => String(l.parent_id) === String(p._id));
        return {
          parent_id: p._id,
          relationship: link?.relationship || null,
          user: u
            ? {
                user_id: u._id,
                full_name: u.full_name,
                email: u.email,
                phone_number: u.phone_number,
                avatar_url: u.avatar_url,
                status: u.status,
              }
            : null,
        };
      });
    }

    // Lấy danh sách người đón của học sinh (PickupStudent → Pickup)
    const pickupLinks = await PickupStudent.find({ student_id: id }).lean();
    const pickupIds = pickupLinks.map((l) => l.pickup_id);

    let pickups = [];
    if (pickupIds.length > 0) {
      const pickupDocs = await Pickup.find({ _id: { $in: pickupIds } }).lean();
      pickups = pickupDocs.map((p) => ({
        pickup_id: p._id,
        full_name: p.full_name,
        relationship: p.relationship,
        id_card_number: p.id_card_number,
        avatar_url: p.avatar_url,
        phone: p.phone,
      }));
    }

    // Nếu muốn trả cả lớp đang theo học (mở comment nếu có model)
    // const studentClasses = await StudentClass.find({ student_id: id }).lean();
    // const classIds = studentClasses.map((sc) => sc.class_id);
    // let classes = [];
    // if (classIds.length > 0) {
    //   classes = await ClassModel.find({ _id: { $in: classIds } }).lean();
    // }

    return res.json({
      student: {
        _id: student._id,
        full_name: student.full_name,
        dob: student.dob,
        gender: student.gender,
        avatar_url: student.avatar_url,
        status: student.status,
        allergy: student.allergy,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
      parents,
      pickups,
      // classes,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getStudentDetail error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};