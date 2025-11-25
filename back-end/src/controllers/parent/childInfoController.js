const Parent = require('../../models/Parent');
const ParentStudent = require('../../models/ParentStudent');
const Student = require('../../models/Student');
const StudentClass = require('../../models/StudentClass');
const HealthRecord = require('../../models/HealthRecord');
const PickupStudent = require('../../models/PickupStudent');
const Pickup = require('../../models/Pickup');
const HealthCareStaff = require('../../models/HealthCareStaff');
const HealthNotice = require('../../models/HealthNotice');

const cloudinary = require('../../utils/cloudinary');

// GET /api/parent/child-info/:studentId - Lấy thông tin chi tiết của học sinh
const getChildInfo = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.user.id;

    // Lấy thông tin phụ huynh từ user_id
    const parent = await Parent.findOne({ user_id: userId });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phụ huynh'
      });
    }

    // Kiểm tra học sinh có thuộc về phụ huynh này không
    const parentStudent = await ParentStudent.findOne({
      parent_id: parent._id,
      student_id: studentId
    });

    if (!parentStudent) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông tin học sinh này'
      });
    }

    // Lấy thông tin học sinh
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học sinh'
      });
    }

    // Lấy lớp hiện tại của học sinh (ưu tiên năm học mới nhất)
    const studentClasses = await StudentClass.find({ student_id: studentId })
      .populate({
        path: 'class_id',
        populate: {
          path: 'teacher_id',
          populate: {
            path: 'user_id',
            select: 'full_name phone_number avatar_url'
          }
        }
      });

    // Lấy danh sách người đón
    const pickupStudents = await PickupStudent.find({ student_id: studentId });
    const pickupIds = pickupStudents.map(ps => ps.pickup_id);
    const pickups = await Pickup.find({ _id: { $in: pickupIds } });

    // Lấy lịch sử sức khỏe (HealthRecord)
    const healthRecords = await HealthRecord.find({ student_id: studentId })
      .populate({
        path: 'health_care_staff_id',
        select: 'user_id',
        populate: {
          path: 'user_id',
          select: 'full_name'
        }
      })
      .sort({ checkup_date: -1 })
      .limit(10); // Chỉ lấy 10 bản ghi gần nhất

    // Format health records
    const formattedHealthRecords = healthRecords.map(record => {
      const height = parseFloat(record.height_cm.toString());
      const weight = parseFloat(record.weight_kg.toString());
      
      return {
        _id: record._id,
        type: 'Khám sức khỏe',
        date: new Date(record.checkup_date).toLocaleDateString('vi-VN'),
        height: `${height} cm`,
        weight: `${weight} kg`,
        note: record.note,
        staff: record.health_care_staff_id?.user_id?.full_name || 'N/A'
      };
    });

    // Lấy thông báo sức khỏe (HealthNotice)
    const healthNotices = await HealthNotice.find({ student_id: studentId })
      .populate({
        path: 'health_care_staff_id',
        select: 'user_id',
        populate: {
          path: 'user_id',
          select: 'full_name'
        }
      })
      .sort({ createdAt: -1 })
      .limit(10); // Chỉ lấy 10 bản ghi gần nhất

    // Format health notices
    const formattedHealthNotices = healthNotices.map(notice => {
      return {
        _id: notice._id,
        type: 'Thông báo sức khỏe',
        date: new Date(notice.createdAt).toLocaleDateString('vi-VN'),
        time: notice.notice_time,
        symptoms: notice.symptoms,
        actions_taken: notice.actions_taken,
        medications: notice.medications,
        note: notice.note,
        staff: notice.health_care_staff_id?.user_id?.full_name || 'N/A'
      };
    });

    // Gộp health records và notices lại với nhau, sắp xếp theo ngày
    const allHealthData = [...formattedHealthRecords, ...formattedHealthNotices]
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Sắp xếp mới nhất trước
      })
      .slice(0, 10); // Giới hạn tối đa 10 bản ghi

    // Format student info
    const formattedStudent = {
      _id: student._id,
      full_name: student.full_name,
      dob: new Date(student.dob).toLocaleDateString('vi-VN'),
      age: calculateAge(student.dob),
      gender: student.gender === 0 ? 'Nam' : 'Nữ',
      avatar_url: student.avatar_url,
      status: student.status,
      allergy: student.allergy,
      relationship: parentStudent.relationship
    };

    // Xác định thông tin lớp học hiện tại
    const parseAcademicYear = (ay) => {
      if (!ay || typeof ay !== 'string') return -Infinity;
      const [start] = ay.split('-');
      const startYear = parseInt(start, 10);
      return Number.isFinite(startYear) ? startYear : -Infinity;
    };

    let currentClassInfo = null;
    if (Array.isArray(studentClasses) && studentClasses.length > 0) {
      const sorted = studentClasses
        .filter(sc => sc.class_id)
        .sort((a, b) => {
          const diffYear = parseAcademicYear(b.class_id?.academic_year) - parseAcademicYear(a.class_id?.academic_year);
          if (diffYear !== 0) return diffYear;
          const startA = new Date(a.class_id?.start_date || 0);
          const startB = new Date(b.class_id?.start_date || 0);
          return startB - startA;
        });

      if (sorted.length > 0) {
        const currentClass = sorted[0].class_id;
        currentClassInfo = {
          id: currentClass._id,
          name: currentClass.class_name,
          academicYear: currentClass.academic_year,
          startDate: currentClass.start_date,
          endDate: currentClass.end_date,
          teacher: currentClass.teacher_id ? {
            id: currentClass.teacher_id._id,
            name: currentClass.teacher_id.user_id?.full_name || '',
            phone: currentClass.teacher_id.user_id?.phone_number || '',
            avatar: currentClass.teacher_id.user_id?.avatar_url || ''
          } : null
        };
      }
    }

    // Response
    res.json({
      success: true,
      data: {
        student: formattedStudent,
        pickups: pickups,
        healthRecords: allHealthData,
        healthNoticesCount: healthNotices.length,
        classInfo: currentClassInfo
      }
    });
  } catch (error) {
    console.error('Error getting child info:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin học sinh',
      error: error.message
    });
  }
};

// Helper function to calculate age
function calculateAge(dob) {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// POST /api/parent/pickups/:studentId - Thêm người đón mới
const addPickup = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.user.id;
    const { full_name, relationship, id_card_number, avatar_url, phone } = req.body;

    // Validate input
    if (!full_name || !relationship || !id_card_number || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // Lấy thông tin phụ huynh từ user_id
    const parent = await Parent.findOne({ user_id: userId });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phụ huynh'
      });
    }

    // Kiểm tra học sinh có thuộc về phụ huynh này không
    const parentStudent = await ParentStudent.findOne({
      parent_id: parent._id,
      student_id: studentId
    });

    if (!parentStudent) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thêm người đón cho học sinh này'
      });
    }

    // Tìm tất cả con đang học của parent
    const allParentStudents = await ParentStudent.find({ parent_id: parent._id });
    const allStudentIds = allParentStudents.map(ps => ps.student_id);
    
    // Lấy thông tin để kiểm tra status
    const students = await Student.find({ 
      _id: { $in: allStudentIds },
      status: 1 // Chỉ lấy các con đang học
    });
    
    const activeStudentIds = students.map(s => s._id);

    // Upload avatar to Cloudinary if provided
    let avatarUrl;
    
    if (!avatar_url || avatar_url.trim() === '') {
      // Nếu xóa ảnh (chuỗi rỗng), dùng ảnh mặc định
      avatarUrl = 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png';
    } else if (avatar_url.startsWith('http')) {
      // Đã là URL, giữ nguyên
      avatarUrl = avatar_url;
    } else {
      // base64, upload lên Cloudinary
      try {
        const result = await cloudinary.uploader.upload(avatar_url, {
          folder: 'pickups',
          resource_type: 'image',
        });
        avatarUrl = result.secure_url;
      } catch (error) {
        console.error('Error uploading avatar to Cloudinary:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi upload ảnh lên Cloudinary'
        });
      }
    }

    // Tạo người đón mới
    const newPickup = await Pickup.create({
      full_name,
      relationship,
      id_card_number,
      avatar_url: avatarUrl,
      phone
    });

    // Liên kết với tất cả các con đang học
    const pickupStudentLinks = activeStudentIds.map(studentId => ({
      pickup_id: newPickup._id,
      student_id: studentId
    }));
    
    await PickupStudent.insertMany(pickupStudentLinks);

    res.status(201).json({
      success: true,
      message: `Thêm người đón thành công cho ${activeStudentIds.length} con đang học`,
      data: newPickup
    });
  } catch (error) {
    console.error('Error adding pickup:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm người đón',
      error: error.message
    });
  }
};

// PUT /api/parent/pickups/:pickupId/:studentId - Cập nhật người đón
const updatePickup = async (req, res) => {
  try {
    const { pickupId, studentId } = req.params;
    const userId = req.user.id;
    const { full_name, relationship, id_card_number, avatar_url, phone } = req.body;

    // Validate input
    if (!full_name || !relationship || !id_card_number || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    // Lấy thông tin phụ huynh từ user_id
    const parent = await Parent.findOne({ user_id: userId });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phụ huynh'
      });
    }

    // Kiểm tra học sinh có thuộc về phụ huynh này không
    const parentStudent = await ParentStudent.findOne({
      parent_id: parent._id,
      student_id: studentId
    });

    if (!parentStudent) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật người đón cho học sinh này'
      });
    }

    // Kiểm tra người đón có liên kết với học sinh không
    const pickupStudent = await PickupStudent.findOne({
      pickup_id: pickupId,
      student_id: studentId
    });

    if (!pickupStudent) {
      return res.status(403).json({
        success: false,
        message: 'Người đón này không thuộc về học sinh này'
      });
    }

    // Tìm tất cả học sinh đang học của parent
    const allParentStudents = await ParentStudent.find({ parent_id: parent._id });
    const allStudentIds = allParentStudents.map(ps => ps.student_id);
    
    const students = await Student.find({ 
      _id: { $in: allStudentIds },
      status: 1 // Chỉ lấy các con đang học
    });
    
    const activeStudentIds = students.map(s => s._id);

    // Lấy thông tin pickup hiện tại
    const currentPickup = await Pickup.findById(pickupId);
    
    // Upload avatar to Cloudinary if provided
    let avatarUrl;
    
    if (!avatar_url || avatar_url.trim() === '') {
      // Nếu xóa ảnh (chuỗi rỗng), dùng ảnh mặc định
      avatarUrl = 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png';
    } else if (avatar_url.startsWith('http')) {
      // Đã là URL, giữ nguyên
      avatarUrl = avatar_url;
    } else {
      // base64, upload lên Cloudinary
      try {
        const result = await cloudinary.uploader.upload(avatar_url, {
          folder: 'pickups',
          resource_type: 'image',
        });
        avatarUrl = result.secure_url;
      } catch (error) {
        console.error('Error uploading avatar to Cloudinary:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi upload ảnh lên Cloudinary'
        });
      }
    }

    // Cập nhật thông tin người đón
    const updatedPickup = await Pickup.findByIdAndUpdate(
      pickupId,
      {
        full_name,
        relationship,
        id_card_number,
        avatar_url: avatarUrl,
        phone
      },
      { new: true, runValidators: true }
    );

    if (!updatedPickup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người đón'
      });
    }

    // Đảm bảo người đón được liên kết với tất cả con đang học
    for (const sid of activeStudentIds) {
      const existingLink = await PickupStudent.findOne({
        pickup_id: pickupId,
        student_id: sid
      });
      
      if (!existingLink) {
        await PickupStudent.create({
          pickup_id: pickupId,
          student_id: sid
        });
      }
    }

    res.json({
      success: true,
      message: `Cập nhật người đón thành công cho ${activeStudentIds.length} con đang học`,
      data: updatedPickup
    });
  } catch (error) {
    console.error('Error updating pickup:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật người đón',
      error: error.message
    });
  }
};

// DELETE /api/parent/pickups/:pickupId/:studentId - Xóa người đón
const deletePickup = async (req, res) => {
  try {
    const { pickupId, studentId } = req.params;
    const userId = req.user.id;

    // Lấy thông tin phụ huynh từ user_id
    const parent = await Parent.findOne({ user_id: userId });
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin phụ huynh'
      });
    }

    // Kiểm tra học sinh có thuộc về phụ huynh này không
    const parentStudent = await ParentStudent.findOne({
      parent_id: parent._id,
      student_id: studentId
    });

    if (!parentStudent) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa người đón cho học sinh này'
      });
    }

    // Kiểm tra người đón có liên kết với học sinh không
    const pickupStudent = await PickupStudent.findOne({
      pickup_id: pickupId,
      student_id: studentId
    });

    if (!pickupStudent) {
      return res.status(403).json({
        success: false,
        message: 'Người đón này không thuộc về học sinh này'
      });
    }

    // Tìm tất cả học sinh đang học của parent
    const allParentStudents = await ParentStudent.find({ parent_id: parent._id });
    const allStudentIds = allParentStudents.map(ps => ps.student_id);
    
    const students = await Student.find({ 
      _id: { $in: allStudentIds },
      status: 1 // Chỉ lấy các con đang học
    });
    
    const activeStudentIds = students.map(s => s._id);

    // Xóa liên kết với tất cả các con đang học
    await PickupStudent.deleteMany({
      pickup_id: pickupId,
      student_id: { $in: activeStudentIds }
    });

    // Kiểm tra xem người đón này còn liên kết với học sinh khác không
    const otherLinks = await PickupStudent.find({ pickup_id: pickupId });
    
    // Nếu không còn liên kết nào khác, xóa luôn người đón
    if (otherLinks.length === 0) {
      await Pickup.findByIdAndDelete(pickupId);
    }

    res.json({
      success: true,
      message: `Xóa người đón thành công khỏi ${activeStudentIds.length} con đang học`
    });
  } catch (error) {
    console.error('Error deleting pickup:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa người đón',
      error: error.message
    });
  }
};

module.exports = {
  getChildInfo,
  addPickup,
  updatePickup,
  deletePickup
};

