/**
=========================================================
* KidsLink Parent Dashboard - Chat (Combined)
=========================================================
*/

// React
import { useState, useEffect, useRef } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Badge from "@mui/material/Badge";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import { EmojiEmotions as EmojiEmotionsIcon } from "@mui/icons-material";
// (ListItem/ListItemText/ListItemAvatar đã import ở trên)

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";

// Services
import messagingService from "services/messagingService";
import io from "socket.io-client";
import { useAuth } from "context/AuthContext";
import parentService from "services/parentService";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ParentChat() {
  const { user, selectedChild } = useAuth();
  const currentUserId = user?.id || user?._id;

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [creatingDirect, setCreatingDirect] = useState(false);
  const [children, setChildren] = useState([]);
  const [openTeacherSelect, setOpenTeacherSelect] = useState(false);
  const [teachersByChild, setTeachersByChild] = useState({});
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const currentUserIdRef = useRef(null);

  useEffect(() => { selectedConversationRef.current = selectedConversation; }, [selectedConversation]);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  const scrollToBottom = (force = false) => {
    if (messagesContainerRef.current) {
      const c = messagesContainerRef.current;
      const near = c.scrollHeight - c.scrollTop - c.clientHeight < 150;
      if (force || near) setTimeout(() => { c.scrollTop = c.scrollHeight; }, 0);
    }
    if (messagesEndRef.current) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80);
  };
  useEffect(() => { scrollToBottom(true); }, [messages]);

  // Socket init
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setError('Chưa đăng nhập'); return; }
    const s = io(API_BASE_URL, { auth: { token }, transports: ['websocket','polling'], reconnection: true });
    s.on('connect', () => setError(null));
    s.on('error', (e) => setError(e.message || 'Lỗi socket'));
    s.on('new_message', (data) => {
      const message = data.message || data;
      let convId = message.conversation_id; if (convId && typeof convId === 'object') convId = convId._id || convId.toString();
      const convStr = convId?.toString();
      const cur = selectedConversationRef.current; const curStr = cur?._id?.toString();
      const isActive = cur && convStr && curStr && convStr === curStr;
      if (isActive) {
        setMessages(prev => {
          const id = message._id?.toString() || message._id;
          const exists = prev.some(m => (!m.isPending) && ((m._id?.toString() || m._id) === id));
          if (exists) return prev;
          const incomingTempId = data.tempId;
          if (incomingTempId) {
            const idx = prev.findIndex(m => m.isPending && m.tempId === incomingTempId);
            if (idx !== -1) { const a = [...prev]; a[idx] = { ...message, isPending: false }; return a; }
          }
          return [...prev, message];
        });
      }
      setConversations(prev => {
        let updated = prev.map(c => {
          const id = (c._id?.toString() || c._id)?.toString();
          if (id === convStr) {
            const senderId = message.sender_id?._id || message.sender_id?.id || message.sender_id;
            const isMine = senderId && senderId.toString() === currentUserIdRef.current?.toString();
            const unreadInc = (!isActive && !isMine) ? 1 : 0;
            const newLastMessageAt = message.send_at ? new Date(message.send_at) : new Date();
            return { ...c, lastMessage: message, last_message_at: newLastMessageAt, unread_count: Math.max(0, (c.unread_count || 0) + unreadInc) };
          }
          return c;
        });
        // Sắp xếp lại theo last_message_at mới nhất (desc)
        updated = [...updated].sort((a, b) => {
          // Lấy timestamp từ last_message_at hoặc từ lastMessage.send_at
          const getTime = (conv) => {
            if (conv.last_message_at) {
              const date = new Date(conv.last_message_at);
              return isNaN(date.getTime()) ? 0 : date.getTime();
            }
            if (conv.lastMessage && conv.lastMessage.send_at) {
              const date = new Date(conv.lastMessage.send_at);
              return isNaN(date.getTime()) ? 0 : date.getTime();
            }
            return 0;
          };
          const timeA = getTime(a);
          const timeB = getTime(b);
          return timeB - timeA; // Mới nhất lên đầu
        });
        // Đếm số conversation có tin nhắn chưa đọc thay vì tổng số tin nhắn
        const conversationUnreadCount = updated.filter(c => (c.unread_count || 0) > 0).length;
        localStorage.setItem('kidslink:unread_total', String(conversationUnreadCount));
        window.dispatchEvent(new CustomEvent('kidslink:unread_total', { detail: { total: conversationUnreadCount } }));
        return updated;
      });
    });

    // Nhận thông báo tin nhắn mới từ conv khác (ví dụ nhóm) khi không ở trong conv đó
    s.on('new_message_notification', (data) => {
      setConversations(prev => {
        let updated = prev.map(c => {
          const idStr = (c._id?.toString() || c._id)?.toString();
          const targetIdStr = (data.conversation_id?._id || data.conversation_id || '').toString();
          if (idStr === targetIdStr) {
            const newLastMessageAt = data.message.send_at ? new Date(data.message.send_at) : new Date();
            return {
              ...c,
              lastMessage: data.message,
              last_message_at: newLastMessageAt,
              unread_count: Math.max(0, (c.unread_count || 0) + 1)
            };
          }
          return c;
        });
        // Sắp xếp lại theo last_message_at mới nhất (desc)
        updated = [...updated].sort((a, b) => {
          // Lấy timestamp từ last_message_at hoặc từ lastMessage.send_at
          const getTime = (conv) => {
            if (conv.last_message_at) {
              const date = new Date(conv.last_message_at);
              return isNaN(date.getTime()) ? 0 : date.getTime();
            }
            if (conv.lastMessage && conv.lastMessage.send_at) {
              const date = new Date(conv.lastMessage.send_at);
              return isNaN(date.getTime()) ? 0 : date.getTime();
            }
            return 0;
          };
          const timeA = getTime(a);
          const timeB = getTime(b);
          return timeB - timeA; // Mới nhất lên đầu
        });
        // Đếm số conversation có tin nhắn chưa đọc thay vì tổng số tin nhắn
        const conversationUnreadCount = updated.filter(c => (c.unread_count || 0) > 0).length;
        localStorage.setItem('kidslink:unread_total', String(conversationUnreadCount));
        window.dispatchEvent(new CustomEvent('kidslink:unread_total', { detail: { total: conversationUnreadCount } }));
        return updated;
      });
    });
    setSocket(s);
    return () => s.close();
  }, []);

  // Fetch children for teacher selection (parent may have multiple students)
  useEffect(() => {
    (async () => {
      try {
        if (user?.role === 'parent') {
          const res = await parentService.getChildren();
          if (res?.success && Array.isArray(res.data)) {
            setChildren(res.data);
          }
        }
      } catch (e) {
        console.error('Error fetching children:', e);
      }
    })();
  }, [user]);

  // Load conversations
  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        const [convRes, unreadRes] = await Promise.all([
          messagingService.getConversations(1, 50),
          messagingService.getUnreadCount()
        ]);
        if (convRes.success) {
          let conversationsData = convRes.data.conversations || [];
          const unreadMap = new Map();
          let totalUnread = 0;
          if (unreadRes && unreadRes.success && unreadRes.data) {
            totalUnread = parseInt(unreadRes.data.total || 0, 10) || 0;
            const byConv = Array.isArray(unreadRes.data.byConversation) ? unreadRes.data.byConversation : [];
            byConv.forEach(item => {
              const id = (item._id?._id || item._id || '').toString();
              unreadMap.set(id, item.count || 0);
            });
          }
          // Sort by last_message_at desc - sử dụng helper function để lấy timestamp chính xác
          const getTimeForSort = (conv) => {
            if (conv.last_message_at) {
              const date = new Date(conv.last_message_at);
              return isNaN(date.getTime()) ? 0 : date.getTime();
            }
            if (conv.lastMessage && conv.lastMessage.send_at) {
              const date = new Date(conv.lastMessage.send_at);
              return isNaN(date.getTime()) ? 0 : date.getTime();
            }
            return 0;
          };
          conversationsData = [...conversationsData].sort((a, b) => {
            const timeA = getTimeForSort(a);
            const timeB = getTimeForSort(b);
            return timeB - timeA; // Mới nhất lên đầu
          });
          const merged = conversationsData.map(c => {
            const id = (c._id?._id || c._id || '').toString();
            return { ...c, unread_count: unreadMap.get(id) || 0 };
          });
          setConversations(merged);
          // Đồng bộ badge trên sidenav - đếm số conversation có tin nhắn chưa đọc
          const conversationUnreadCount = merged.filter(c => (c.unread_count || 0) > 0).length;
          localStorage.setItem('kidslink:unread_total', String(conversationUnreadCount));
          window.dispatchEvent(new CustomEvent('kidslink:unread_total', { detail: { total: conversationUnreadCount } }));
          if (merged.length) setSelectedConversation(merged[0]);
        } else setError(convRes.error);
      } catch (e) { setError(e.message || 'Không thể tải danh sách cuộc trò chuyện'); }
      finally { setLoading(false); }
    })();
  }, []);

  // Join rooms when socket ready
  useEffect(() => { if (socket && socket.connected && conversations.length > 0) conversations.forEach(c => socket.emit('join_conversation', { conversation_id: c._id })); }, [socket, conversations]);

  // Load messages when selecting
  useEffect(() => {
    if (!selectedConversation) return;
    (async () => {
      try {
        setLoadingMessages(true);
        const res = await messagingService.getMessages(selectedConversation._id, 1, 100);
        if (res.success) setMessages(res.data.messages || []); else setError(res.error);
        setTimeout(() => scrollToBottom(true), 180);
      } catch (e) { setError(e.message || 'Không thể tải tin nhắn'); }
      finally { setLoadingMessages(false); }
    })();
    if (socket) socket.emit('join_conversation', { conversation_id: selectedConversation._id });
    // Đánh dấu đã đọc và reset unread_count
    (async () => {
      try {
        await messagingService.markAsRead(selectedConversation._id);
      } catch {}
      setConversations(prev => {
        const updated = prev.map(c => {
          const id = (c._id?.toString() || c._id)?.toString();
          const selId = (selectedConversation._id?.toString() || selectedConversation._id)?.toString();
          if (id === selId) return { ...c, unread_count: 0 };
          return c;
        });
        // Đếm số conversation có tin nhắn chưa đọc thay vì tổng số tin nhắn
        const conversationUnreadCount = updated.filter(c => (c.unread_count || 0) > 0).length;
        localStorage.setItem('kidslink:unread_total', String(conversationUnreadCount));
        window.dispatchEvent(new CustomEvent('kidslink:unread_total', { detail: { total: conversationUnreadCount } }));
        return updated;
      });
    })();
  }, [selectedConversation, socket]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !socket) return;
    const content = newMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const temp = { _id: tempId, content, sender_id: { _id: currentUserId }, conversation_id: selectedConversation._id, send_at: new Date(), read_status: 0, isPending: true, tempId };
    setMessages(prev => [...prev, temp]); setNewMessage('');
    socket.emit('send_message', { conversation_id: selectedConversation._id, content, tempId });
  };

  const handleOpenFilePicker = () => { if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); } };
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]; if (!file || !selectedConversation || !socket) return;
    if (file.size > 20 * 1024 * 1024) { setError('Ảnh vượt quá 20MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result; const tempId = `temp_${Date.now()}_${Math.random()}`;
      const temp = { _id: tempId, image_base64: base64, conversation_id: selectedConversation._id, sender_id: { _id: currentUserId }, send_at: new Date(), read_status: 0, isPending: true, tempId };
      setMessages(prev => [...prev, temp]);
      socket.emit('send_message', { conversation_id: selectedConversation._id, image_base64: base64, tempId });
    };
    reader.readAsDataURL(file);
  };

  const getTitle = (conv) => {
    // Nếu conversation có 2 thành viên, hiển thị tên đối phương
    if (conv.participants_count === 2 && conv.participants && Array.isArray(conv.participants)) {
      const otherParticipant = conv.participants.find(
        p => (p._id?.toString() || p._id) !== (currentUserId?.toString() || currentUserId)
      );
      if (otherParticipant && otherParticipant.full_name) {
        return otherParticipant.full_name;
      }
    }
    // Nếu không phải 1-1 hoặc không có participants, dùng title hoặc class_name
    return conv.title || (conv.class_id ? (conv.class_id.class_name || 'Nhóm chat') : 'Cuộc trò chuyện');
  };
  const filteredConversations = conversations.filter(conv => getTitle(conv).toLowerCase().includes(searchQuery.toLowerCase()));

  const formatMinutesAgo = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        // Sau 1 giờ: hiển thị theo giờ trong ngày HH:mm
        const hh = date.getHours().toString().padStart(2, '0');
        const mm = date.getMinutes().toString().padStart(2, '0');
        return `${hh}:${mm}`;
      }
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) {
        // Sau 1 ngày: hiển thị theo ngày/tháng dd/MM
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${d}/${m}`;
      }
      const diffMonths = Math.floor(diffDays / 30);
      if (diffMonths < 12) {
        // Sau 1 tháng: hiển thị theo tháng/năm MM/yyyy
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${m}/${y}`;
      }
      // Sau 1 năm: hiển thị theo năm yyyy
      return `${date.getFullYear()}`;
    } catch (e) {
      return '';
    }
  };

  const commonEmojis = [
    '😀','😃','😄','😁','😆','😂','🤣','😊','😍','😘','😜','🤗','👍','👏','🙏','💪','🎉','✨','🔥','❤️','💙','💚','💛','🥳','🤔','😅'
  ];
  const openEmoji = Boolean(emojiAnchorEl);
  const handleOpenEmoji = (e) => setEmojiAnchorEl(e.currentTarget);
  const handleCloseEmoji = () => setEmojiAnchorEl(null);
  const handlePickEmoji = (emo) => {
    setNewMessage((prev) => (prev || '') + emo);
  };

  const formatMessageTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const hh = date.getHours().toString().padStart(2, '0');
      const mm = date.getMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    } catch (e) {
      return '';
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <Grid container spacing={3}>
          {/* Left: conversations */}
          <Grid item xs={12} md={4} sx={{ height: '80vh', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <CardContent sx={{ pb: 1, pt: 1.5 }}>
                <ArgonBox display="flex" gap={1}>
                  <TextField fullWidth placeholder="Tìm kiếm ..." size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><i className="ni ni-zoom-split-in" /></InputAdornment>) }} />
                  <Button 
                    variant="contained" 
                    color="primary" 
                    disableElevation
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 2,
                      '&.Mui-disabled': { bgcolor: 'primary.light', color: 'white', opacity: 0.7 }
                    }}
                    disabled={creatingDirect}
                    onClick={async () => {
                      try {
                        // Luôn mở dialog để chọn giáo viên (kể cả khi chỉ có 1 con)
                        const childrenList = children && children.length > 0 ? children : (selectedChild ? [selectedChild] : []);
                        if (childrenList.length === 0) {
                          setError('Không tìm thấy học sinh');
                          return;
                        }
                        // Prefetch teachers for each child
                        const entries = await Promise.all(childrenList.map(async (child) => {
                          try {
                            const r = await messagingService.getTeachersByStudent(child._id);
                            return [child._id, r.success ? (r.data.teachers || []) : []];
                          } catch {
                            return [child._id, []];
                          }
                        }));
                        const map = {};
                        entries.forEach(([k, v]) => { map[k] = v; });
                        setTeachersByChild(map);
                        setOpenTeacherSelect(true);
                      } catch (e) {
                        setError(e.message || 'Không thể tải danh sách giáo viên');
                      }
                    }}
                  >
                    {creatingDirect ? 'Đang tạo...' : 'Nhắn với giáo viên'}
                  </Button>
        </ArgonBox>
              </CardContent>
              <CardContent sx={{ flex: 1, overflow: 'auto', pt: 0 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {loading ? (
                  <ArgonBox display="flex" justifyContent="center" py={3}><CircularProgress /></ArgonBox>
                ) : (
            <List>
                    {filteredConversations.map((conv) => {
                      const isSelected = selectedConversation?._id === conv._id; const lastMessage = conv.lastMessage; const unreadCount = conv.unread_count || 0;
                      return (
                        <ListItem key={conv._id} button selected={isSelected} onClick={() => setSelectedConversation(conv)} sx={{ borderRadius: 2, mb: 0.5 }}>
                  <ListItemAvatar>
                            <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent={<div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#9e9e9e' }} />}>
                              <Avatar>{conv.class_id ? '👥' : '💬'}</Avatar>
                    </Badge>
                  </ListItemAvatar>
                          <ListItemText primary={
                      <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
                              <ArgonTypography variant="body1" fontWeight={unreadCount > 0 ? 800 : 'bold'} color="dark" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {getTitle(conv)}
                        </ArgonTypography>
                              <ArgonBox display="flex" alignItems="center" gap={1}>
                                {conv.participants_count >= 3 && (
                                  <Chip label="Nhóm" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                                )}
                                <ArgonTypography variant="caption" color="text">{lastMessage ? formatMinutesAgo(lastMessage.send_at) : ''}</ArgonTypography>
                              </ArgonBox>
                            </ArgonBox>
                          } secondary={
                        <ArgonBox display="flex" alignItems="center" gap={1}>
                              <ArgonTypography variant="caption" color="text" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                {lastMessage ? `${lastMessage.sender_id?.full_name || 'Người dùng'}: ${lastMessage.content || (lastMessage.image_url ? '[Ảnh]' : '')}` : 'Chưa có tin nhắn'}
                          </ArgonTypography>
                              {unreadCount > 0 && (
                                <Chip 
                                  label={unreadCount > 99 ? '99+' : unreadCount}
                                  color="error"
                                  size="small"
                                />
                              )}
                        </ArgonBox>
                          } />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right: messages */}
          <Grid item xs={12} md={8} sx={{ height: '80vh', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {!selectedConversation ? (
                <ArgonBox flex={1} display="flex" alignItems="center" justifyContent="center"><ArgonTypography color="text">Chọn một cuộc trò chuyện</ArgonTypography></ArgonBox>
              ) : (
                <>
                  <CardContent sx={{ pb: 1, pt: 1.5, borderBottom: '1px solid #eee' }}>
                    <ArgonBox display="flex" alignItems="center" gap={1.5}>
                      <Avatar>{selectedConversation.class_id ? '👥' : '💬'}</Avatar>
                      <ArgonBox>
                        <ArgonBox display="flex" alignItems="center" gap={1}>
                          <ArgonTypography variant="subtitle1" fontWeight="bold">{getTitle(selectedConversation)}</ArgonTypography>
                          {selectedConversation.participants_count >= 3 && (
                            <Chip label="Nhóm" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                        </ArgonBox>
                        {selectedConversation.participants_count ? <ArgonTypography variant="caption" color="text">{selectedConversation.participants_count} thành viên</ArgonTypography> : null}
                      </ArgonBox>
                    </ArgonBox>
                  </CardContent>
                  <ArgonBox ref={messagesContainerRef} sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'grey.50' }}>
                    {loadingMessages ? (
                      <ArgonBox display="flex" justifyContent="center" py={3}><CircularProgress /></ArgonBox>
                    ) : messages.length === 0 ? (
                      <ArgonBox textAlign="center" py={3}><ArgonTypography color="text">Chưa có tin nhắn</ArgonTypography></ArgonBox>
                    ) : (
                      <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {messages.map((m) => {
                          const senderId = m.sender_id?._id || m.sender_id; const isOwn = senderId === currentUserId;
                          return (
                            <ArgonBox key={m._id || `temp_${m.send_at}`} display="flex" justifyContent={isOwn ? 'flex-end' : 'flex-start'}>
                              <Paper sx={{ p: 1, px: 1.25, maxWidth: '75%', bgcolor: isOwn ? 'primary.main' : 'white', color: isOwn ? 'white' : 'text.primary', opacity: m.isPending ? 0.7 : 1, borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px' }}>
                                {!isOwn && selectedConversation.class_id && (
                        <ArgonTypography
                                    variant="caption" 
                                    color={isOwn ? 'white' : 'text'} 
                                    sx={{ mb: 0.5, display: 'block', opacity: 0.9 }}
                                  >
                                    {m.sender_id?.full_name || 'Người dùng'}
                        </ArgonTypography>
                                )}
                                {(m.image_url || m.image_base64) && (
                                  <ArgonBox mb={m.content ? 0.75 : 0}>
                                    <img 
                                      src={m.image_url || m.image_base64} 
                                      alt="img" 
                                      onClick={() => setPreviewImageUrl(m.image_url || m.image_base64)}
                                      style={{ 
                                        display: 'block',
                                        width: 220,
                                        height: 220,
                                        objectFit: 'cover',
                                        borderRadius: 8,
                                        cursor: 'pointer'
                                      }} 
                                    />
                                  </ArgonBox>
                                )}
                                {m.content && (<ArgonTypography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.content}</ArgonTypography>)}
                                <ArgonTypography
                                  variant="caption"
                                  color="dark"
                                  sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}
                                >
                                  {formatMessageTime(m.send_at)}
                                  {m.isPending && ' · Đang gửi...'}
                                </ArgonTypography>
                              </Paper>
                            </ArgonBox>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </List>
                        )}
                      </ArgonBox>
                  <CardContent sx={{ borderTop: '1px solid #eee' }}>
                    <ArgonBox sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField 
                        fullWidth 
                        multiline 
                        maxRows={3} 
                        placeholder="Nhập tin nhắn..." 
                        size="small" 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} 
                      />
                      <IconButton 
                        color="default" 
                        onClick={handleOpenEmoji}
                        size="small"
                        sx={{ flexShrink: 0 }}
                        aria-label="emoji-picker"
                      >
                        <EmojiEmotionsIcon fontSize="small" />
                      </IconButton>
                      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                      <IconButton 
                        color="primary" 
                        onClick={() => { if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); } }} 
                        size="small"
                        sx={{ flexShrink: 0 }}
                      >
                        <i className="ni ni-image" />
                      </IconButton>
                      <IconButton 
                        color="primary" 
                        onClick={handleSendMessage} 
                        size="small" 
                        disabled={!newMessage.trim() || !socket?.connected}
                        sx={{ flexShrink: 0 }}
                      >
                        <i className="ni ni-send" />
                      </IconButton>
              </ArgonBox>
                  </CardContent>
                </>
            )}
        </Card>
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />

      {/* Dialog chọn giáo viên theo từng học sinh (tạo direct conversation theo student) */}
      <Dialog open={openTeacherSelect} onClose={() => setOpenTeacherSelect(false)} fullWidth maxWidth="xs">
      <DialogTitle>Chọn giáo viên để nhắn</DialogTitle>
      <DialogContent dividers>
        {children && children.length > 0 ? (
          <List sx={{ p: 0 }}>
            {children.map((child) => (
              <ArgonBox key={child._id} mb={1.5}>
                <ListItem disableGutters>
                  <ListItemAvatar>
                    <Avatar src={child.avatar_url}>{child.full_name?.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={child.full_name}
                    secondary={child.class?.class_name ? `Lớp: ${child.class.class_name}` : 'Chưa có lớp'}
                  />
                </ListItem>
                <ArgonBox display="flex" gap={1} mt={0.5} pl={7}>
                  {(teachersByChild[child._id] || []).map(t => (
                    <Button 
                      key={t.user_id} 
                      size="small" 
                      variant="contained" 
                      color="primary"
                      disableElevation
                      sx={{ textTransform: 'none', fontWeight: 700, px: 1.5 }}
                      onClick={async () => {
                      try {
                        setCreatingDirect(true);
                        const res = await messagingService.createDirectConversation(t.user_id, child._id);
                        if (res.success) {
                          const conv = res.data.conversation;
                          setConversations(prev => [conv, ...prev.filter(c => (c._id?.toString() || c._id) !== (conv._id?.toString() || conv._id))]);
                          setSelectedConversation(conv);
                          setOpenTeacherSelect(false);
                        } else {
                          setError(res.error);
                        }
                      } catch (e) {
                        setError(e.message || 'Không thể tạo trò chuyện');
                      } finally {
                        setCreatingDirect(false);
                      }
                      }}>{t.full_name}</Button>
                  ))}
                </ArgonBox>
              </ArgonBox>
            ))}
          </List>
        ) : (
          <ArgonTypography variant="body2" color="text">Không có học sinh để chọn</ArgonTypography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenTeacherSelect(false)}>Đóng</Button>
      </DialogActions>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog open={!!previewImageUrl} onClose={() => setPreviewImageUrl(null)} fullScreen>
        <DialogContent 
          onClick={() => setPreviewImageUrl(null)}
          sx={{ p: 0, m: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'black', width: '100vw', height: '100vh' }}
        >
          {previewImageUrl && (
            <img 
              src={previewImageUrl} 
              alt="preview" 
              style={{ width: '100vw', height: '100vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Emoji picker */}
      <Popover
        open={openEmoji}
        anchorEl={emojiAnchorEl}
        onClose={handleCloseEmoji}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        disableRestoreFocus
      >
        <Box sx={{ p: 1, maxWidth: 260, display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.5 }}>
          {commonEmojis.map((e) => (
            <Box
              key={e}
              onClick={() => handlePickEmoji(e)}
              sx={{ cursor: 'pointer', fontSize: 20, lineHeight: '28px', textAlign: 'center', '&:hover': { filter: 'brightness(1.1)' } }}
            >
              {e}
            </Box>
          ))}
        </Box>
      </Popover>
    </DashboardLayout>
  );
}

export default ParentChat;
