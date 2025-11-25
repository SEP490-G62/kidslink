import { useEffect, useMemo, useState } from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import nutritionService from "services/nutritionService";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";

// Helper functions for Vietnam timezone (UTC+7)
const getVietnamDate = () => {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  return vietnamTime;
};

const getVietnamDateString = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  const vietnamTime = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const year = vietnamTime.getFullYear();
  const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
  const day = String(vietnamTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfWeekVietnam = () => {
  const now = getVietnamDate();
  const day = now.getDay();
  const diffToMon = ((day + 6) % 7);
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMon);
  return getVietnamDateString(monday);
};

const addDaysVietnam = (dateString, days) => {
  const date = new Date(dateString + 'T00:00:00+07:00');
  date.setDate(date.getDate() + days);
  return getVietnamDateString(date);
};

const getDateForWeekdayVietnam = (weekStartString, dayIndex) => {
  const date = new Date(weekStartString + 'T00:00:00+07:00');
  date.setDate(date.getDate() + dayIndex);
  return date;
};

const toVietnamISOString = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString + 'T00:00:00+07:00');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
};

export default function NutritionDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classAges, setClassAges] = useState([]);
  const [meals, setMeals] = useState([]);
  const [weekDays, setWeekDays] = useState([]);
  const [weekStart, setWeekStart] = useState(() => getStartOfWeekVietnam());
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  
  // Schedule data cache: { 'weekStart': { 'classAgeId-mealId-weekdayId': { dishes: [] } } }
  const [scheduleDataCache, setScheduleDataCache] = useState({});
  
  // Get current week's schedule data from cache
  const scheduleData = scheduleDataCache[weekStart] || {};

  const weekDaysOptions = useMemo(() => weekDays.map(d => ({ id: d._id, name: d.day_of_week })), [weekDays]);

  useEffect(() => {
    async function loadInit() {
      try {
        setLoading(true);
        setError("");
        const [ca, m, wd] = await Promise.all([
          nutritionService.getClassAges(),
          nutritionService.getMeals(),
          nutritionService.getWeekDays()
        ]);
        const classAgesData = ca.classAges || ca.data || [];
        const mealsData = m.meals || m.data || [];
        const weekDaysData = wd.weekDays || wd.data || [];
        
        setClassAges(classAgesData);
        setMeals(mealsData);
        setWeekDays(weekDaysData);
      } catch (e) {
        console.error('Error loading nutrition data:', e);
        setError(e.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }
    loadInit();
  }, []);

  // Load schedule for all class ages and all days using batch endpoint
  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();
    
    async function loadSchedule() {
      if (!classAges.length || !meals.length || !weekDaysOptions.length) {
        return;
      }
      
      // Check if data already exists in cache
      if (scheduleDataCache[weekStart]) {
        if (isMounted) {
          setLoadingSchedule(false);
        }
        return; // Data already loaded, no need to reload
      }
      
      if (isMounted) {
        setLoadingSchedule(true);
      }
      
      try {
        // Prepare parameters for batch API call
        const classAgeIds = classAges.map(ca => ca._id).join(',');
        const mealIds = meals.map(m => m._id).join(',');
        const weekdayIds = weekDaysOptions.map(wd => wd.id).join(',');
        
        // Single API call to get all weekly data
        const response = await nutritionService.getWeeklyAssignedDishes({
          week_start: weekStart,
          class_age_ids: classAgeIds,
          meal_ids: mealIds,
          weekday_ids: weekdayIds
        });
        
        if (!isMounted) return; // Component unmounted, don't update state
        
        const schedule = response.schedule || {};
        
        // Ensure all combinations exist in schedule (even if empty)
        const completeSchedule = {};
        for (const classAge of classAges) {
          for (const meal of meals) {
            for (const weekday of weekDaysOptions) {
              const key = `${classAge._id}-${meal._id}-${weekday.id}`;
              completeSchedule[key] = schedule[key] || {
                dishes: [],
                classAgeId: classAge._id,
                mealId: meal._id,
                weekdayId: weekday.id
              };
            }
          }
        }
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Save to cache
          setScheduleDataCache(prev => ({
            ...prev,
            [weekStart]: completeSchedule
          }));
        }
      } catch (e) {
        if (isMounted && e.name !== 'AbortError' && e.name !== 'CanceledError') {
          console.error('Error loading weekly schedule:', e);
          setError(e.message || 'Không thể tải lịch tuần');
        }
      } finally {
        if (isMounted) {
          setLoadingSchedule(false);
        }
      }
    }
    
    loadSchedule();
    
    // Cleanup function
    return () => {
      isMounted = false;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classAges.length, meals.length, weekDaysOptions.length, weekStart]);

  const getDateForWeekday = (dayIndex) => {
    return getDateForWeekdayVietnam(weekStart, dayIndex);
  };

  const getDishesForSlot = (classAgeId, mealId, weekdayId) => {
    const key = `${classAgeId}-${mealId}-${weekdayId}`;
    return scheduleData[key]?.dishes || [];
  };

  // Kiểm tra nhóm tuổi nào chưa hoàn thiện thực đơn
  const getIncompleteClassAges = useMemo(() => {
    if (!classAges.length || !meals.length || !weekDaysOptions.length || !scheduleData) return [];
    
    const incomplete = [];
    
    classAges.forEach(classAge => {
      let totalSlots = 0;
      let filledSlots = 0;
      
      // Chỉ kiểm tra các ngày trong tuần (Thứ 2 - Thứ 6, index 0-4)
      for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
        const weekday = weekDaysOptions[dayIndex];
        if (!weekday) continue;
        
        meals.forEach(meal => {
          totalSlots++;
          const key = `${classAge._id}-${meal._id}-${weekday.id}`;
          const dishes = scheduleData[key]?.dishes || [];
          if (dishes.length > 0) {
            filledSlots++;
          }
        });
      }
      
      // Nếu chưa đủ 100% thì coi là chưa hoàn thiện
      if (filledSlots < totalSlots) {
        incomplete.push({
          classAge,
          filledSlots,
          totalSlots,
          percentage: Math.round((filledSlots / totalSlots) * 100)
        });
      }
    });
    
    return incomplete;
  }, [classAges, meals, weekDaysOptions, scheduleData]);

  const mealColors = {
    'Breakfast': '#1976d2',
    'Lunch': '#43a047',
    'Snack': '#ff9800'
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <Card sx={{ maxWidth: '100%', mx: "auto", mb: 3, borderRadius: 4, boxShadow: 4 }}>
          <CardHeader 
            title={<ArgonTypography variant="h5" fontWeight="bold" color="success.main">Bảng Thực Đơn Tuần Chung</ArgonTypography>} 
          />
          <Divider />
          <CardContent>
        {loading && <ArgonBox display="flex" justifyContent="center" py={4}><CircularProgress /></ArgonBox>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {!loading && (
          <>
            {/* Week Navigation */}
            <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
              <Grid item xs={12} display="flex" alignItems="center" gap={2} flexWrap="wrap">
                <Button 
                  variant="outlined" 
                  size="medium"
                  onClick={() => setWeekStart(addDaysVietnam(weekStart, -7))}
                  disabled={loadingSchedule}
                  sx={{ minWidth: '100px' }}
                >
                  <i className="ni ni-bold-left" style={{ fontSize: '16px', marginRight: '8px' }} />
                  Tuần trước
                </Button>
                <ArgonBox 
                  sx={{ 
                    flex: 1, 
                    minWidth: '250px',
                    textAlign: 'center',
                    px: 2,
                    py: 1,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                    Tuần ({getDateForWeekday(0).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - {getDateForWeekday(6).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})
                  </ArgonTypography>
                </ArgonBox>
                <Button 
                  variant="outlined" 
                  size="medium"
                  onClick={() => setWeekStart(addDaysVietnam(weekStart, 7))}
                  disabled={loadingSchedule}
                  sx={{ minWidth: '100px' }}
                >
                  Tuần sau
                  <i className="ni ni-bold-right" style={{ fontSize: '16px', marginLeft: '8px' }} />
                </Button>
                <Button 
                  variant="contained" 
                  color="success"
                  size="medium"
                  onClick={() => setWeekStart(getStartOfWeekVietnam())}
                  disabled={loadingSchedule}
                  sx={{ minWidth: '100px' }}
                >
                  Tuần này
                </Button>
                {loadingSchedule && (
                  <CircularProgress size={24} sx={{ ml: 2 }} />
                )}
              </Grid>
            </Grid>

            {/* Warning for incomplete menus */}
            {!loadingSchedule && getIncompleteClassAges.length > 0 && (
              <Alert 
                severity="warning" 
                sx={{ mb: 2 }}
                icon={<i className="ni ni-notification-70" style={{ fontSize: '20px' }} />}
              >
                <ArgonTypography variant="body2" fontWeight="bold" mb={1}>
                  Cảnh báo: Có {getIncompleteClassAges.length} nhóm tuổi chưa hoàn thiện thực đơn:
                </ArgonTypography>
                <ArgonBox component="ul" sx={{ m: 0, pl: 3 }}>
                  {getIncompleteClassAges.map((item, idx) => (
                    <li key={item.classAge._id}>
                      <ArgonTypography variant="body2" component="span">
                        Thực đơn của nhóm <strong>&quot;{item.classAge.age_name}&quot;</strong> chưa hoàn thiện 
                        ({item.filledSlots}/{item.totalSlots} bữa - {item.percentage}%)
                      </ArgonTypography>
                    </li>
                  ))}
                </ArgonBox>
              </Alert>
            )}

            {/* Schedule Table */}
            {loadingSchedule ? (
              <ArgonBox display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </ArgonBox>
            ) : (
              <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 2, maxHeight: '70vh', overflow: 'auto' }}>
                <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableRow>
                      <TableCell sx={{ 
                        fontWeight: 700, 
                        fontSize: '15px', 
                        width: '200px',
                        position: 'sticky', 
                        left: 0, 
                        zIndex: 3, 
                        backgroundColor: '#43a047',
                        color: '#fff',
                        borderRight: '2px solid #2e7d32',
                        py: 2
                      }}>
                        Nhóm tuổi
                      </TableCell>
                      {weekDaysOptions.map((wd, idx) => {
                        const date = getDateForWeekday(idx);
                        const isWeekend = idx >= 5;
                        return (
                          <TableCell 
                            key={wd.id} 
                            align="center" 
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: '13px', 
                              py: 1.5,
                              borderLeft: idx > 0 ? '1px solid #e0e0e0' : 'none',
                              width: '220px',
                              backgroundColor: isWeekend ? '#fafafa' : '#f5f5f5'
                            }}
                          >
                            <ArgonTypography variant="body2" fontWeight="bold" color="dark" noWrap>
                              {wd.name}
                            </ArgonTypography>
                            <ArgonTypography variant="caption" color="text.secondary" noWrap>
                              {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                            </ArgonTypography>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  <TableBody>
                    {classAges.map((classAge, classAgeIndex) => (
                      meals.map((meal, mealIndex) => {
                        const mealColor = mealColors[meal.meal] || '#666';
                        const rowIndex = classAgeIndex * meals.length + mealIndex;
                        return (
                          <TableRow 
                            key={`${classAge._id}-${meal._id}`}
                            sx={{
                              '&:hover': {
                                backgroundColor: '#f9f9f9'
                              },
                              backgroundColor: classAgeIndex % 2 === 0 ? '#fff' : '#fafafa',
                              height: '100%'
                            }}
                          >
                            {mealIndex === 0 && (
                              <TableCell 
                                rowSpan={meals.length}
                                sx={{ 
                                  fontWeight: 700, 
                                  fontSize: '14px', 
                                  position: 'sticky', 
                                  left: 0, 
                                  zIndex: 2, 
                                  backgroundColor: classAgeIndex % 2 === 0 ? '#fff' : '#fafafa',
                                  borderRight: '2px solid #e0e0e0',
                                  py: 2,
                                  color: '#2e7d32',
                                  boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                                  width: '200px',
                                  verticalAlign: 'middle'
                                }}
                              >
                                <Tooltip title={classAge.age_name} arrow placement="right">
                                  <ArgonBox display="flex" alignItems="center" gap={1}>
                                    <ArgonBox
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: '#43a047',
                                        flexShrink: 0
                                      }}
                                    />
                                    <ArgonTypography variant="body2" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                      {classAge.age_name}
                                    </ArgonTypography>
                                  </ArgonBox>
                                </Tooltip>
                              </TableCell>
                            )}
                            {weekDaysOptions.map((wd, dayIndex) => {
                              const isWeekend = dayIndex >= 5;
                              const dishes = getDishesForSlot(classAge._id, meal._id, wd.id);
                              
                              return (
                                <TableCell 
                                  key={wd.id}
                                  sx={{ 
                                    py: 1.5,
                                    px: 1.5,
                                    borderLeft: dayIndex > 0 ? '1px solid #e0e0e0' : 'none',
                                    verticalAlign: 'top',
                                    width: '220px',
                                    backgroundColor: isWeekend ? '#f5f5f5' : (classAgeIndex % 2 === 0 ? '#fff' : '#fafafa'),
                                    overflow: 'visible',
                                    height: '100%'
                                  }}
                                >
                                  {isWeekend ? (
                                    <ArgonBox textAlign="center" py={2}>
                                      <ArgonTypography variant="caption" color="text.secondary">
                                        Nghỉ
                                      </ArgonTypography>
                                    </ArgonBox>
                                  ) : (
                                    <ArgonBox 
                                      sx={{
                                        border: `2px solid ${mealColor}`,
                                        borderRadius: 1.5,
                                        p: 1.2,
                                        backgroundColor: '#fff',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        transition: 'all 0.2s',
                                        width: '100%',
                                        height: '100%',
                                        minHeight: '100px',
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                        boxSizing: 'border-box',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '&:hover': {
                                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                          transform: 'translateY(-1px)'
                                        }
                                      }}
                                    >
                                      <ArgonBox display="flex" alignItems="center" gap={0.5} mb={0.8} flexShrink={0}>
                                        <ArgonBox
                                          sx={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            backgroundColor: mealColor,
                                            flexShrink: 0
                                          }}
                                        />
                                        <ArgonTypography 
                                          variant="caption" 
                                          fontWeight="bold"
                                          sx={{ color: mealColor, fontSize: '12px' }}
                                          noWrap
                                        >
                                          {meal.meal}
                                        </ArgonTypography>
                                      </ArgonBox>
                                      {dishes.length === 0 ? (
                                        <ArgonTypography 
                                          variant="caption" 
                                          sx={{ 
                                            fontSize: '11px', 
                                            color: 'text.secondary', 
                                            fontStyle: 'italic',
                                            textAlign: 'center',
                                            py: 0.5,
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        >
                                          Chưa có món
                                        </ArgonTypography>
                                      ) : (
                                        <ArgonBox 
                                          display="flex" 
                                          flexDirection="column" 
                                          gap={0.6} 
                                          sx={{ 
                                            width: '100%',
                                            flex: 1,
                                            overflow: 'auto'
                                          }}
                                        >
                                          {dishes.map((dish, idx) => {
                                            const dishName = dish.dish_name || dish.name || '';
                                            return (
                                              <Tooltip key={dish._id || idx} title={dishName} arrow placement="top">
                                                <Chip
                                                  label={dishName}
                                                  size="small"
                                                  sx={{
                                                    height: 'auto',
                                                    minHeight: '24px',
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    backgroundColor: '#f5f5f5',
                                                    border: '1px solid #e0e0e0',
                                                    maxWidth: '100%',
                                                    cursor: 'pointer',
                                                    '& .MuiChip-label': {
                                                      px: 1,
                                                      py: 0.5,
                                                      overflow: 'hidden',
                                                      textOverflow: 'ellipsis',
                                                      whiteSpace: 'nowrap',
                                                      display: 'block'
                                                    }
                                                  }}
                                                />
                                              </Tooltip>
                                            );
                                          })}
                                        </ArgonBox>
                                      )}
                                    </ArgonBox>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Legend */}
            <ArgonBox mt={3} display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <ArgonTypography variant="body2" fontWeight="bold" color="dark">
                Chú thích:
              </ArgonTypography>
              {meals.map(meal => {
                const mealColor = mealColors[meal.meal] || '#666';
                return (
                  <ArgonBox key={meal._id} display="flex" alignItems="center" gap={0.5}>
                    <ArgonBox
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '4px',
                        backgroundColor: mealColor
                      }}
                    />
                    <ArgonTypography variant="caption" color="text">
                      {meal.meal}
                    </ArgonTypography>
                  </ArgonBox>
                );
              })}
            </ArgonBox>
          </>
        )}
          </CardContent>
        </Card>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

