import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Avatar,
  Chip,
  Box
} from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';

const StudentList = () => {
  // Mock data - trong thực tế sẽ lấy từ API
  const students = [
    {
      id: 1,
      name: 'Nguyễn Minh An',
      class: 'Lớp Mầm Non A1',
      avatar: '/static/images/avatar1.jpg',
      status: 'present',
      lastActivity: '2 giờ trước'
    },
    {
      id: 2,
      name: 'Trần Thị Bình',
      class: 'Lớp Mầm Non A1',
      avatar: '/static/images/avatar2.jpg',
      status: 'present',
      lastActivity: '1 giờ trước'
    },
    {
      id: 3,
      name: 'Lê Văn Cường',
      class: 'Lớp Mầm Non A2',
      avatar: '/static/images/avatar3.jpg',
      status: 'absent',
      lastActivity: 'Hôm qua'
    },
    {
      id: 4,
      name: 'Phạm Thị Dung',
      class: 'Lớp Mầm Non A2',
      avatar: '/static/images/avatar4.jpg',
      status: 'present',
      lastActivity: '30 phút trước'
    },
    {
      id: 5,
      name: 'Hoàng Văn Em',
      class: 'Lớp Mầm Non B1',
      avatar: '/static/images/avatar5.jpg',
      status: 'late',
      lastActivity: '1 giờ trước'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'Có mặt';
      case 'absent': return 'Vắng mặt';
      case 'late': return 'Đi muộn';
      default: return 'Không xác định';
    }
  };

  return (
    <ArgonBox>
      <ArgonTypography variant="h5" fontWeight="bold" mb={2}>
        Danh sách học sinh gần đây
      </ArgonTypography>
      
      <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Học sinh</strong></TableCell>
              <TableCell><strong>Lớp</strong></TableCell>
              <TableCell><strong>Trạng thái</strong></TableCell>
              <TableCell><strong>Hoạt động cuối</strong></TableCell>
              <TableCell><strong>Thao tác</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar 
                      src={student.avatar} 
                      sx={{ width: 32, height: 32, mr: 2 }}
                    >
                      {student.name.charAt(0)}
                    </Avatar>
                    <ArgonTypography variant="body2" fontWeight="medium">
                      {student.name}
                    </ArgonTypography>
                  </Box>
                </TableCell>
                <TableCell>
                  <ArgonTypography variant="body2">
                    {student.class}
                  </ArgonTypography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusText(student.status)}
                    color={getStatusColor(student.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <ArgonTypography variant="body2" color="text">
                    {student.lastActivity}
                  </ArgonTypography>
                </TableCell>
                <TableCell>
                  <ArgonTypography 
                    variant="body2" 
                    color="primary" 
                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Xem hồ sơ
                  </ArgonTypography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </ArgonBox>
  );
};

export default StudentList;
