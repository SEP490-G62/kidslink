import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';

import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";
import healthService from "services/healthService";

export default function StudentRecords() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payload, setPayload] = useState({ checkup_date: '', height_cm: '', weight_kg: '', note: '' });
  const [edit, setEdit] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await healthService.getHealthRecords(studentId);
    setRecords(res.success ? res.data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [studentId]);

  const openCreate = () => { setEdit(null); setPayload({ checkup_date: '', height_cm: '', weight_kg: '', note: '' }); setDialogOpen(true); };
  const openEdit = (r) => {
    setEdit(r);
    setPayload({
      checkup_date: r.checkup_date ? r.checkup_date.slice(0,10) : '',
      height_cm: r.height_cm?.$numberDecimal || r.height_cm || '',
      weight_kg: r.weight_kg?.$numberDecimal || r.weight_kg || '',
      note: r.note || ''
    });
    setDialogOpen(true);
  };
  const onChange = e => setPayload(p => ({ ...p, [e.target.name]: e.target.value }));

  const save = async () => {
    if (edit) {
      await healthService.updateHealthRecord(edit._id, payload);
    } else {
      await healthService.createHealthRecord({ ...payload, student_id: studentId });
    }
    setDialogOpen(false);
    await load();
  };
  const remove = async (id) => { await healthService.deleteHealthRecord(id); await load(); };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonTypography component="div" sx={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)' }}>
        <ArgonTypography component="div" sx={{ flexGrow: 1 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
            <CardHeader 
              title={<ArgonTypography variant="h5" fontWeight="bold">Sổ sức khoẻ học sinh</ArgonTypography>} 
              action={<>
                <Button 
                  variant="contained" 
                  color="success" 
                  sx={{ mr: 1, color: 'black', '&:hover': { backgroundColor: 'success.dark', color: 'black' } }}
                  onClick={() => navigate(-1)}
                >
                  Quay lại
                </Button>
                <Button 
                  variant="contained" 
                  color="success" 
                  sx={{ color: 'black', '&:hover': { backgroundColor: 'success.dark', color: 'black' } }}
                  onClick={openCreate}
                >
                  Thêm
                </Button>
              </>} 
            />
            <Divider />
            <CardContent>
              {loading ? (
                <Grid container justifyContent="center"><CircularProgress /></Grid>
              ) : (
                <Grid container spacing={2}>
                  {records.map((r) => (
                    <Grid key={r._id} item xs={12} sm={6} md={3} lg={3} xl={3}>
                      <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                        <ArgonTypography fontWeight="bold" mb={0.5}>Ngày khám: {new Date(r.checkup_date).toLocaleDateString('vi-VN')}</ArgonTypography>
                        <ArgonTypography fontSize={14} color="text">Chiều cao: {r.height_cm?.$numberDecimal || r.height_cm} cm</ArgonTypography>
                        <ArgonTypography fontSize={14} color="text">Cân nặng: {r.weight_kg?.$numberDecimal || r.weight_kg} kg</ArgonTypography>
                        <ArgonTypography fontSize={13} color="secondary">{r.note}</ArgonTypography>
                        <Divider sx={{ my: 1 }} />
                        <Grid container spacing={1} justifyContent="flex-end">
                          <Grid item>
                            <Tooltip title="Sửa"><IconButton onClick={() => openEdit(r)}><EditOutlinedIcon sx={{ color: '#1976d2' }} /></IconButton></Tooltip>
                          </Grid>
                          <Grid item>
                            <Tooltip title="Xóa"><IconButton onClick={() => remove(r._id)}><DeleteForeverOutlinedIcon sx={{ color: '#e53935' }} /></IconButton></Tooltip>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  ))}
                  {records.length === 0 && (
                    <Grid item xs={12}><ArgonTypography align="center" color="text">Chưa có sổ sức khoẻ</ArgonTypography></Grid>
                  )}
                </Grid>
              )}
            </CardContent>
          </Card>
        </ArgonTypography>
        <Footer />
      </ArgonTypography>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{edit ? 'Sửa sổ sức khoẻ' : 'Thêm sổ sức khoẻ'}</DialogTitle>
        <DialogContent>
          <TextField label="Ngày khám" type="date" name="checkup_date" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} value={payload.checkup_date} onChange={onChange} />
          <TextField label="Chiều cao (cm)" type="number" name="height_cm" fullWidth sx={{ mb: 2 }} value={payload.height_cm} onChange={onChange} />
          <TextField label="Cân nặng (kg)" type="number" name="weight_kg" fullWidth sx={{ mb: 2 }} value={payload.weight_kg} onChange={onChange} />
          <TextField label="Ghi chú" name="note" fullWidth multiline rows={2} value={payload.note} onChange={onChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={save}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
