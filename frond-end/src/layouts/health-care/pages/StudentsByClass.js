import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import ArgonTypography from "components/ArgonTypography";
import healthService from "services/healthService";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";

export default function StudentsByClass() {
  const { classId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await healthService.getStudentsByClass(classId);
      setStudents(res.success ? res.data : []);
      setLoading(false);
    };
    load();
  }, [classId]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonTypography component="div" sx={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)' }}>
        <ArgonTypography component="div" sx={{ flexGrow: 1 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
            <CardHeader 
              title={<ArgonTypography variant="h5" fontWeight="bold">Học sinh của lớp</ArgonTypography>} 
              action={
                <Button 
                  variant="contained" 
                  color="success" 
                  sx={{ color: 'black', '&:hover': { backgroundColor: 'success.dark', color: 'black' } }}
                  onClick={() => navigate(-1)}
                >
                  Quay lại
                </Button>
              } 
            />
            <Divider />
            <CardContent>
              {loading ? (
                <Grid container justifyContent="center"><CircularProgress /></Grid>
              ) : (
                <Grid container spacing={2}>
                  {students.map((s) => (
                    <Grid key={s._id} item xs={12} sm={6} md={3} lg={3} xl={3}>
                      <Card sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                        <Avatar src={s.avatar_url} alt={s.full_name} sx={{ width: 64, height: 64, mx: 'auto', mb: 1 }} />
                        <ArgonTypography fontWeight="bold">{s.full_name}</ArgonTypography>
                        <Divider sx={{ my: 1 }} />
                        <Grid container spacing={1} justifyContent="center">
                          <Grid item>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success" 
                              sx={{ color: 'black', '&:hover': { backgroundColor: 'success.dark', color: 'black' } }}
                              onClick={() => navigate(`/health-care/students/${s._id}/records`)}
                            >
                              Sổ sức khoẻ
                            </Button>
                          </Grid>
                          <Grid item>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success" 
                              sx={{ color: 'black', '&:hover': { backgroundColor: 'success.dark', color: 'black' } }}
                              onClick={() => navigate(`/health-care/students/${s._id}/notices`)}
                            >
                              Thông báo y tế
                            </Button>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  ))}
                  {students.length === 0 && (
                    <Grid item xs={12}><ArgonTypography align="center" color="text">Không có học sinh</ArgonTypography></Grid>
                  )}
                </Grid>
              )}
            </CardContent>
          </Card>
        </ArgonTypography>
        <Footer />
      </ArgonTypography>
    </DashboardLayout>
  );
}
