import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from "@mui/material";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import api from "services/api";

const TransferClassModal = ({ open, onClose, student, currentClassId, onSuccess }) => {
  const [classes, setClasses] = useState([]);
  const [currentClass, setCurrentClass] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (open && currentClassId) {
      fetchClasses();
    }
  }, [open, currentClassId]);

  const fetchClasses = async () => {
    try {
      setDataLoading(true);
      setSelectedClassId(""); // Reset selection khi mở lại modal
      
      // Lấy thông tin lớp hiện tại để lấy academic_year
      const currentClassRes = await api.get(`/classes/${currentClassId}`, true);
      const currentClassData = currentClassRes.data;
      setCurrentClass(currentClassData);
      const academicYear = currentClassData?.academic_year;

      if (academicYear) {
        // Lấy tất cả lớp cùng năm học
        const classesRes = await api.get(`/classes?academic_year=${academicYear}&limit=100`, true);
        const allClasses = classesRes.data || [];
        
        // Lọc ra lớp hiện tại và các lớp khác
        const otherClasses = allClasses.filter(
          (cls) => cls._id !== currentClassId
        );
        
        setClasses(otherClasses);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách lớp:", error);
      alert("Không thể tải danh sách lớp. Vui lòng thử lại.");
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClassId) {
      alert("Vui lòng chọn lớp để chuyển");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/student/${student._id}/transfer`, { 
        new_class_id: selectedClassId,
        old_class_id: currentClassId
      }, true);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi khi chuyển lớp:", error);
      alert(`Lỗi chuyển lớp: ${error.message || "Vui lòng thử lại"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <ArgonTypography variant="h5" fontWeight="bold">
          Chuyển lớp cho học sinh
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
          <ArgonBox>
            {/* Thông tin học sinh */}
            <ArgonBox mb={3}>
              <ArgonTypography variant="subtitle2" fontWeight="bold" mb={1}>
                Học sinh:
              </ArgonTypography>
              <ArgonTypography variant="body1" fontWeight="medium">
                {student?.full_name || "-"}
              </ArgonTypography>
            </ArgonBox>

            {/* Lớp hiện tại */}
            <ArgonBox mb={3}>
              <ArgonTypography variant="subtitle2" fontWeight="bold" mb={1}>
                Lớp hiện tại:
              </ArgonTypography>
              <ArgonTypography variant="body1" fontWeight="medium" color="info.main">
                {currentClass?.class_name || "Đang tải..."}
              </ArgonTypography>
              {currentClass?.class_age_id?.age_name && (
                <ArgonTypography variant="caption" color="text.secondary">
                  Khối tuổi: {currentClass.class_age_id.age_name}
                </ArgonTypography>
              )}
            </ArgonBox>

            {/* Chọn lớp mới */}
            <ArgonBox mb={2}>
              <ArgonTypography variant="subtitle2" fontWeight="bold" mb={1}>
                Chọn lớp mới <span style={{ color: "red" }}>*</span>
              </ArgonTypography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>-- Chọn lớp --</em>
                  </MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.class_name} - {cls.class_age_id?.age_name || ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {classes.length === 0 && (
                <ArgonTypography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Không có lớp nào khác cùng năm học
                </ArgonTypography>
              )}
            </ArgonBox>
          </ArgonBox>
        )}
      </DialogContent>
      <DialogActions>
        <ArgonButton onClick={onClose} color="secondary" disabled={loading}>
          Hủy
        </ArgonButton>
        <ArgonButton
          onClick={handleSubmit}
          color="info"
          disabled={loading || dataLoading || !selectedClassId || classes.length === 0}
        >
          {loading ? "Đang chuyển..." : "Chuyển lớp"}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

TransferClassModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  student: PropTypes.shape({
    _id: PropTypes.string,
    full_name: PropTypes.string,
  }),
  currentClassId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

TransferClassModal.defaultProps = {
  student: null,
};

export default TransferClassModal;

