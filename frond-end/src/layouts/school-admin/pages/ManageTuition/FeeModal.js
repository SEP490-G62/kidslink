import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
  Divider,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Switch,
} from "@mui/material";
import api from "services/api";

const FeeModal = ({ open, onClose, feeData, onSuccess }) => {
  const STATUS_OPTIONS = ['đang áp dụng', 'đã hoàn thành', 'chưa áp dụng'];
  const STATUS_META = {
    'đang áp dụng': { chipColor: 'info' },
    'đã hoàn thành': { chipColor: 'success' },
    'chưa áp dụng': { chipColor: 'warning' },
  };
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [form, setForm] = useState({ ten_khoan_thu: "", so_tien: "", mo_ta: "", han_nop: "", bat_buoc: false, trang_thai: "đang áp dụng", nam_hoc: "" });
  const [submitting, setSubmitting] = useState(false);

  const parseAcademicYear = (value) => {
    const match = /^(\d{4})\s*-\s*(\d{4})$/.exec(value);
    if (!match) return null;
    const startYear = Number(match[1]);
    const endYear = Number(match[2]);
    if (Number.isNaN(startYear) || Number.isNaN(endYear) || startYear >= endYear) return null;
    if (endYear - startYear !== 1) return null;
    return { startYear, endYear };
  };

  const minDueDate = useMemo(() => new Date().toISOString().substring(0, 10), []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await api.get("/classes", true);
        const rows = Array.isArray(res) ? res : res.data || [];
        setClasses(rows);
      } catch (e) {
        console.error("Lỗi khi tải danh sách lớp:", e);
      } finally {
        setLoading(false);
      }
    };
    if (open) fetchClasses();
  }, [open]);

  useEffect(() => {
    if (feeData) {
      const normalizeStatus = (v) => {
        if (!v) return 'đang áp dụng';
        if (STATUS_OPTIONS.includes(v)) return v;
        if (v === 'dang_ap_dung') return 'đang áp dụng';
        if (v === 'da_hoan_thanh') return 'đã hoàn thành';
        if (v === 'chua_ap_dung') return 'chưa áp dụng';
        // legacy values mapping to closest supported statuses
        if (v === 'tam_ngung') return 'đang áp dụng';
        if (v === 'ket_thuc' || v === 'ngung') return 'đã hoàn thành';
        return 'đang áp dụng';
      };
      setForm({
        ten_khoan_thu: feeData.ten_khoan_thu || feeData.fee_name || "",
        so_tien: feeData.so_tien?.$numberDecimal || feeData.so_tien || feeData.amount || "",
        mo_ta: feeData.mo_ta || feeData.description || "",
        han_nop: feeData.han_nop ? new Date(feeData.han_nop).toISOString().substring(0,10) : "",
        bat_buoc: !!feeData.bat_buoc,
        trang_thai: normalizeStatus(feeData.trang_thai),
        nam_hoc: feeData.nam_hoc || "",
      });
      // Prefill class selections when editing
      if (Array.isArray(feeData.classIds)) {
        setSelectedClassIds(feeData.classIds);
      } else if (Array.isArray(feeData.class_ids)) {
        setSelectedClassIds(
          feeData.class_ids
            .map((c) => (typeof c === 'string' ? c : c?._id))
            .filter(Boolean)
        );
      } else {
        setSelectedClassIds([]);
      }
    } else {
      setForm({ ten_khoan_thu: "", so_tien: "", mo_ta: "", han_nop: "", bat_buoc: false, trang_thai: "đang áp dụng", nam_hoc: "" });
      setSelectedClassIds([]);
    }
  }, [feeData, open]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return classes;
    return classes.filter((c) => (c.class_name || "").toLowerCase().includes(s));
  }, [classes, search]);

  const toggleClass = (id) => {
    setSelectedClassIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selectedClassIds.length === filtered.length) setSelectedClassIds([]);
    else setSelectedClassIds(filtered.map((c) => c._id));
  };

  const onChangeForm = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ten_khoan_thu || !form.so_tien) {
      alert("Vui lòng nhập đầy đủ tên khoản phí và số tiền.");
      return;
    }
    const normalizedYear = (form.nam_hoc || "").trim();
    const parsedYear = normalizedYear ? parseAcademicYear(normalizedYear) : null;
    const isCreating = !feeData || !feeData._id;
    const currentYear = new Date().getFullYear();

    if (isCreating) {
      if (!normalizedYear) {
        alert("Vui lòng nhập năm học.");
        return;
      }
      if (!parsedYear) {
        alert("Năm học phải có định dạng YYYY-YYYY, ví dụ: 2025-2026.");
        return;
      }
      if (parsedYear.endYear < currentYear) {
        alert("Chỉ có thể tạo khoản phí cho năm học hiện tại hoặc tương lai.");
        return;
      }
    } else if (normalizedYear && !parsedYear) {
      alert("Năm học phải có định dạng YYYY-YYYY, ví dụ: 2025-2026.");
      return;
    }

    if (form.trang_thai && !STATUS_OPTIONS.includes(form.trang_thai)) {
      alert("Trạng thái không hợp lệ.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ten_khoan_thu: form.ten_khoan_thu,
        so_tien: Number(form.so_tien),
        mo_ta: form.mo_ta,
        lop_ids: selectedClassIds,
        han_nop: form.han_nop || null,
        bat_buoc: !!form.bat_buoc,
        trang_thai: form.trang_thai,
        nam_hoc: normalizedYear || undefined,
      };
      if (feeData && feeData._id) await api.put(`/fees/${feeData._id}`, payload, true);
      else await api.post("/fees", payload, true);
      onSuccess && onSuccess();
      onClose && onClose();
    } catch (e) {
      console.error(e);
      alert("Không thể lưu khoản phí.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight="bold">
          {feeData ? "Chỉnh sửa học phí" : "Tạo học phí"}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Box mb={2}>
            <Typography variant="caption" fontWeight={600} display="block" mb={0.75}>
              Tên khoản phí
            </Typography>
            <TextField fullWidth size="small" placeholder="VD: Học phí tháng 11" name="ten_khoan_thu" value={form.ten_khoan_thu} onChange={onChangeForm} />
          </Box>

          <Box mb={2}>
            <Typography variant="caption" fontWeight={600} display="block" mb={0.75}>
              Số tiền (VNĐ)
            </Typography>
            <TextField fullWidth size="small" type="number" inputProps={{ min: 0 }} placeholder="VD: 3000000" name="so_tien" value={form.so_tien} onChange={onChangeForm} />
          </Box>

          <Box mb={2}>
            <Typography variant="caption" fontWeight={600} display="block" mb={0.75}>
              Mô tả (tuỳ chọn)
            </Typography>
            <TextField fullWidth size="small" multiline minRows={3} placeholder="Ghi chú hoặc mô tả chi tiết về khoản phí" name="mo_ta" value={form.mo_ta} onChange={onChangeForm} />
          </Box>

          <Box mb={2}>
            <Typography variant="caption" fontWeight={600} display="block" mb={0.75}>
              Năm học
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="VD: 2024-2025"
              name="nam_hoc"
              value={form.nam_hoc}
              onChange={onChangeForm}
            />
          </Box>

          <Box mb={2} display="flex" alignItems="center" justifyContent="space-between" gap={2}>
            <Box flex={1}>
              <Typography variant="caption" fontWeight={600} display="block" mb={0.75}>Hạn nộp</Typography>
              <TextField
                fullWidth
                size="small"
                type="date"
                name="han_nop"
                value={form.han_nop}
                onChange={onChangeForm}
                inputProps={{ min: minDueDate }}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={1} sx={{ alignSelf: 'flex-end' }}>
              <Typography variant="caption" fontWeight={600}>Bắt buộc</Typography>
              <Switch name="bat_buoc" checked={form.bat_buoc} onChange={onChangeForm} />
            </Box>
          </Box>

          <Box mb={2}>
            <Typography variant="caption" fontWeight={600} display="block" mb={0.75}>Trạng thái</Typography>
            <FormControl size="small" fullWidth>
              <Select
                value={STATUS_OPTIONS.includes(form.trang_thai) ? form.trang_thai : 'đang áp dụng'}
                name="trang_thai"
                onChange={onChangeForm}
                renderValue={(selected) => {
                  const value = STATUS_OPTIONS.includes(selected) ? selected : 'đang áp dụng';
                  const meta = STATUS_META[value] || {};
                  return (
                    <Chip
                      size="small"
                      label={value}
                      color={meta.chipColor || 'default'}
                      variant="filled"
                    />
                  );
                }}
              >
                {STATUS_OPTIONS.map((status) => {
                  const meta = STATUS_META[status] || {};
                  return (
                    <MenuItem key={status} value={status}>
                      <Chip
                        size="small"
                        label={status}
                        color={meta.chipColor || 'default'}
                        variant="outlined"
                      />
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 1.5 }} />
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Typography variant="subtitle1">Chọn lớp áp dụng</Typography>
            <Button size="small" onClick={toggleAll}>
              {selectedClassIds.length === filtered.length && filtered.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </Button>
          </Box>
          {/* bỏ ô tìm kiếm lớp */}
          {loading ? (
            <Typography variant="body2">Đang tải danh sách lớp...</Typography>
          ) : filtered.length === 0 ? (
            <Typography variant="body2">Không có lớp phù hợp</Typography>
          ) : (
            <Box sx={{ maxHeight: 300, overflowY: "auto", pr: 1, pl: 1.5 }}>
              {filtered.map((c) => (
                <Box key={c._id} display="flex" alignItems="center" py={0.5}>
                  <FormControlLabel
                    control={<Checkbox checked={selectedClassIds.includes(c._id)} onChange={() => toggleClass(c._id)} size="small" />}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight={600}>{c.class_name || "(Không tên)"}</Typography>
                        {c.class_age_id?.age_name && <Chip size="small" label={c.class_age_id.age_name} />}
                      </Box>
                    }
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>{submitting ? "Đang lưu..." : feeData ? "Lưu thay đổi" : "Tạo học phí"}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeeModal;

FeeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  feeData: PropTypes.shape({
    _id: PropTypes.string,
    // legacy fields
    fee_name: PropTypes.string,
    description: PropTypes.string,
    amount: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({ $numberDecimal: PropTypes.string }),
      PropTypes.string,
    ]),
    // new fields per schema
    ten_khoan_thu: PropTypes.string,
    mo_ta: PropTypes.string,
    so_tien: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({ $numberDecimal: PropTypes.string }),
      PropTypes.string,
    ]),
    han_nop: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    bat_buoc: PropTypes.bool,
    trang_thai: PropTypes.string,
    nam_hoc: PropTypes.string,
    classIds: PropTypes.arrayOf(PropTypes.string),
    class_ids: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({ _id: PropTypes.string, class_name: PropTypes.string }),
      ])
    ),
  }),
};

FeeModal.defaultProps = {
  onClose: undefined,
  onSuccess: undefined,
  feeData: null,
};


