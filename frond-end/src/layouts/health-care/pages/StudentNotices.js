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

export default function StudentNotices() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payload, setPayload] = useState({ notice_time: '', symptoms: '', actions_taken: '', medications: '', note: '' });
  const [edit, setEdit] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await healthService.getHealthNotices(studentId);
    setNotices(res.success ? res.data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [studentId]);

  const openCreate = () => { setEdit(null); setPayload({ notice_time: '', symptoms: '', actions_taken: '', medications: '', note: '' }); setDialogOpen(true); };
  const openEdit = (n) => {
    setEdit(n);
    setPayload({
      notice_time: n.notice_time ? n.notice_time.replace('Z','').slice(0,16) : '',
      symptoms: n.symptoms || '',
      actions_taken: n.actions_taken || '',
      medications: n.medications || '',
      note: n.note || ''
    });
    setDialogOpen(true);
  };
  const onChange = e => setPayload(p => ({ ...p, [e.target.name]: e.target.value }));

  const save = async () => {
    if (edit) {
      await healthService.updateHealthNotice(edit._id, payload);
    } else {
      await healthService.createHealthNotice({ ...payload, student_id: studentId });
    }
    setDialogOpen(false);
    await load();
  };
  const remove = async (id) => { await healthService.deleteHealthNotice(id); await load(); };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonTypography component="div" sx={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)' }}>
        <ArgonTypography component="div" sx={{ flexGrow: 1 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
            <CardHeader 
              title={<ArgonTypography variant="h5" fontWeight="bold">Thông báo y tế</ArgonTypography>} 
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
                  {notices.map((n) => (
                    <Grid key={n._id} item xs={12} sm={6} md={3} lg={3} xl={3}>
                      <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                        <ArgonTypography fontWeight="bold">{n.symptoms}</ArgonTypography>
                        <ArgonTypography fontSize={14} color="text">Thời gian: {n.notice_time ? new Date(n.notice_time).toLocaleString('vi-VN') : ''}</ArgonTypography>
                        <ArgonTypography fontSize={13} color="secondary">Hành động: {n.actions_taken} | Thuốc: {n.medications}</ArgonTypography>
                        <ArgonTypography fontSize={12}>Ghi chú: {n.note}</ArgonTypography>
                        <Divider sx={{ my: 1 }} />
                        <Grid container spacing={1} justifyContent="flex-end">
                          <Grid item>
                            <Tooltip title="Sửa"><IconButton onClick={() => openEdit(n)}><EditOutlinedIcon sx={{ color: '#1976d2' }} /></IconButton></Tooltip>
                          </Grid>
                          <Grid item>
                            <Tooltip title="Xóa"><IconButton onClick={() => remove(n._id)}><DeleteForeverOutlinedIcon sx={{ color: '#e53935' }} /></IconButton></Tooltip>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  ))}
                  {notices.length === 0 && (
                    <Grid item xs={12}><ArgonTypography align="center" color="text">Chưa có thông báo y tế</ArgonTypography></Grid>
                  )}
                </Grid>
              )}
            </CardContent>
          </Card>
        </ArgonTypography>
        <Footer />
      </ArgonTypography>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{edit ? 'Sửa thông báo y tế' : 'Thêm thông báo y tế'}</DialogTitle>
        <DialogContent>
          <TextField label="Thời gian" type="datetime-local" name="notice_time" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} value={payload.notice_time} onChange={onChange} />
          <TextField label="Triệu chứng" name="symptoms" fullWidth sx={{ mb: 2 }} value={payload.symptoms} onChange={onChange} />
          <TextField label="Hành động" name="actions_taken" fullWidth sx={{ mb: 2 }} value={payload.actions_taken} onChange={onChange} />
          <TextField label="Thuốc" name="medications" fullWidth sx={{ mb: 2 }} value={payload.medications} onChange={onChange} />
          <TextField label="Ghi chú" name="note" fullWidth multiline rows={2} value={payload.note} onChange={onChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" color="error" onClick={save}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
