import { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import Alert from "@mui/material/Alert";

export default function NutritionDishList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dishes, setDishes] = useState([]);

  useEffect(() => {
    async function fetchDishes() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/nutrition/dishes", {
          headers: {
            "Authorization": token ? `Bearer ${token}` : ""
          }
        });
        const data = await res.json();
        if (res.ok) setDishes(data.dishes);
        else setError(data.error || "Không thể lấy danh sách món ăn");
      } catch (err) {
        setError("Không thể kết nối máy chủ");
      }
      setLoading(false);
    }
    fetchDishes();
  }, []);

  return (
    <ArgonBox p={3}>
      <Card sx={{ maxWidth: 1000, mx: "auto", borderRadius: 4, boxShadow: 4 }}>
        <CardHeader title={<ArgonTypography variant="h4" fontWeight="bold" color="success.main">Danh sách món ăn</ArgonTypography>} />
        <CardContent>
          {loading && <ArgonBox display="flex" justifyContent="center" py={4}><CircularProgress /></ArgonBox>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {!loading && !error && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="40"><strong>#</strong></TableCell>
                    <TableCell><strong>Tên món ăn</strong></TableCell>
                    <TableCell><strong>Mô tả</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dishes.length === 0 && (
                    <TableRow><TableCell colSpan={3}><ArgonTypography align="center" color="text">Không có món ăn nào.</ArgonTypography></TableCell></TableRow>
                  )}
                  {dishes.map((dish, idx) => (
                    <TableRow key={dish._id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell><ArgonTypography fontWeight="bold">{dish.dish_name}</ArgonTypography></TableCell>
                      <TableCell>{dish.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </ArgonBox>
  );
}
