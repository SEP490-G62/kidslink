const School = require('../models/School');
const User = require('../models/User');
const cloudinary = require('../utils/cloudinary');

const pickPayosConfigFields = (config = {}) => {
  const allowedFields = [
    'client_id',
    'api_key',
    'checksum_key',
    'account_number',
    'account_name',
    'bank_code',
    'active',
    'webhook_url'
  ];

  return allowedFields.reduce((acc, field) => {
    if (config[field] !== undefined) {
      acc[field] = config[field];
    }
    return acc;
  }, {});
};

// GET all schools with pagination
const getAllSchools = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { school_name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const [schools, total] = await Promise.all([
      School.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      School.countDocuments(query)
    ]);

    // Get user count for each school
    const schoolsWithUserCount = await Promise.all(
      schools.map(async (school) => {
        const userCount = await User.countDocuments({ school_id: school._id });
        return {
          ...school,
          user_count: userCount
        };
      })
    );

    return res.json({
      success: true,
      data: schoolsWithUserCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getAllSchools error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách trường học',
      error: error.message
    });
  }
};

// GET single school by ID
const getSchoolById = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const school = await School.findById(schoolId).lean();

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy trường học'
      });
    }

    // Get user count
    const userCount = await User.countDocuments({ school_id: school._id });

    return res.json({
      success: true,
      data: {
        ...school,
        user_count: userCount
      }
    });
  } catch (error) {
    console.error('getSchoolById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin trường học',
      error: error.message
    });
  }
};

// CREATE new school
const createSchool = async (req, res) => {
  try {
    const {
      school_name,
      address,
      phone,
      email,
      logo_url,
      qr_data,
      payos_config
    } = req.body;

    // Validate required fields
    if (!school_name || !address) {
      return res.status(400).json({
        success: false,
        message: 'Tên trường học và địa chỉ là bắt buộc'
      });
    }

    // Check unique constraints
    const uniqueChecks = [];
    if (phone) {
      uniqueChecks.push(
        School.findOne({ phone }).then((found) => {
          if (found) {
            throw new Error('Số điện thoại đã tồn tại');
          }
        })
      );
    }
    if (email) {
      uniqueChecks.push(
        School.findOne({ email }).then((found) => {
          if (found) {
            throw new Error('Email đã tồn tại');
          }
        })
      );
    }
    if (qr_data) {
      uniqueChecks.push(
        School.findOne({ qr_data }).then((found) => {
          if (found) {
            throw new Error('QR data đã tồn tại');
          }
        })
      );
    }

    try {
      await Promise.all(uniqueChecks);
    } catch (dupError) {
      return res.status(400).json({
        success: false,
        message: dupError.message
      });
    }

    // Handle logo upload
    let finalLogoUrl = logo_url || 'https://via.placeholder.com/200';
    if (logo_url && logo_url.startsWith('data:image')) {
      try {
        const uploadResult = await cloudinary.uploader.upload(logo_url, {
          folder: 'school-logos',
          resource_type: 'image'
        });
        finalLogoUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Không thể upload logo lên Cloudinary',
          error: uploadError.message
        });
      }
    }

    // Prepare payos_config
    let payosConfigObj = {};
    if (payos_config && typeof payos_config === 'object') {
      payosConfigObj = pickPayosConfigFields(payos_config);
      if (payosConfigObj.active !== undefined) {
        payosConfigObj.active = typeof payosConfigObj.active === 'string' 
          ? payosConfigObj.active === 'true' 
          : Boolean(payosConfigObj.active);
      }
    }

    // Create school
    const school = await School.create({
      school_name,
      address,
      phone: phone || undefined,
      email: email || undefined,
      logo_url: finalLogoUrl,
      status: 1, // Default active
      qr_data: qr_data || undefined,
      payos_config: payosConfigObj
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo trường học thành công',
      data: school
    });
  } catch (error) {
    console.error('createSchool error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo trường học',
      error: error.message
    });
  }
};

// UPDATE school
const updateSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      school_name,
      address,
      phone,
      email,
      status,
      qr_data,
      payos_config,
      logo_url
    } = req.body;

    const school = await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy trường học'
      });
    }

    // Check unique constraints for phone/email/qr_data
    const uniqueChecks = [];
    if (phone && phone !== school.phone) {
      uniqueChecks.push(
        School.findOne({ phone, _id: { $ne: school._id } }).then((found) => {
          if (found) {
            throw new Error('Số điện thoại đã tồn tại ở trường khác');
          }
        })
      );
    }
    if (email && email !== school.email) {
      uniqueChecks.push(
        School.findOne({ email, _id: { $ne: school._id } }).then((found) => {
          if (found) {
            throw new Error('Email đã tồn tại ở trường khác');
          }
        })
      );
    }
    if (qr_data && qr_data !== school.qr_data) {
      uniqueChecks.push(
        School.findOne({ qr_data, _id: { $ne: school._id } }).then((found) => {
          if (found) {
            throw new Error('QR data đã tồn tại ở trường khác');
          }
        })
      );
    }

    try {
      await Promise.all(uniqueChecks);
    } catch (dupError) {
      return res.status(400).json({
        success: false,
        message: dupError.message
      });
    }

    // Update fields
    if (school_name !== undefined) school.school_name = school_name;
    if (address !== undefined) school.address = address;
    if (phone !== undefined) school.phone = phone;
    if (email !== undefined) school.email = email;
    if (status !== undefined) school.status = status;
    if (qr_data !== undefined) school.qr_data = qr_data;

    // Update payos_config
    if (payos_config && typeof payos_config === 'object') {
      const sanitizedConfig = pickPayosConfigFields(payos_config);
      if (!school.payos_config) {
        school.payos_config = {};
      }

      Object.entries(sanitizedConfig).forEach(([key, value]) => {
        if (key === 'active') {
          school.payos_config.active =
            typeof value === 'string' ? value === 'true' : Boolean(value);
        } else {
          school.payos_config[key] = value;
        }
      });
    }

    // Handle logo upload
    if (logo_url) {
      try {
        if (logo_url.startsWith('data:image')) {
          const uploadResult = await cloudinary.uploader.upload(logo_url, {
            folder: 'school-logos',
            resource_type: 'image'
          });
          school.logo_url = uploadResult.secure_url;
        } else {
          school.logo_url = logo_url;
        }
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Không thể upload logo lên Cloudinary',
          error: uploadError.message
        });
      }
    }

    await school.save();

    return res.json({
      success: true,
      message: 'Cập nhật trường học thành công',
      data: school
    });
  } catch (error) {
    console.error('updateSchool error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trường học',
      error: error.message
    });
  }
};

// DELETE school
const deleteSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;

    const school = await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy trường học'
      });
    }

    // Check if school has users
    const userCount = await User.countDocuments({ school_id: schoolId });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa trường học. Trường học này có ${userCount} người dùng. Vui lòng xóa hoặc chuyển người dùng trước.`
      });
    }

    await School.findByIdAndDelete(schoolId);

    return res.json({
      success: true,
      message: 'Xóa trường học thành công'
    });
  } catch (error) {
    console.error('deleteSchool error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa trường học',
      error: error.message
    });
  }
};

// UPDATE school status
const updateSchoolStatus = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Chỉ chấp nhận 0 (inactive) hoặc 1 (active)'
      });
    }

    const school = await School.findById(schoolId);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy trường học'
      });
    }

    school.status = status;
    await school.save();

    // If school is deactivated, users from this school cannot login
    // This is handled in authController login function

    return res.json({
      success: true,
      message: `Đã ${status === 1 ? 'kích hoạt' : 'vô hiệu hóa'} trường học thành công`,
      data: school
    });
  } catch (error) {
    console.error('updateSchoolStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái trường học',
      error: error.message
    });
  }
};

module.exports = {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  updateSchoolStatus
};


