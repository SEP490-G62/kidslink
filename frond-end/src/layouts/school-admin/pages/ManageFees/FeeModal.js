import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Chip,
  Box,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Grid,
  Divider,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import schoolAdminService from "services/schoolAdminService";
import api from "services/api";

const SectionCard = ({ icon, title, subtitle, children }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 3,
      border: "1px solid #e3f2fd",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(243,248,255,0.98) 100%)",
      boxShadow: "0 12px 30px rgba(25,118,210,0.12)",
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#e3f2fd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1976d2",
        }}
      >
        {icon}
      </Box>
      <Box>
        <ArgonTypography variant="subtitle1" fontWeight="bold" color="dark">
          {title}
        </ArgonTypography>
        {subtitle && (
          <ArgonTypography variant="caption" color="text" fontWeight="regular">
            {subtitle}
          </ArgonTypography>
        )}
      </Box>
    </Stack>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Paper>
);

SectionCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const FeeModal = ({ open, onClose, feeData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [originalDueDates, setOriginalDueDates] = useState({}); // Map class_id -> original due_date
  const [formData, setFormData] = useState({
    fee_name: "",
    description: "",
    amount: "",
    class_ids: [], // Array of class_id (for create mode)
    due_date: "", // Common due_date for all classes (create mode)
    class_fees: [], // Array of { class_id, due_date } (for edit mode)
    late_fee_type: "none",
    late_fee_value: "",
    late_fee_description: "",
  });

  const isEditMode = !!feeData;

  // Load classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get("/classes", true);
        if (res && res.data && Array.isArray(res.data)) {
          setClasses(res.data);
        } else if (res && Array.isArray(res)) {
          setClasses(res);
        }
      } catch (e) {
        console.error("Lỗi khi tải danh sách lớp:", e);
        setError("Không thể tải danh sách lớp học. Vui lòng thử lại.");
      }
    };
    if (open) {
      fetchClasses();
    }
  }, [open]);

  // Load fee data when editing
  useEffect(() => {
    if (open && feeData) {
      // Convert class_fees or classes to class_fees format
      let classFees = [];
      const originalDueDatesMap = {};
      
      if (feeData.class_fees && Array.isArray(feeData.class_fees)) {
        classFees = feeData.class_fees.map(cf => {
          // Ensure class_id is a string
          const classId = typeof cf.class_id === 'object' && cf.class_id?._id 
            ? cf.class_id._id.toString() 
            : (cf.class_id?.toString() || String(cf.class_id));
          const dueDateStr = cf.due_date ? new Date(cf.due_date).toISOString().split('T')[0] : '';
          // Store original due_date
          if (dueDateStr) {
            originalDueDatesMap[classId] = dueDateStr;
          }
          return {
            class_id: classId,
            due_date: dueDateStr
          };
        });
      } else if (feeData.classes && Array.isArray(feeData.classes)) {
        classFees = feeData.classes.map(c => {
          // Ensure class_id is a string
          const classId = (c._id || c.class_id)?.toString() || String(c._id || c.class_id);
          const dueDateStr = c.due_date ? new Date(c.due_date).toISOString().split('T')[0] : '';
          // Store original due_date
          if (dueDateStr) {
            originalDueDatesMap[classId] = dueDateStr;
          }
          return {
            class_id: classId,
            due_date: dueDateStr
          };
        });
      } else if (feeData.class_ids && Array.isArray(feeData.class_ids)) {
        // Fallback: convert class_ids to class_fees format
        const now = new Date();
        const defaultDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];
        classFees = feeData.class_ids.map(classId => {
          const classIdStr = String(classId);
          originalDueDatesMap[classIdStr] = defaultDueDateStr;
          return {
            class_id: classIdStr,
            due_date: defaultDueDateStr
          };
        });
      }
      
      setOriginalDueDates(originalDueDatesMap);
      setFormData({
        fee_name: feeData.fee_name || "",
        description: feeData.description || "",
        amount: feeData.amount || "",
        class_fees: classFees,
        late_fee_type: feeData.late_fee_type || "none",
        late_fee_value: feeData.late_fee_value !== undefined && feeData.late_fee_value !== null
          ? feeData.late_fee_value.toString()
          : "",
        late_fee_description: feeData.late_fee_description || "",
      });
      setError(null);
    } else if (open && !feeData) {
      // Reset form for create mode
      const now = new Date();
      const defaultDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setOriginalDueDates({});
      setFormData({
        fee_name: "",
        description: "",
        amount: "",
        class_ids: [],
        due_date: defaultDueDate.toISOString().split('T')[0],
        class_fees: [],
        late_fee_type: "none",
        late_fee_value: "",
        late_fee_description: "",
      });
      setError(null);
    } else if (!open) {
      // Reset when modal is closed
      setOriginalDueDates({});
    }
  }, [open, feeData]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      if (field === "late_fee_type" && value === "none") {
        return {
          ...prev,
          late_fee_type: value,
          late_fee_value: "",
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
    setError(null);
  };

  const handleClassToggle = (classId) => {
    if (isEditMode) {
      // Edit mode: handle class_fees with individual due_date
      setFormData((prev) => {
        const currentClassFees = prev.class_fees || [];
        const classIdStr = String(classId);
        const existingIndex = currentClassFees.findIndex(cf => String(cf.class_id) === classIdStr);
        
        if (existingIndex >= 0) {
          // Remove class
          return {
            ...prev,
            class_fees: currentClassFees.filter((_, index) => index !== existingIndex),
          };
        } else {
          // Add class with default due_date (end of current month)
          const now = new Date();
          const defaultDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return {
            ...prev,
            class_fees: [
              ...currentClassFees,
              {
                class_id: classIdStr,
                due_date: defaultDueDate.toISOString().split('T')[0]
              }
            ],
          };
        }
      });
    } else {
      // Create mode: handle class_ids only
      setFormData((prev) => {
        const currentIds = prev.class_ids || [];
        const classIdStr = String(classId);
        const isSelected = currentIds.some(id => String(id) === classIdStr);
        return {
          ...prev,
          class_ids: isSelected
            ? currentIds.filter((id) => String(id) !== classIdStr)
            : [...currentIds, classIdStr],
        };
      });
    }
  };

  const handleDueDateChange = (classId, dueDate) => {
    setFormData((prev) => {
      const currentClassFees = prev.class_fees || [];
      const classIdStr = String(classId);
      const existingIndex = currentClassFees.findIndex(cf => String(cf.class_id) === classIdStr);
      
      if (existingIndex >= 0) {
        // Update due_date for existing class
        const updated = [...currentClassFees];
        updated[existingIndex] = {
          ...updated[existingIndex],
          due_date: dueDate
        };
        return {
          ...prev,
          class_fees: updated,
        };
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.fee_name || !formData.fee_name.trim()) {
      setError("Tên phí là bắt buộc");
      return;
    }
    if (!formData.description || !formData.description.trim()) {
      setError("Mô tả là bắt buộc");
      return;
    }
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) < 0) {
      setError("Số tiền phải là số hợp lệ và >= 0");
      return;
    }
    const lateFeeType = formData.late_fee_type || "none";
    const lateFeeValueNumber = formData.late_fee_value === "" ? 0 : Number(formData.late_fee_value);
    if (lateFeeType !== "none") {
      if (!Number.isFinite(lateFeeValueNumber) || lateFeeValueNumber <= 0) {
        setError("Giá trị phụ phí phải lớn hơn 0");
        return;
      }
      if (lateFeeType === "percentage" && lateFeeValueNumber > 100) {
        setError("Phụ phí phần trăm không được vượt quá 100%");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      let submitData;
      if (isEditMode) {
        // Edit mode: use class_fees with individual due_date
        submitData = {
          fee_name: formData.fee_name.trim(),
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
          late_fee_type: lateFeeType,
          late_fee_value: lateFeeType === "none" ? 0 : lateFeeValueNumber,
          late_fee_description: formData.late_fee_description?.trim() || "",
          class_fees: formData.class_fees.map(cf => ({
            class_id: cf.class_id,
            due_date: cf.due_date || null
          })),
        };
      } else {
        // Create mode: use class_ids with common due_date
        submitData = {
          fee_name: formData.fee_name.trim(),
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
          class_ids: formData.class_ids,
          due_date: formData.due_date || null,
          late_fee_type: lateFeeType,
          late_fee_value: lateFeeType === "none" ? 0 : lateFeeValueNumber,
          late_fee_description: formData.late_fee_description?.trim() || "",
        };
      }

      let res;
      if (isEditMode) {
        res = await schoolAdminService.updateFee(feeData._id, submitData);
      } else {
        res = await schoolAdminService.createFee(submitData);
      }

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } catch (e) {
      console.error("Lỗi khi lưu phí:", e);
      setError(e.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^\d.]/g, "");
    if (value === "" || value === ".") {
      handleChange("amount", "");
      return;
    }
    const parts = value.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    handleChange("amount", value);
  };

  const classIds = Array.isArray(formData.class_ids) ? formData.class_ids : [];
  const classFees = Array.isArray(formData.class_fees) ? formData.class_fees : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          background: "linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
          color: "#ffffff",
          py: 2.5,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AttachMoneyIcon sx={{ fontSize: 28 }} />
          <ArgonTypography variant="h5" fontWeight="bold" color="#ffffff">
            {isEditMode ? "Chỉnh sửa phí" : "Tạo phí mới"}
          </ArgonTypography>
        </Stack>
        <ArgonButton
          onClick={onClose}
          sx={{
            minWidth: "auto",
            width: 40,
            height: 40,
            borderRadius: "50%",
            p: 0,
            color: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.3)",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.3)",
              borderColor: "rgba(255,255,255,0.5)",
              transform: "scale(1.05)",
            },
            transition: "all 0.2s ease",
          }}
        >
          <CloseIcon sx={{ fontSize: 22 }} />
        </ArgonButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              "& .MuiAlert-message": {
                fontWeight: 500,
              },
            }}
          >
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          <SectionCard
            icon={<InfoOutlinedIcon />}
            title="Thông tin phí"
            subtitle="Nhập các chi tiết cơ bản cho khoản thu"
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                  Tên phí <span style={{ color: "#d32f2f" }}>*</span>
                </ArgonTypography>
                <TextField
                  fullWidth
                  placeholder="Nhập tên phí..."
                  value={formData.fee_name}
                  onChange={(e) => handleChange("fee_name", e.target.value)}
                  variant="outlined"
                  sx={{ flex: 1, minWidth: 200, maxWidth: 1000,  
                    width: '100%',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      width: '100%',
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputBase-input': {
                      width: '100% !important',
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                  Mô tả <span style={{ color: "#d32f2f" }}>*</span>
                </ArgonTypography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Nhập mô tả phí..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  variant="outlined"
                  sx={{ flex: 1, minWidth: 200, maxWidth: 1000,  
                    width: '100%',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      width: '100%',
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputBase-input': {
                      width: '100% !important',
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                  Số tiền (VNĐ) <span style={{ color: "#d32f2f" }}>*</span>
                </ArgonTypography>
                <TextField
                  fullWidth
                  placeholder="Nhập số tiền..."
                  value={formData.amount}
                  onChange={handleAmountChange}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <ArgonTypography variant="body2" color="#757575" sx={{ mr: 1 }}>
                        VNĐ
                      </ArgonTypography>
                    ),
                  }}
                  sx={{ flex: 1, minWidth: 200, maxWidth: 400,  
                    width: '100%',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      width: '100%',
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputBase-input': {
                      width: '100% !important',
                    }
                  }}
                />
                {formData.amount && !isNaN(parseFloat(formData.amount)) && (
                  <ArgonTypography
                    variant="caption"
                    color="#1976d2"
                    sx={{ mt: 0.5, display: "block", fontWeight: 500 }}
                  >
                    {formatCurrency(formData.amount)} VNĐ
                  </ArgonTypography>
                )}
              </Grid>

              {!isEditMode && (
                <Grid item xs={12} md={6}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    Hạn thanh toán <span style={{ color: "#d32f2f" }}>*</span>
                  </ArgonTypography>
                  <TextField
                    type="date"
                    fullWidth
                    value={formData.due_date || ''}
                    onChange={(e) => handleChange("due_date", e.target.value)}
                    variant="outlined"
                    sx={{ flex: 1, minWidth: 200, maxWidth: 400,  
                    width: '100%',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      width: '100%',
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputBase-input': {
                      width: '100% !important',
                    }
                  }}
                  />
                </Grid>
              )}
            </Grid>
          </SectionCard>

          <SectionCard
            icon={<GavelOutlinedIcon />}
            title="Phụ phí quá hạn"
            subtitle="Thiết lập phụ phí khi phụ huynh thanh toán chậm"
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                  Loại phụ phí
                </ArgonTypography>
                <FormControl fullWidth>
                  <Select
                    value={formData.late_fee_type}
                    onChange={(e) => handleChange("late_fee_type", e.target.value)}
                    displayEmpty
                    renderValue={(value) => {
                      const map = {
                        none: "Không áp dụng",
                        fixed: "Cố định (VNĐ)",
                        percentage: "Phần trăm (%)",
                      };
                      return map[value] || "Chọn loại phụ phí";
                    }}
                  >
                    <MenuItem value="none">Không áp dụng</MenuItem>
                    <MenuItem value="fixed">Cố định (VNĐ)</MenuItem>
                    <MenuItem value="percentage">Phần trăm (%)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.late_fee_type !== "none" && (
                <Grid item xs={12} md={6}>
                  <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                    {formData.late_fee_type === "fixed" ? "Giá trị phụ phí (VNĐ)" : "Phụ phí (%)"}
                  </ArgonTypography>
                  <TextField
                    type="number"
                    fullWidth
                    value={formData.late_fee_value}
                    onChange={(e) => handleChange("late_fee_value", e.target.value)}
                    inputProps={{
                      min: 0,
                      step: formData.late_fee_type === "percentage" ? 0.1 : 1000,
                    }}
                    InputProps={{
                      endAdornment: (
                        <ArgonTypography variant="body2" color="#757575" sx={{ mr: 1 }}>
                          {formData.late_fee_type === "fixed" ? "VNĐ" : "%"}
                        </ArgonTypography>
                      ),
                    }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <ArgonTypography variant="body2" fontWeight="bold" color="#424242" mb={1}>
                  Ghi chú phụ phí (tuỳ chọn)
                </ArgonTypography>
                <TextField
                  fullWidth
                  placeholder="Ví dụ: Phụ phí áp dụng khi quá hạn 3 ngày..."
                  value={formData.late_fee_description}
                  onChange={(e) => handleChange("late_fee_description", e.target.value)}
                  multiline
                  rows={2}
                />
                <ArgonTypography variant="caption" color="#757575" mt={1} display="block">
                  Nếu chọn phụ phí cố định, giá trị sẽ cộng thêm vào khoản phí ban đầu khi quá hạn.
                  Nếu chọn phần trăm, hệ thống tính theo tỷ lệ của giá trị phí gốc.
                </ArgonTypography>
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard
            icon={<ClassOutlinedIcon />}
            title="Lớp học áp dụng"
            subtitle="Chọn lớp và hạn nộp phí tương ứng"
          >
            {classes.length === 0 ? (
              <ArgonBox
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#f5f5f5",
                  border: "1px solid #e0e0e0",
                }}
              >
                <ArgonTypography variant="body2" color="#757575">
                  Đang tải danh sách lớp học...
                </ArgonTypography>
              </ArgonBox>
            ) : (
              <Paper
                sx={{
                  p: 2,
                  maxHeight: 300,
                  overflowY: "auto",
                  borderRadius: 2,
                  bgcolor: "#fff",
                  border: "1px solid #e0e0e0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  "&::-webkit-scrollbar": {
                    width: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "#f1f1f1",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "#1976d2",
                    borderRadius: "4px",
                    "&:hover": {
                      background: "#1565c0",
                    },
                  },
                }}
              >
                <FormGroup>
                  {classes.map((cls) => {
                    if (isEditMode) {
                      // Edit mode: show class_fees with individual due_date
                      // Ensure both are strings for comparison
                      const clsIdStr = String(cls._id);
                      const classFee = classFees.find(cf => String(cf.class_id) === clsIdStr);
                      const isChecked = !!classFee;
                      // Get original due_date from originalDueDates (before editing)
                      const originalDueDateStr = originalDueDates[clsIdStr];
                      // Format date from YYYY-MM-DD to DD/MM/YYYY to avoid timezone issues
                      const formatDateDisplay = (dateStr) => {
                        if (!dateStr) return null;
                        const parts = dateStr.split('-');
                        if (parts.length === 3) {
                          return `${parts[2]}/${parts[1]}/${parts[0]}`;
                        }
                        // Fallback to Date parsing if format is different
                        try {
                          const date = new Date(dateStr);
                          return date.toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          });
                        } catch {
                          return null;
                        }
                      };
                      const originalDueDate = formatDateDisplay(originalDueDateStr);
                      const currentDueDate = formatDateDisplay(classFee?.due_date);
                      
                      return (
                        <Box 
                          key={cls._id}
                          sx={{
                            mb: 1.5,
                            p: 1.5,
                            borderRadius: 1.5,
                            border: isChecked ? "1px solid #1976d2" : "1px solid #e0e0e0",
                            bgcolor: isChecked ? "#e3f2fd" : "#fff",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              bgcolor: isChecked ? "#e3f2fd" : "#f5f5f5",
                            },
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isChecked}
                                  onChange={() => handleClassToggle(cls._id)}
                                  sx={{
                                    color: "#1976d2",
                                    "&.Mui-checked": {
                                      color: "#1976d2",
                                    },
                                    "&:hover": {
                                      backgroundColor: "rgba(25, 118, 210, 0.08)",
                                    },
                                  }}
                                />
                              }
                              label={
                                <ArgonTypography
                                  variant="body2"
                                  fontWeight={isChecked ? 600 : 400}
                                  color={isChecked ? "#1976d2" : "#424242"}
                                  sx={{ minWidth: 150 }}
                                >
                                  {cls.class_name} ({cls.academic_year})
                                </ArgonTypography>
                              }
                            />
                            {isChecked && (
                              <>
                                {/* Always show original due date if exists */}
                                {originalDueDate && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <ArgonTypography variant="caption" color="#757575">
                                      Hạn cũ:
                                    </ArgonTypography>
                                    <Chip
                                      label={originalDueDate}
                                      size="small"
                                      sx={{
                                        bgcolor: "#f5f5f5",
                                        color: "#757575",
                                        border: "1px solid #e0e0e0",
                                        fontWeight: 500,
                                        height: 24,
                                      }}
                                    />
                                  </Box>
                                )}
                                {/* Show current/new due date if different from original */}
                                {currentDueDate && currentDueDate !== originalDueDate && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <ArgonTypography variant="caption" color="#1976d2">
                                      Hạn mới:
                                    </ArgonTypography>
                                    <Chip
                                      label={currentDueDate}
                                      size="small"
                                      sx={{
                                        bgcolor: "#e3f2fd",
                                        color: "#1976d2",
                                        border: "1px solid #1976d2",
                                        fontWeight: 600,
                                        height: 24,
                                      }}
                                    />
                                  </Box>
                                )}
                                <TextField
                                  type="date"
                                  value={classFee.due_date || ''}
                                  onChange={(e) => handleDueDateChange(cls._id, e.target.value)}
                                  size="small"
                                  InputLabelProps={{
                                    shrink: true,
                                  }}
                                  sx={{
                                    minWidth: 200,
                                    "& .MuiOutlinedInput-root": {
                                      bgcolor: "#fff",
                                      borderRadius: 1.5,
                                    },
                                  }}
                                />
                              </>
                            )}
                          </Stack>
                        </Box>
                      );
                    } else {
                      // Create mode: show class_ids only
                      const isChecked = classIds.includes(cls._id);
                      return (
                        <FormControlLabel
                          key={cls._id}
                          control={
                            <Checkbox
                              checked={isChecked}
                              onChange={() => handleClassToggle(cls._id)}
                              sx={{
                                color: "#1976d2",
                                "&.Mui-checked": {
                                  color: "#1976d2",
                                },
                                "&:hover": {
                                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                                },
                              }}
                            />
                          }
                          label={
                            <ArgonTypography
                              variant="body2"
                              fontWeight={isChecked ? 600 : 400}
                              color={isChecked ? "#1976d2" : "#424242"}
                            >
                              {cls.class_name} ({cls.academic_year})
                            </ArgonTypography>
                          }
                          sx={{
                            mb: 0.5,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            transition: "all 0.2s ease",
                            "&:hover": {
                              bgcolor: "#e3f2fd",
                            },
                            ...(isChecked && {
                              bgcolor: "#e3f2fd",
                              border: "1px solid #1976d2",
                            }),
                          }}
                        />
                      );
                    }
                  })}
                </FormGroup>
              </Paper>
            )}
            {((isEditMode && classFees.length > 0) || (!isEditMode && classIds.length > 0)) && (
              <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {isEditMode ? (
                  classFees.map((classFee) => {
                    const classIdStr = String(classFee.class_id);
                    const cls = classes.find((c) => String(c._id) === classIdStr);
                    if (!cls) return null;
                    const dueDate = classFee.due_date 
                      ? new Date(classFee.due_date).toLocaleDateString('vi-VN')
                      : 'Chưa đặt';
                    return (
                      <Chip
                        key={classFee.class_id}
                        label={`${cls.class_name} (${cls.academic_year}) - Hạn: ${dueDate}`}
                        size="small"
                        sx={{
                          backgroundColor: "#e3f2fd",
                          color: "#1565c0",
                          border: "1px solid #1976d2",
                          fontWeight: 500,
                          "&:hover": {
                            backgroundColor: "#bbdefb",
                          },
                        }}
                      />
                    );
                  })
                ) : (
                  formData.class_ids.map((classId) => {
                    const classIdStr = String(classId);
                    const cls = classes.find((c) => String(c._id) === classIdStr);
                    if (!cls) return null;
                    const dueDate = formData.due_date 
                      ? new Date(formData.due_date).toLocaleDateString('vi-VN')
                      : 'Chưa đặt';
                    return (
                      <Chip
                        key={classId}
                        label={`${cls.class_name} (${cls.academic_year}) - Hạn: ${dueDate}`}
                        size="small"
                        sx={{
                          backgroundColor: "#e3f2fd",
                          color: "#1565c0",
                          border: "1px solid #1976d2",
                          fontWeight: 500,
                          "&:hover": {
                            backgroundColor: "#bbdefb",
                          },
                        }}
                      />
                    );
                  })
                )}
              </Box>
            )}
            {((isEditMode && classFees.length > 0) || (!isEditMode && classIds.length > 0)) && (
              <ArgonTypography
                variant="caption"
                color="#1976d2"
                sx={{ mt: 1, display: "block", fontWeight: 500 }}
              >
                Đã chọn {isEditMode ? classFees.length : classIds.length} lớp học
              </ArgonTypography>
            )}
          </SectionCard>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          background: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
          borderTop: "1px solid #e3f2fd",
        }}
      >
        <ArgonButton
          onClick={onClose}
          variant="outlined"
          color="error"
          sx={{
            minWidth: 120,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            borderWidth: 1.5,
            "&:hover": {
              borderWidth: 1.5,
              backgroundColor: "#ffebee",
              transform: "translateY(-1px)",
              boxShadow: "0 2px 6px rgba(211, 47, 47, 0.2)",
            },
            transition: "all 0.2s ease",
          }}
          disabled={loading}
        >
          Hủy
        </ArgonButton>
        <ArgonButton
          onClick={handleSubmit}
          variant="contained"
          color="info"
          sx={{
            minWidth: 140,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
            },
          }}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <AttachMoneyIcon />
            )
          }
        >
          {loading ? "Đang lưu..." : isEditMode ? "Cập nhật" : "Tạo mới"}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

FeeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  feeData: PropTypes.shape({
    _id: PropTypes.string,
    fee_name: PropTypes.string,
    description: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    late_fee_type: PropTypes.string,
    late_fee_value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    late_fee_description: PropTypes.string,
    class_ids: PropTypes.arrayOf(PropTypes.string),
    class_fees: PropTypes.arrayOf(PropTypes.shape({
      class_id: PropTypes.string,
      due_date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    })),
    classes: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string,
      class_name: PropTypes.string,
      academic_year: PropTypes.string,
      due_date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    })),
  }),
  onSuccess: PropTypes.func.isRequired,
};

export default FeeModal;

