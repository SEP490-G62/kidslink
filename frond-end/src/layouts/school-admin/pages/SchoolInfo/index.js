import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import SchoolIcon from "@mui/icons-material/School";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import QrCodeIcon from "@mui/icons-material/QrCode";
import PaymentIcon from "@mui/icons-material/Payment";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import schoolAdminService from "services/schoolAdminService";

const SchoolInfo = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
  const [isEditing, setIsEditing] = useState(false);
  const [schoolData, setSchoolData] = useState({
    _id: "",
    school_name: "",
    address: "",
    phone: "",
    email: "",
    logo_url: "",
    status: 1,
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
  const [formData, setFormData] = useState({
    school_name: "",
    address: "",
    phone: "",
    email: "",
    logo_url: "",
    status: 1,
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
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    fetchSchoolInfo();
  }, []);

  const fetchSchoolInfo = async () => {
    try {
      setLoading(true);
      const result = await schoolAdminService.getSchoolInfo();
      if (result.success && result.data) {
        const data = result.data;
        const normalized = {
          _id: data._id || "",
          school_name: data.school_name || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          logo_url: data.logo_url || "",
          status: data.status !== undefined ? data.status : 1,
          qr_data: data.qr_data || "",
          payos_config: {
            client_id: data.payos_config?.client_id || "",
            api_key: data.payos_config?.api_key || "",
            checksum_key: data.payos_config?.checksum_key || "",
            account_number: data.payos_config?.account_number || "",
            account_name: data.payos_config?.account_name || "",
            bank_code: data.payos_config?.bank_code || "",
            active: data.payos_config?.active || false,
            webhook_url: data.payos_config?.webhook_url || "",
          },
        };
        setSchoolData(normalized);
        setFormData(normalized);
        setLogoPreview(normalized.logo_url || "");
      } else {
        setAlert({ open: true, message: result.message || "Không thể tải thông tin trường học", severity: "error" });
      }
    } catch (error) {
      console.error("Error fetching school info:", error);
      setAlert({ open: true, message: "Có lỗi xảy ra khi tải thông tin trường học", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setAlert({ open: true, message: "Vui lòng chọn file ảnh hợp lệ", severity: "error" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setAlert({ open: true, message: "Kích thước file không được vượt quá 5MB", severity: "error" });
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

  const handleStatusChange = (e) => {
    setFormData({
      ...formData,
      status: e.target.checked ? 1 : 0
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const updateData = {
        school_name: formData.school_name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        status: formData.status,
        qr_data: formData.qr_data,
        payos_config: formData.payos_config,
      };
      if (logoFile || (formData.logo_url && formData.logo_url.startsWith('data:image'))) {
        updateData.logo_url = formData.logo_url;
      }
      const result = await schoolAdminService.updateSchoolInfo(schoolData._id || null, updateData);
      if (result.success) {
        setAlert({ open: true, message: "Cập nhật thông tin trường học thành công", severity: "success" });
        await fetchSchoolInfo();
        setIsEditing(false);
        setLogoFile(null);
      } else {
        setAlert({ open: true, message: result.message || "Không thể cập nhật thông tin", severity: "error" });
      }
    } catch (error) {
      console.error("Error updating school info:", error);
      setAlert({ open: true, message: error.message || "Có lỗi xảy ra khi cập nhật thông tin", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(schoolData);
    setLogoPreview(schoolData.logo_url || "");
    setLogoFile(null);
    setIsEditing(false);
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SchoolIcon color="primary" />
                  <ArgonTypography
                    variant="h5"
                    fontWeight="bold"
                    letterSpacing={0.2}
                  >
                    Thông tin trường học
                  </ArgonTypography>
                </Stack>
                <ArgonTypography variant="body2" color="text" mt={0.5}>
                  Quản lý thông tin và cấu hình trường học
                </ArgonTypography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                {!isEditing ? (
                  <ArgonButton
                    color="info"
                    size="medium"
                    onClick={() => setIsEditing(true)}
                    variant="contained"
                    startIcon={<EditIcon />}
                    sx={{
                      fontWeight: 600,
                      transition: "all 0.3s ease",
                    }}
                  >
                    Chỉnh sửa
                  </ArgonButton>
                ) : (
                  <>
                    <ArgonButton
                      variant="outlined"
                      color="secondary"
                      size="medium"
                      onClick={handleCancel}
                      startIcon={<CancelIcon />}
                      disabled={saving}
                      sx={{
                        fontWeight: 500,
                        transition: "all 0.3s ease",
                      }}
                    >
                      Hủy
                    </ArgonButton>
                    <ArgonButton
                      color="success"
                      size="medium"
                      onClick={handleSave}
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={saving}
                      sx={{
                        fontWeight: 600,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </ArgonButton>
                  </>
                )}
              </Stack>
            </Box>
          </CardContent>
        </Card>

        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        </Snackbar>

        <Grid container spacing={3}>
          {/* Logo Section */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                background: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
                border: "1px solid #e3f2fd",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <CardContent>
                <ArgonBox display="flex" flexDirection="column" alignItems="center" py={3}>
                  <Avatar
                    src={logoPreview}
                    alt="School Logo"
                    sx={{
                      width: 200,
                      height: 200,
                      mb: 2,
                      border: "2px solid #e0e0e0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <SchoolIcon sx={{ fontSize: 80 }} />
                  </Avatar>
                  {isEditing && (
                    <ArgonButton
                      variant="outlined"
                      color="info"
                      size="small"
                      component="label"
                      sx={{ 
                        mt: 2,
                        fontWeight: 500,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-1px)",
                          boxShadow: "0 2px 6px rgba(25, 118, 210, 0.2)",
                        },
                      }}
                    >
                      Chọn logo mới
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </ArgonButton>
                  )}
                  <ArgonTypography variant="caption" color="text" mt={1}>
                    Kích thước tối đa: 5MB
                  </ArgonTypography>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>

          {/* Basic Information */}
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "1px solid #e3f2fd",
              }}
            >
              <CardContent>
                <ArgonBox mb={3}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <SchoolIcon color="primary" />
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Thông tin cơ bản
                    </ArgonTypography>
                  </Stack>
                  <Divider />
                </ArgonBox>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SchoolIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <ArgonTypography variant="body2" fontWeight="medium" color="text">
                          Tên trường học
                        </ArgonTypography>
                      </Box>
                      <TextField
                        fullWidth
                        placeholder="Nhập tên trường học"
                        value={formData.school_name}
                        onChange={handleInputChange("school_name")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
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
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationOnIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <ArgonTypography variant="body2" fontWeight="medium" color="text">
                          Địa chỉ
                        </ArgonTypography>
                      </Box>
                      <TextField
                        fullWidth
                        placeholder="Nhập địa chỉ"
                        value={formData.address}
                        onChange={handleInputChange("address")}
                        disabled={!isEditing}
                        multiline
                        rows={2}
                        size="small"
                        sx={{
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
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PhoneIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <ArgonTypography variant="body2" fontWeight="medium" color="text">
                          Số điện thoại
                        </ArgonTypography>
                      </Box>
                      <TextField
                        fullWidth
                        placeholder="Nhập số điện thoại"
                        value={formData.phone}
                        onChange={handleInputChange("phone")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
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
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <ArgonTypography variant="body2" fontWeight="medium" color="text">
                          Email
                        </ArgonTypography>
                      </Box>
                      <TextField
                        fullWidth
                        placeholder="Nhập email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange("email")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
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
                    </Box>
                  </Grid>
{/* 
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <QrCodeIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                        <ArgonTypography variant="body2" fontWeight="medium" color="text">
                          QR Data
                        </ArgonTypography>
                      </Box>
                      <TextField
                        fullWidth
                        placeholder="Nhập QR Data"
                        value={formData.qr_data}
                        onChange={handleInputChange("qr_data")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
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
                    </Box>
                  </Grid> */}
{/* 
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 2,
                          py: 1,
                          borderRadius: 1.5,
                          backgroundColor: formData.status === 1 ? '#22c55e' : '#9ca3af',
                          minWidth: 120,
                          height: 36,
                        }}
                      >
                        <ArgonTypography
                          variant="body2"
                          fontWeight="600"
                          color="#ffffff"
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {formData.status === 1 ? "Hoạt động" : "Vô hiệu hóa"}
                        </ArgonTypography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <ArgonTypography variant="body2" fontWeight="medium" color="text">
                          Trạng thái hoạt động của trường học
                        </ArgonTypography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.status === 1}
                              onChange={handleStatusChange}
                              disabled={!isEditing}
                            />
                          }
                          label=""
                          sx={{ m: 0 }}
                        />
                      </Box>
                    </Box>
                  </Grid> */}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card
              sx={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "1px solid #e3f2fd",
              }}
            >
              <CardContent>
                <ArgonBox mb={3}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                    <PaymentIcon color="primary" />
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Cấu hình PayOS
                    </ArgonTypography>
                  </Stack>
                  <Divider />
                </ArgonBox>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <ArgonTypography variant="body2" fontWeight="medium" color="text" mb={1}>
                        Client ID
                      </ArgonTypography>
                      <TextField
                        fullWidth
                        placeholder="Nhập Client ID"
                        value={formData.payos_config.client_id}
                        onChange={handlePayosConfigChange("client_id")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
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
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <ArgonTypography variant="body2" fontWeight="medium" color="text" mb={1}>
                        API Key
                      </ArgonTypography>
                      <TextField
                        fullWidth
                        placeholder="Nhập API Key"
                        type="password"
                        value={formData.payos_config.api_key}
                        onChange={handlePayosConfigChange("api_key")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
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
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <ArgonTypography variant="body2" fontWeight="medium" color="text" mb={1}>
                        Checksum Key
                      </ArgonTypography>
                      <TextField
                        fullWidth
                        placeholder="Nhập Checksum Key"
                        type="password"
                        value={formData.payos_config.checksum_key}
                        onChange={handlePayosConfigChange("checksum_key")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
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
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <ArgonTypography variant="body2" fontWeight="medium" color="text" mb={1}>
                        Số tài khoản
                      </ArgonTypography>
                      <TextField
                        fullWidth
                        placeholder="Nhập số tài khoản"
                        value={formData.payos_config.account_number}
                        onChange={handlePayosConfigChange("account_number")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
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
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <ArgonTypography variant="body2" fontWeight="medium" color="text" mb={1}>
                        Tên chủ tài khoản
                      </ArgonTypography>
                      <TextField
                        fullWidth
                        placeholder="Nhập tên chủ tài khoản"
                        value={formData.payos_config.account_name}
                        onChange={handlePayosConfigChange("account_name")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
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
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <ArgonTypography variant="body2" fontWeight="medium" color="text" mb={1}>
                        Mã ngân hàng
                      </ArgonTypography>
                      <TextField
                        fullWidth
                        placeholder="Nhập mã ngân hàng"
                        value={formData.payos_config.bank_code}
                        onChange={handlePayosConfigChange("bank_code")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
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
                    </Box>
                  </Grid>
{/* 
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2 }}>
                      <ArgonTypography variant="body2" fontWeight="medium" color="text" mb={1}>
                        Webhook URL
                      </ArgonTypography>
                      <TextField
                        fullWidth
                        placeholder="Nhập Webhook URL"
                        value={formData.payos_config.webhook_url}
                        onChange={handlePayosConfigChange("webhook_url")}
                        disabled={!isEditing}
                        size="small"
                        sx={{
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
                    </Box>
                  </Grid> */}

                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 2,
                          py: 1,
                          borderRadius: 1.5,
                          backgroundColor: formData.payos_config.active ? '#3b82f6' : '#9ca3af',
                          minWidth: 120,
                          height: 36,
                        }}
                      >
                        <ArgonTypography
                          variant="body2"
                          fontWeight="600"
                          color="#ffffff"
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {formData.payos_config.active ? "Đã kích hoạt" : "Chưa kích hoạt"}
                        </ArgonTypography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <ArgonTypography variant="body2" fontWeight="medium" color="text">
                          Kích hoạt thanh toán qua PayOS
                        </ArgonTypography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.payos_config.active}
                              onChange={handlePayosActiveChange}
                              disabled={!isEditing}
                            />
                          }
                          label=""
                          sx={{ m: 0 }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default SchoolInfo;

