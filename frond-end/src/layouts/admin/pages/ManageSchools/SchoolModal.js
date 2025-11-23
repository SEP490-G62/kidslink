import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Box,
  Avatar,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SchoolIcon from "@mui/icons-material/School";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import adminService from "services/adminService";

const SchoolModal = ({ open, onClose, schoolData, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [formData, setFormData] = useState({
    school_name: "",
    address: "",
    phone: "",
    email: "",
    logo_url: "",
    qr_data: "",
    payos_config: {
      client_id: "",
      api_key: "",
      checksum_key: "",
      account_number: "",
      account_name: "",
      bank_code: "",
      active: false,
      webhook_url: "",
    },
  });

  const isEditMode = !!schoolData;

  useEffect(() => {
    if (open) {
      if (schoolData) {
        setFormData({
          school_name: schoolData.school_name || "",
          address: schoolData.address || "",
          phone: schoolData.phone || "",
          email: schoolData.email || "",
          logo_url: schoolData.logo_url || "",
          qr_data: schoolData.qr_data || "",
          payos_config: {
            client_id: schoolData.payos_config?.client_id || "",
            api_key: schoolData.payos_config?.api_key || "",
            checksum_key: schoolData.payos_config?.checksum_key || "",
            account_number: schoolData.payos_config?.account_number || "",
            account_name: schoolData.payos_config?.account_name || "",
            bank_code: schoolData.payos_config?.bank_code || "",
            active: schoolData.payos_config?.active || false,
            webhook_url: schoolData.payos_config?.webhook_url || "",
          },
        });
        setLogoPreview(schoolData.logo_url || "");
      } else {
        setFormData({
          school_name: "",
          address: "",
          phone: "",
          email: "",
          logo_url: "",
          qr_data: "",
          payos_config: {
            client_id: "",
            api_key: "",
            checksum_key: "",
            account_number: "",
            account_name: "",
            bank_code: "",
            active: false,
            webhook_url: "",
          },
        });
        setLogoPreview("");
      }
      setLogoFile(null);
      setError(null);
    }
  }, [open, schoolData]);

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Vui lòng chọn file ảnh hợp lệ");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Kích thước file không được vượt quá 5MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setLogoPreview(base64Image);
        setFormData({
          ...formData,
          logo_url: base64Image
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData({
      ...formData,
      [field]: e.target.value
    });
  };

  const handlePayosConfigChange = (field) => (e) => {
    setFormData({
      ...formData,
      payos_config: {
        ...formData.payos_config,
        [field]: e.target.value
      }
    });
  };

  const handlePayosActiveChange = (e) => {
    setFormData({
      ...formData,
      payos_config: {
        ...formData.payos_config,
        active: e.target.checked
      }
    });
  };

  const handleSubmit = async () => {
    if (!formData.school_name || !formData.address) {
      setError("Tên trường học và địa chỉ là bắt buộc");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let result;
      if (isEditMode) {
        result = await adminService.updateSchool(schoolData._id, formData);
      } else {
        result = await adminService.createSchool(formData);
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      console.error("Error saving school:", err);
      setError(err.message || "Có lỗi xảy ra khi lưu trường học");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
          <ArgonTypography variant="h5" fontWeight="bold">
            {isEditMode ? "Chỉnh sửa trường học" : "Thêm trường học mới"}
          </ArgonTypography>
          <ArgonButton
            variant="text"
            color="secondary"
            onClick={onClose}
            sx={{ minWidth: "auto", p: 1 }}
          >
            <CloseIcon />
          </ArgonButton>
        </ArgonBox>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Logo Section */}
          <Grid item xs={12} md={4}>
            <ArgonBox display="flex" flexDirection="column" alignItems="center">
              <Avatar
                src={logoPreview}
                alt="School Logo"
                sx={{
                  width: 150,
                  height: 150,
                  mb: 2,
                  border: "2px solid #e0e0e0",
                }}
              >
                <SchoolIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <ArgonButton
                variant="outlined"
                color="info"
                size="small"
                component="label"
              >
                Chọn logo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </ArgonButton>
              <ArgonTypography variant="caption" color="text" mt={1}>
                Tối đa 5MB
              </ArgonTypography>
            </ArgonBox>
          </Grid>

          {/* Basic Info */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tên trường học *"
                  value={formData.school_name}
                  onChange={handleInputChange("school_name")}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Địa chỉ *"
                  value={formData.address}
                  onChange={handleInputChange("address")}
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={formData.phone}
                  onChange={handleInputChange("phone")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="QR Data"
                  value={formData.qr_data}
                  onChange={handleInputChange("qr_data")}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* PayOS Config */}
          <Grid item xs={12}>
            <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
              Cấu hình PayOS
            </ArgonTypography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Client ID"
                  value={formData.payos_config.client_id}
                  onChange={handlePayosConfigChange("client_id")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="API Key"
                  type="password"
                  value={formData.payos_config.api_key}
                  onChange={handlePayosConfigChange("api_key")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Checksum Key"
                  type="password"
                  value={formData.payos_config.checksum_key}
                  onChange={handlePayosConfigChange("checksum_key")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số tài khoản"
                  value={formData.payos_config.account_number}
                  onChange={handlePayosConfigChange("account_number")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tên chủ tài khoản"
                  value={formData.payos_config.account_name}
                  onChange={handlePayosConfigChange("account_name")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mã ngân hàng"
                  value={formData.payos_config.bank_code}
                  onChange={handlePayosConfigChange("bank_code")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={formData.payos_config.webhook_url}
                  onChange={handlePayosConfigChange("webhook_url")}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.payos_config.active}
                      onChange={handlePayosActiveChange}
                    />
                  }
                  label="Kích hoạt PayOS"
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <ArgonButton onClick={onClose} color="secondary" disabled={loading}>
          Hủy
        </ArgonButton>
        <ArgonButton
          onClick={handleSubmit}
          color="info"
          variant="gradient"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : isEditMode ? "Cập nhật" : "Tạo mới"}
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
};

SchoolModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  schoolData: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
};

export default SchoolModal;


