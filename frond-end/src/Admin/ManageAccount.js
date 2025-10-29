/* eslint-disable react/prop-types */
// @mui material components
import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonAvatar from "components/ArgonAvatar";
import ArgonBadge from "components/ArgonBadge";

// Argon Dashboard 2 MUI examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import Table from "examples/Tables/Table";

// Images (fallback avatars)
import team2 from "assets/images/team-2.jpg";

function FullName({ image, name }) {
  return (
    <ArgonBox display="flex" alignItems="center" px={1} py={0.5}>
      <ArgonBox mr={2}>
        <ArgonAvatar src={image} alt={name} size="sm" variant="rounded" />
      </ArgonBox>
      <ArgonTypography variant="button" fontWeight="medium">
        {name}
      </ArgonTypography>
    </ArgonBox>
  );
}

function statusBadge(status) {
  if (status === 1 || status === "1" || status === true) {
    return <ArgonBadge variant="gradient" badgeContent="active" color="success" size="xs" container />;
  }
  return <ArgonBadge variant="outlined" badgeContent="inactive" color="dark" size="xs" container />;
}

function mapUsersToTableRows(users, onEdit, onDelete) {
  return users.map((u) => {
    const avatar = u.avatar_url || team2;
    return {
      fullname: <FullName image={avatar} name={u.full_name || u.fullname || "—"} />,
      username: (
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
          {u.username || "—"}
        </ArgonTypography>
      ),
      phonenumber: (
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
          {u.phone_number || u.phonenumber || "—"}
        </ArgonTypography>
      ),
      email: (
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
          {u.email || "—"}
        </ArgonTypography>
      ),
      role: (
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
          {u.role || "—"}
        </ArgonTypography>
      ),
      status: statusBadge(u.status),
      action: (
        <Stack direction="row" spacing={1} justifyContent="center">
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={() => onEdit(u)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => onDelete(u)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    };
  });
}

const defaultColumns = [
  { name: "fullname", align: "left" },
  { name: "username", align: "left" },
  { name: "phonenumber", align: "left" },
  { name: "email", align: "left" },
  { name: "role", align: "center" },
  { name: "status", align: "center" },
  { name: "action", align: "center" },
];

function ManageAccount() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    password: "",
    role: "admin",
    email: "",
    phone_number: "",
    avatar_url: "",
    status: 1,
  });

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:9999";

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers: { "Content-Type": "application/json" } });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText} ${text}`);
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(err.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  const handleCreateOpen = () => {
    setForm({
      full_name: "",
      username: "",
      password: "",
      role: "admin",
      email: "",
      phone_number: "",
      avatar_url: "",
      status: 1,
    });
    setOpenCreate(true);
  };
  const handleCreateSubmit = async () => {
    try {
      const payload = { ...form };
      // ensure status is numeric
      payload.status = Number(payload.status);
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${res.statusText} ${t}`);
      }
      await res.json();
      setOpenCreate(false);
      fetchUsers();
    } catch (err) {
      console.error("Create failed:", err);
      alert("Create failed: " + err.message);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setForm({
      full_name: user.full_name || "",
      username: user.username || "",
      password: "",
      role: user.role || "admin",
      email: user.email || "",
      phone_number: user.phone_number || "",
      avatar_url: user.avatar_url || "",
      status: user.status ?? 1,
    });
    setOpenEdit(true);
  };
  const handleEditSubmit = async () => {
    if (!selectedUser) return;
    try {
      const payload = { ...form };
      if (payload.password === "") delete payload.password;
      payload.status = Number(payload.status);
      const res = await fetch(`${API_BASE}/api/admin/users/${selectedUser._id || selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${res.statusText} ${t}`);
      }
      await res.json();
      setOpenEdit(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed: " + err.message);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.full_name || user.username}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user._id || user.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${res.statusText} ${t}`);
      }
      await res.json();
      fetchUsers();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed: " + err.message);
    }
  };

  const handleChange = (k) => (e) => {
    let v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    if (k === "status") v = Number(v);
    setForm((s) => ({ ...s, [k]: v }));
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <ArgonBox mb={3}>
          <Card>
            <ArgonBox pt={3} px={3} display="flex" alignItems="center" justifyContent="space-between">
              <ArgonTypography variant="h6" fontWeight="medium">
                Users Management
              </ArgonTypography>

              <Stack direction="row" spacing={1} alignItems="center">
                <ArgonTypography variant="button" color="text" fontWeight="regular" sx={{ mr: 1 }}>
                  {loading ? "Loading..." : `${users.length} users`}
                </ArgonTypography>

                <Tooltip title="Create user">
                  <IconButton color="primary" onClick={handleCreateOpen}>
                    <AddIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Refresh">
                  <IconButton onClick={fetchUsers}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </ArgonBox>

            <ArgonBox px={3} pb={2}>
              {error && (
                <ArgonTypography variant="caption" color="error" fontWeight="regular">
                  Error loading users: {error}
                </ArgonTypography>
              )}
            </ArgonBox>

            <ArgonBox customClass="overflow-x-auto">
              <Table columns={defaultColumns} rows={mapUsersToTableRows(users, handleEdit, handleDelete)} />
            </ArgonBox>
          </Card>
        </ArgonBox>
      </ArgonBox>
      <Footer />

      {/* Create Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create user</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField variant="outlined" label="Full name" value={form.full_name} onChange={handleChange("full_name")} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField variant="outlined" label="Username" value={form.username} onChange={handleChange("username")} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField variant="outlined" label="Password" value={form.password} onChange={handleChange("password")} fullWidth type="password" InputLabelProps={{ shrink: true }} />
            <TextField variant="outlined" select label="Role" value={form.role} onChange={handleChange("role")} fullWidth InputLabelProps={{ shrink: true }}>
              <MenuItem value="admin">admin</MenuItem>
              <MenuItem value="school_admin">school_admin</MenuItem>
              <MenuItem value="teacher">teacher</MenuItem>
              <MenuItem value="parent">parent</MenuItem>
              <MenuItem value="health_care_staff">health_care_staff</MenuItem>
              <MenuItem value="nutrition_staff">nutrition_staff</MenuItem>
            </TextField>
            <TextField variant="outlined" label="Email" value={form.email} onChange={handleChange("email")} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField variant="outlined" label="Phone" value={form.phone_number} onChange={handleChange("phone_number")} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField variant="outlined" label="Avatar URL" value={form.avatar_url} onChange={handleChange("avatar_url")} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField variant="outlined" select label="Status" value={form.status} onChange={handleChange("status")} fullWidth InputLabelProps={{ shrink: true }}>
              <MenuItem value={1}>Active</MenuItem>
              <MenuItem value={0}>Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubmit}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit user</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField variant="outlined" label="Full name" value={form.full_name} onChange={handleChange("full_name")} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField variant="outlined" label="Username" value={form.username} onChange={handleChange("username")} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField variant="outlined" label="New password (leave blank to keep)" value={form.password} onChange={handleChange("password")} fullWidth type="password" InputLabelProps={{ shrink: true }} />
            <TextField variant="outlined" select label="Role" value={form.role} onChange={handleChange("role")} fullWidth InputLabelProps={{ shrink: true }}>
              <MenuItem value="admin">admin</MenuItem>
              <MenuItem value="school_admin">school_admin</MenuItem>
              <MenuItem value="teacher">teacher</MenuItem>
              <MenuItem value="parent">parent</MenuItem>
              <MenuItem value="health_care_staff">health_care_staff</MenuItem>
              <MenuItem value="nutrition_staff">nutrition_staff</MenuItem>
            </TextField>
            <TextField variant="outlined" label="Email" value={form.email} onChange={handleChange("email")} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField variant="outlined" label="Phone" value={form.phone_number} onChange={handleChange("phone_number")} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField variant="outlined" label="Avatar URL" value={form.avatar_url} onChange={handleChange("avatar_url")} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField variant="outlined" select label="Status" value={form.status} onChange={handleChange("status")} fullWidth InputLabelProps={{ shrink: true }}>
              <MenuItem value={1}>Active</MenuItem>
              <MenuItem value={0}>Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenEdit(false); setSelectedUser(null); }}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit}>Save</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default ManageAccount;
