const School = require('../models/School');
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

const findTargetSchool = async (req) => {
  const role = req.user?.role;
  const schoolIdFromUser = req.user?.school_id;

  if (role === 'school_admin') {
    if (!schoolIdFromUser) {
      const error = new Error('Tài khoản school admin chưa được gán school_id');
      error.statusCode = 400;
      throw error;
    }
    return School.findById(schoolIdFromUser);
  }

  if (req.params.schoolId) {
    return School.findById(req.params.schoolId);
  }

  return School.findOne();
};

const getSchoolInfo = async (req, res) => {
  try {
    const school = await findTargetSchool(req);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

    return res.json({
      success: true,
      data: school
    });
  } catch (error) {
    console.error('getSchoolInfo error:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin trường học',
      error: error.message
    });
  }
};

const updateSchoolInfo = async (req, res) => {
  try {
    const school = await findTargetSchool(req);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin trường học'
      });
    }

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

    if (school_name !== undefined) school.school_name = school_name;
    if (address !== undefined) school.address = address;
    if (phone !== undefined) school.phone = phone;
    if (email !== undefined) school.email = email;
    if (status !== undefined) school.status = status;
    if (qr_data !== undefined) school.qr_data = qr_data;

    if (payos_config && typeof payos_config === 'object') {
      const sanitizedConfig = pickPayosConfigFields(payos_config);
      if (!school.payos_config) {
        school.payos_config = {};
      }

      Object.entries(sanitizedConfig).forEach(([key, value]) => {
        if (key === 'active') {
          // Ensure boolean
          school.payos_config.active =
            typeof value === 'string' ? value === 'true' : Boolean(value);
        } else {
          school.payos_config[key] = value;
        }
      });
    }

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
      message: 'Cập nhật thông tin trường học thành công',
      data: school
    });
  } catch (error) {
    console.error('updateSchoolInfo error:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin trường học',
      error: error.message
    });
  }
};

module.exports = {
  getSchoolInfo,
  updateSchoolInfo
};



