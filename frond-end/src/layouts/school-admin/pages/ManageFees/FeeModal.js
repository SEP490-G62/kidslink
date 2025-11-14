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
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CloseIcon from "@mui/icons-material/Close";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import schoolAdminService from "services/schoolAdminService";
import api from "services/api";

const FeeModal = ({ open, onClose, feeData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    fee_name: "",
    description: "",
    amount: "",
    class_ids: [], // Array of class_id (for create mode)
    due_date: "", // Common due_date for all classes (create mode)
    class_fees: [], // Array of { class_id, due_date } (for edit mode)
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
      if (feeData.class_fees && Array.isArray(feeData.class_fees)) {
        classFees = feeData.class_fees.map(cf => ({
          class_id: cf.class_id,
          due_date: cf.due_date ? new Date(cf.due_date).toISOString().split('T')[0] : ''
        }));
      } else if (feeData.classes && Array.isArray(feeData.classes)) {
        classFees = feeData.classes.map(c => ({
          class_id: c._id || c.class_id,
          due_date: c.due_date ? new Date(c.due_date).toISOString().split('T')[0] : ''
        }));
      } else if (feeData.class_ids && Array.isArray(feeData.class_ids)) {
        // Fallback: convert class_ids to class_fees format
        const now = new Date();
        const defaultDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        classFees = feeData.class_ids.map(classId => ({
          class_id: classId,
          due_date: defaultDueDate.toISOString().split('T')[0]
        }));
      }
      
      setFormData({
        fee_name: feeData.fee_name || "",
        description: feeData.description || "",
        amount: feeData.amount || "",
        class_fees: classFees,
      });
      setError(null);
    } else if (open && !feeData) {
      // Reset form for create mode
      const now = new Date();
      const defaultDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFormData({
        fee_name: "",
        description: "",
        amount: "",
        class_ids: [],
        due_date: defaultDueDate.toISOString().split('T')[0],
        class_fees: [],
      });
      setError(null);
    }
  }, [open, feeData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleClassToggle = (classId) => {
    if (isEditMode) {
      // Edit mode: handle class_fees with individual due_date
      setFormData((prev) => {
        const currentClassFees = prev.class_fees || [];
        const existingIndex = currentClassFees.findIndex(cf => cf.class_id === classId);
        
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
                class_id: classId,
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
        const isSelected = currentIds.includes(classId);
        return {
          ...prev,
          class_ids: isSelected
            ? currentIds.filter((id) => id !== classId)
            : [...currentIds, classId],
        };
      });
    }
  };

  const handleDueDateChange = (classId, dueDate) => {
    setFormData((prev) => {
      const currentClassFees = prev.class_fees || [];
      const existingIndex = currentClassFees.findIndex(cf => cf.class_id === classId);
      
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
          {/* Tên phí */}
          <Box>
            <ArgonTypography
              variant="body2"
              fontWeight="bold"
              color="#424242"
              mb={1}
            >
              Tên phí <span style={{ color: "#d32f2f" }}>*</span>
            </ArgonTypography>
            <TextField
              fullWidth
              placeholder="Nhập tên phí..."
              value={formData.fee_name}
              onChange={(e) => handleChange("fee_name", e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e0e0e0",
                    borderWidth: 1.5,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
                    boxShadow: "0 2px 6px rgba(25, 118, 210, 0.15)",
                  },
                  "&.Mui-focused": {
                    boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.1)",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1976d2",
                      borderWidth: 2,
                    },
                  },
                },
              }}
            />
          </Box>

          {/* Mô tả */}
          <Box>
            <ArgonTypography
              variant="body2"
              fontWeight="bold"
              color="#424242"
              mb={1}
            >
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
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e0e0e0",
                    borderWidth: 1.5,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
                    boxShadow: "0 2px 6px rgba(25, 118, 210, 0.15)",
                  },
                  "&.Mui-focused": {
                    boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.1)",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1976d2",
                      borderWidth: 2,
                    },
                  },
                },
              }}
            />
          </Box>

          {/* Số tiền */}
          <Box>
            <ArgonTypography
              variant="body2"
              fontWeight="bold"
              color="#424242"
              mb={1}
            >
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
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e0e0e0",
                    borderWidth: 1.5,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
                    boxShadow: "0 2px 6px rgba(25, 118, 210, 0.15)",
                  },
                  "&.Mui-focused": {
                    boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.1)",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1976d2",
                      borderWidth: 2,
                    },
                  },
                },
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
          </Box>

          {/* Hạn thanh toán (chỉ cho create mode) */}
          {!isEditMode && (
            <Box>
              <ArgonTypography
                variant="body2"
                fontWeight="bold"
                color="#424242"
                mb={1}
              >
                Hạn thanh toán (áp dụng cho tất cả lớp) <span style={{ color: "#d32f2f" }}>*</span>
              </ArgonTypography>
              <TextField
                type="date"
                fullWidth
                value={formData.due_date || ''}
                onChange={(e) => handleChange("due_date", e.target.value)}
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#e0e0e0",
                      borderWidth: 1.5,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1976d2",
                      boxShadow: "0 2px 6px rgba(25, 118, 210, 0.15)",
                    },
                    "&.Mui-focused": {
                      boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.1)",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#1976d2",
                        borderWidth: 2,
                      },
                    },
                  },
                }}
              />
            </Box>
          )}

          {/* Lớp học áp dụng */}
          <Box>
            <ArgonTypography
              variant="body2"
              fontWeight="bold"
              color="#424242"
              mb={1.5}
            >
              Lớp học áp dụng
            </ArgonTypography>
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
                      const classFee = formData.class_fees.find(cf => cf.class_id === cls._id);
                      const isChecked = !!classFee;
                      return (
                        <Box key={cls._id}>
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
                          {isChecked && (
                            <Box sx={{ ml: 4.5, mb: 1 }}>
                              <TextField
                                type="date"
                                label="Hạn thanh toán"
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
                            </Box>
                          )}
                        </Box>
                      );
                    } else {
                      // Create mode: show class_ids only
                      const isChecked = formData.class_ids.includes(cls._id);
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
            {((isEditMode && formData.class_fees.length > 0) || (!isEditMode && formData.class_ids.length > 0)) && (
              <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {isEditMode ? (
                  formData.class_fees.map((classFee) => {
                    const cls = classes.find((c) => c._id === classFee.class_id);
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
                    const cls = classes.find((c) => c._id === classId);
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
            {((isEditMode && formData.class_fees.length > 0) || (!isEditMode && formData.class_ids.length > 0)) && (
              <ArgonTypography
                variant="caption"
                color="#1976d2"
                sx={{ mt: 1, display: "block", fontWeight: 500 }}
              >
                Đã chọn {isEditMode ? formData.class_fees.length : formData.class_ids.length} lớp học
              </ArgonTypography>
            )}
          </Box>
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

