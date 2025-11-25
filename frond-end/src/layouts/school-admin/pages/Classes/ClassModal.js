import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  Select,
  Grid,
} from "@mui/material";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import api from "services/api";

const ClassModal = ({ open, onClose, classData, onSuccess, isPromoteMode = false }) => {
  const isEdit = !!classData && !isPromoteMode;
  const [formData, setFormData] = useState({
    class_name: "",
    class_age_id: "",
    teacher_id: "",
    teacher_id2: "",
    academic_year: "",
    start_date: "",
    end_date: "",
  });
  const [teachers, setTeachers] = useState([]);
  const [classAges, setClassAges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Tạo danh sách 5 năm học gần nhất
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      years.push(`${startYear}-${endYear}`);
    }
    return years;
  };

  const academicYears = generateAcademicYears();

  useEffect(() => {
    if (open) {
      setDataLoading(true);
      const loadData = async () => {
        const [teachersList, classAgesList] = await Promise.all([
          fetchTeachers(),
          fetchClassAges()
        ]);
        
        setDataLoading(false);
        
        // Sau khi load xong data, set form
        if (isPromoteMode && classData) {
          // Chế độ lên lớp: tự động tăng khối tuổi và năm học
          // Xử lý cả trường hợp class_age_id là object hoặc string
          const currentClassAgeId = classData.class_age_id?._id || classData.class_age_id;
          const currentClassAge = classAgesList.find(age => 
            String(age._id) === String(currentClassAgeId)
          );
          const currentAge = currentClassAge?.age || 0;
          const nextClassAge = classAgesList.find(age => age.age === currentAge + 1);
          
          // Tăng năm học lên 1
          let nextAcademicYear = "";
          if (classData.academic_year) {
            const [startYear, endYear] = classData.academic_year.split('-');
            if (startYear && endYear) {
              const newStartYear = parseInt(startYear) + 1;
              const newEndYear = parseInt(endYear) + 1;
              nextAcademicYear = `${newStartYear}-${newEndYear}`;
            }
          }
          
          // Tính ngày bắt đầu và kết thúc mới (mặc định 5/9 và 31/5)
          let nextStartDate, nextEndDate;
          if (nextAcademicYear) {
            const [startYear, endYear] = nextAcademicYear.split('-');
            nextStartDate = `${startYear}-09-05`; // Mặc định 5/9
            nextEndDate = `${endYear}-05-31`; // Mặc định 31/5
          } else {
            const currentYear = new Date().getFullYear();
            nextStartDate = `${currentYear}-09-05`; // Mặc định 5/9
            nextEndDate = `${currentYear + 1}-05-31`; // Mặc định 31/5
          }
          
          setFormData({
            class_name: classData.class_name || "",
            class_age_id: nextClassAge?._id || "",
            teacher_id: "",
            teacher_id2: "",
            academic_year: nextAcademicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            start_date: nextStartDate,
            end_date: nextEndDate,
          });
        } else if (isEdit && classData) {
          setFormData({
            class_name: classData.class_name || "",
            class_age_id: classData.class_age_id?._id || "",
            teacher_id: classData.teacher_id?._id || "",
            teacher_id2: classData.teacher_id2?._id || "",
            academic_year: classData.academic_year || "",
            start_date: classData.start_date ? classData.start_date.split('T')[0] : "",
            end_date: classData.end_date ? classData.end_date.split('T')[0] : "",
          });
        } else {
          const currentYear = new Date().getFullYear();
          // Set default values với data vừa load
          setFormData({
            class_name: "",
            class_age_id: classAgesList && classAgesList.length > 0 ? classAgesList[0]._id : "",
            teacher_id: "",
            teacher_id2: "",
            academic_year: `${currentYear}-${currentYear + 1}`,
            start_date: `${currentYear}-09-05`, // Mặc định 5/9
            end_date: `${currentYear + 1}-05-31`, // Mặc định 31/5
          });
        }
      };
      loadData();
      setErrors({});
    }
  }, [open, classData, isEdit]);

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/school-admin/calendar/teachers", true);
      // Endpoint trả về { success: true, data: [...] }
      const list = res.data || res.teachers || [];
      setTeachers(list);
      return list;
    } catch (e) {
      console.error("Lỗi tải giáo viên:", e);
      setTeachers([]);
      return [];
    }
  };

  const fetchClassAges = async () => {
    try {
      const res = await api.get("/class-ages", true);
      const list = res.classAges || [];
      setClassAges(list);
      return list;
    } catch (e) {
      console.error("Lỗi tải khối tuổi:", e);
      setClassAges([]);
      return [];
    }
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.class_name.trim()) {
      newErrors.class_name = "Tên lớp là bắt buộc";
    }
    if (!formData.class_age_id) {
      newErrors.class_age_id = "Khối tuổi là bắt buộc";
    }
    if (!formData.teacher_id) {
      newErrors.teacher_id = "Giáo viên chính là bắt buộc";
    }
    if (!formData.academic_year.trim()) {
      newErrors.academic_year = "Năm học là bắt buộc";
    }
    if (!formData.start_date) {
      newErrors.start_date = "Ngày bắt đầu là bắt buộc";
    }
    if (!formData.end_date) {
      newErrors.end_date = "Ngày kết thúc là bắt buộc";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (isPromoteMode && classData) {
        // Gọi API lên lớp
        await api.post(`/classes/${classData._id}/promote`, formData, true);
      } else if (isEdit) {
        await api.put(`/classes/${classData._id}`, formData, true);
      } else {
        await api.post("/classes", formData, true);
      }
      onSuccess();
      onClose();
    } catch (e) {
      console.error("Lỗi lưu lớp:", e);
      alert(
        `Lỗi ${isPromoteMode ? "lên lớp" : isEdit ? "cập nhật" : "tạo"} lớp: ${e.message || "Vui lòng thử lại"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <ArgonTypography variant="h5" fontWeight="bold">
          {isPromoteMode ? "Lên lớp - Tạo lớp mới" : isEdit ? "Chỉnh sửa lớp học" : "Tạo lớp học mới"}
        </ArgonTypography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {dataLoading ? (
          <ArgonBox p={3} textAlign="center">
            <ArgonTypography variant="body2">
              Đang tải dữ liệu...
            </ArgonTypography>
          </ArgonBox>
        ) : (
          <ArgonBox component="form">
            <ArgonBox mb={3}>
              <ArgonTypography variant="caption" color="text" sx={{ fontStyle: 'italic' }}>
                Giáo viên: {teachers.length} | Khối tuổi: {classAges.length}
              </ArgonTypography>
            </ArgonBox>
            <Grid container spacing={3}>
              {/* Tên lớp */}
              <Grid item xs={12} sm={6}>
                <ArgonBox mb={1}>
                  <ArgonTypography variant="caption" fontWeight="medium" color="text">
                    Tên lớp <span style={{ color: 'red' }}>*</span>
                  </ArgonTypography>
                </ArgonBox>
                <TextField
                  fullWidth
                  placeholder="Nhập tên lớp"
                  value={formData.class_name}
                  onChange={handleChange("class_name")}
                  error={!!errors.class_name}
                  helperText={errors.class_name}
                  size="small"
                />
              </Grid>

              {/* Khối tuổi */}
              <Grid item xs={12} sm={6}>
                <ArgonBox mb={1}>
                  <ArgonTypography variant="caption" fontWeight="medium" color="text">
                    Khối tuổi <span style={{ color: 'red' }}>*</span>
                  </ArgonTypography>
                </ArgonBox>
                <FormControl fullWidth error={!!errors.class_age_id} size="small">
                  <Select
                    value={formData.class_age_id}
                    onChange={handleChange("class_age_id")}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>-- Chọn khối tuổi --</em>
                    </MenuItem>
                    {classAges.map((age) => (
                      <MenuItem key={age._id} value={age._id}>
                        {age.age_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.class_age_id && (
                    <ArgonTypography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.class_age_id}
                    </ArgonTypography>
                  )}
                </FormControl>
              </Grid>

              {/* Giáo viên chính */}
              <Grid item xs={12} sm={6}>
                <ArgonBox mb={1}>
                  <ArgonTypography variant="caption" fontWeight="medium" color="text">
                    Giáo viên chính <span style={{ color: 'red' }}>*</span>
                  </ArgonTypography>
                </ArgonBox>
                <FormControl fullWidth required error={!!errors.teacher_id} size="small">
                  <Select
                    value={formData.teacher_id}
                    onChange={handleChange("teacher_id")}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>-- Chọn giáo viên --</em>
                    </MenuItem>
                    {teachers.map((t) => (
                      <MenuItem key={t._id} value={t._id}>
                        {t.user_id?.full_name || t.fullName || "N/A"}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.teacher_id && (
                    <ArgonTypography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.teacher_id}
                    </ArgonTypography>
                  )}
                </FormControl>
              </Grid>

              {/* Giáo viên phụ */}
              <Grid item xs={12} sm={6}>
                <ArgonBox mb={1}>
                  <ArgonTypography variant="caption" fontWeight="medium" color="text">
                    Giáo viên phụ
                  </ArgonTypography>
                </ArgonBox>
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.teacher_id2}
                    onChange={handleChange("teacher_id2")}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>-- Chọn giáo viên --</em>
                    </MenuItem>
                    {teachers.map((t) => (
                      <MenuItem key={t._id} value={t._id}>
                        {t.user_id?.full_name || t.fullName || "N/A"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Năm học */}
              <Grid item xs={12} sm={6}>
                <ArgonBox mb={1}>
                  <ArgonTypography variant="caption" fontWeight="medium" color="text">
                    Năm học <span style={{ color: 'red' }}>*</span>
                  </ArgonTypography>
                </ArgonBox>
                <FormControl fullWidth required error={!!errors.academic_year} size="small">
                  <Select
                    value={formData.academic_year}
                    onChange={handleChange("academic_year")}
                  >
                    {academicYears.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.academic_year && (
                    <ArgonTypography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.academic_year}
                    </ArgonTypography>
                  )}
                </FormControl>
              </Grid>

              {/* Ngày bắt đầu */}
              <Grid item xs={12} sm={6}>
                <ArgonBox mb={1}>
                  <ArgonTypography variant="caption" fontWeight="medium" color="text">
                    Ngày bắt đầu <span style={{ color: 'red' }}>*</span>
                  </ArgonTypography>
                </ArgonBox>
                <TextField
                  fullWidth
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange("start_date")}
                  error={!!errors.start_date}
                  helperText={errors.start_date}
                  size="small"
                />
              </Grid>

              {/* Ngày kết thúc */}
              <Grid item xs={12} sm={6}>
                <ArgonBox mb={1}>
                  <ArgonTypography variant="caption" fontWeight="medium" color="text">
                    Ngày kết thúc <span style={{ color: 'red' }}>*</span>
                  </ArgonTypography>
                </ArgonBox>
                <TextField
                  fullWidth
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange("end_date")}
                  error={!!errors.end_date}
                  helperText={errors.end_date}
                  size="small"
                />
              </Grid>
            </Grid>
          </ArgonBox>
      )}
      </DialogContent>
      <DialogActions>
        <ArgonButton onClick={onClose} color="secondary" disabled={loading}>
          Hủy
        </ArgonButton>
        <ArgonButton onClick={handleSubmit} color="info" disabled={loading || dataLoading}>
          {loading ? "Đang lưu..." : isPromoteMode ? "Tạo lớp mới và lên lớp" : isEdit ? "Cập nhật" : "Tạo mới"}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

ClassModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isPromoteMode: PropTypes.bool,
  classData: PropTypes.shape({
    _id: PropTypes.string,
    class_name: PropTypes.string,
    class_age_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string,
      }),
    ]),
    teacher_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string,
      }),
    ]),
    teacher_id2: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string,
      }),
    ]),
    academic_year: PropTypes.string,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
  }),
  onSuccess: PropTypes.func.isRequired,
};

ClassModal.defaultProps = {
  classData: null,
  isPromoteMode: false,
};

export default ClassModal;
