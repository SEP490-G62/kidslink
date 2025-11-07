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
  InputLabel,
  Select,
  Grid,
} from "@mui/material";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import api from "services/api";

const ClassModal = ({ open, onClose, classData, onSuccess }) => {
  const isEdit = !!classData;
  const [formData, setFormData] = useState({
    class_name: "",
    class_age_id: "",
    teacher_id: "",
    teacher_id2: "",
    academic_year: "",
    start_date: "",
    end_date: "",
    status: 1,
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
        if (isEdit && classData) {
          setFormData({
            class_name: classData.class_name || "",
            class_age_id: classData.class_age_id?._id || "",
            teacher_id: classData.teacher_id?._id || "",
            teacher_id2: classData.teacher_id2?._id || "",
            academic_year: classData.academic_year || "",
            start_date: classData.start_date ? classData.start_date.split('T')[0] : "",
            end_date: classData.end_date ? classData.end_date.split('T')[0] : "",
            status: classData.status !== undefined ? classData.status : 1,
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
            start_date: `${currentYear}-09-01`,
            end_date: `${currentYear + 1}-05-31`,
            status: 1,
          });
        }
      };
      loadData();
      setErrors({});
    }
  }, [open, classData, isEdit]);

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/teachers", true);
      const list = res.teachers || [];
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
      if (isEdit) {
        await api.put(`/classes/${classData._id}`, formData, true);
      } else {
        await api.post("/classes", formData, true);
      }
      onSuccess();
      onClose();
    } catch (e) {
      console.error("Lỗi lưu lớp:", e);
      alert(
        `Lỗi ${isEdit ? "cập nhật" : "tạo"} lớp: ${e.message || "Vui lòng thử lại"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <ArgonTypography variant="h5" fontWeight="bold">
          {isEdit ? "Chỉnh sửa lớp học" : "Tạo lớp học mới"}
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
            <ArgonBox mb={2}>
              <ArgonTypography variant="caption" color="text">
                Giáo viên: {teachers.length} | Khối tuổi: {classAges.length}
              </ArgonTypography>
            </ArgonBox>
            <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tên lớp"
                required
                value={formData.class_name}
                onChange={handleChange("class_name")}
                error={!!errors.class_name}
                helperText={errors.class_name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.class_age_id}>
                <InputLabel>Khối tuổi *</InputLabel>
                <Select
                  value={formData.class_age_id}
                  onChange={handleChange("class_age_id")}
                  label="Khối tuổi *"
                >
                  <MenuItem value="">-- Chọn khối tuổi --</MenuItem>
                  {classAges.map((age) => (
                    <MenuItem key={age._id} value={age._id}>
                      {age.age_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.class_age_id && (
                  <ArgonTypography variant="caption" color="error">
                    {errors.class_age_id}
                  </ArgonTypography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.teacher_id}>
                <InputLabel id="teacher-label" shrink>Giáo viên chính *</InputLabel>
                <Select
                  labelId="teacher-label"
                  value={formData.teacher_id}
                  onChange={handleChange("teacher_id")}
                  label="Giáo viên chính *"
                  displayEmpty
                  notched
                >
                  <MenuItem value="">
                    <em>-- Chọn giáo viên --</em>
                  </MenuItem>
                  {teachers.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.user_id?.full_name || "N/A"}
                    </MenuItem>
                  ))}
                </Select>
                {errors.teacher_id && (
                  <ArgonTypography variant="caption" color="error">
                    {errors.teacher_id}
                  </ArgonTypography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="teacher2-label" shrink>Giáo viên phụ</InputLabel>
                <Select
                  labelId="teacher2-label"
                  value={formData.teacher_id2}
                  onChange={handleChange("teacher_id2")}
                  label="Giáo viên phụ"
                  displayEmpty
                  notched
                >
                  <MenuItem value="">
                    <em>-- Chọn giáo viên --</em>
                  </MenuItem>
                  {teachers.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.user_id?.full_name || "N/A"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.academic_year}>
                <InputLabel>Năm học *</InputLabel>
                <Select
                  value={formData.academic_year}
                  onChange={handleChange("academic_year")}
                  label="Năm học *"
                >
                  {academicYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
                {errors.academic_year && (
                  <ArgonTypography variant="caption" color="error">
                    {errors.academic_year}
                  </ArgonTypography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ngày bắt đầu"
                type="date"
                required
                value={formData.start_date}
                onChange={handleChange("start_date")}
                error={!!errors.start_date}
                helperText={errors.start_date}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ngày kết thúc"
                type="date"
                required
                value={formData.end_date}
                onChange={handleChange("end_date")}
                error={!!errors.end_date}
                helperText={errors.end_date}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleChange("status")}
                  label="Trạng thái"
                >
                  <MenuItem value={1}>Hoạt động</MenuItem>
                  <MenuItem value={0}>Không hoạt động</MenuItem>
                </Select>
              </FormControl>
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
          {loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

ClassModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
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
    status: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  onSuccess: PropTypes.func.isRequired,
};

ClassModal.defaultProps = {
  classData: null,
};

export default ClassModal;
