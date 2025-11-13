import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import ArgonTypography from "components/ArgonTypography";
import healthService from "services/healthService";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";

export default function ClassesList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await healthService.getClasses();
      setClasses(res.success ? res.data : []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonTypography component="div" sx={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)' }}>
        <ArgonTypography component="div" sx={{ flexGrow: 1 }}>
          <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
            <CardHeader title={<ArgonTypography variant="h5" fontWeight="bold">Danh sách lớp</ArgonTypography>} />
            <Divider />
            <CardContent>
              {loading ? (
                <Grid container justifyContent="center"><CircularProgress /></Grid>
              ) : (
                <Grid container spacing={2}>
                  {classes.map((cls) => (
                    <Grid key={cls._id} item xs={12} sm={6} md={3} lg={3} xl={3}>
                      <Card onClick={() => navigate(`/health-care/classes/${cls._id}/students`)} sx={{ p: 2, cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                        <Avatar sx={{ mb: 1 }}>{cls.class_name?.[0]}</Avatar>
                        <ArgonTypography fontWeight="bold">Lớp {cls.class_name}</ArgonTypography>
                        <ArgonTypography variant="caption" color="text">{cls.school_id?.school_name}</ArgonTypography>
                      </Card>
                    </Grid>
                  ))}
                  {classes.length === 0 && (
                    <Grid item xs={12}><ArgonTypography align="center" color="text">Chưa có lớp nào</ArgonTypography></Grid>
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
