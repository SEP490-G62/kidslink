/**
=========================================================
* KidsLink Teacher Chat Page - v1.0.0
=========================================================

* Product Page: KidsLink Teacher Portal
* Copyright 2024 KidsLink Team

Coded by KidsLink Team

 =========================================================
*/

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Badge,
  Chip,
  InputAdornment,
  Paper,
  Stack
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import io from 'socket.io-client';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';

// Teacher components
import TeacherNavbar from 'examples/Navbars/TeacherNavbar';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Footer from 'examples/Footer';

// Services
import messagingService from 'services/messagingService';
import { useAuth } from 'context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TeacherChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const currentUserIdRef = useRef(null);
  
  const currentUserId = user?.id || user?._id;
  
  // Cập nhật refs khi state thay đổi
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);
  
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Scroll to bottom when messages change - Giống Messenger
  const scrollToBottom = (force = false) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      if (force) {
        // Force scroll ngay lập tức
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 0);
      } else {
        // Chỉ scroll nếu đang ở gần cuối (trong vòng 150px)
        const isNearBottom = 
          container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom) {
          setTimeout(() => {
            container.scrollTop = container.scrollHeight;
          }, 100);
        }
      }
    }
    // Fallback: scrollIntoView nếu không có container ref
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  };

  useEffect(() => {
    // Force scroll khi có tin nhắn mới
    scrollToBottom(true);
  }, [messages]);

  // Initialize Socket.IO connection - Tự động kết nối khi vào trang
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Chưa đăng nhập');
      return;
    }

    console.log('Đang khởi tạo kết nối Socket.IO...');
    
    const newSocket = io(API_BASE_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true, // Tự động kết nối lại
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000
    });

    // Kết nối thành công
    newSocket.on('connect', () => {
      console.log('✅ Socket đã kết nối thành công');
      setError(null);
    });

    // Mất kết nối
    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ Socket đã ngắt kết nối:', reason);
      if (reason === 'io server disconnect') {
        // Server ngắt kết nối, cần kết nối lại thủ công
        newSocket.connect();
      }
    });

    // Đang kết nối lại
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket đã kết nối lại sau ${attemptNumber} lần thử`);
      setError(null);
      // Join lại các conversations
      if (conversations.length > 0) {
        conversations.forEach(conv => {
          newSocket.emit('join_conversation', { conversation_id: conv._id });
        });
      }
      // Join conversation đang được chọn
      if (selectedConversation) {
        newSocket.emit('join_conversation', { conversation_id: selectedConversation._id });
      }
    });

    // Kết nối thất bại
    newSocket.on('connect_error', (error) => {
      console.error('❌ Lỗi kết nối Socket:', error.message);
      setError('Không thể kết nối đến server. Đang thử lại...');
    });

    // Lỗi xác thực hoặc lỗi khác
    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      setError(error.message || 'Lỗi kết nối socket');
    });

    // Lắng nghe xác nhận tin nhắn đã được gửi thành công
    newSocket.on('message_sent', (data) => {
      console.log('✅ Tin nhắn đã được gửi thành công:', data);
      // Tin nhắn sẽ được nhận qua event 'new_message' từ server
    });

    // Lắng nghe tin nhắn mới (từ server hoặc từ người khác)
    newSocket.on('new_message', (data) => {
      console.log('📨 Nhận tin nhắn mới:', data);
      const message = data.message || data;
      
      // Lấy conversation_id từ message (có thể là object hoặc string)
      let conversationId = message.conversation_id;
      if (conversationId && typeof conversationId === 'object') {
        conversationId = conversationId._id || conversationId.toString();
      }
      const conversationIdStr = conversationId?.toString();
      
      // Lấy conversation_id từ selectedConversation (sử dụng ref để có giá trị mới nhất)
      const currentSelectedConv = selectedConversationRef.current;
      const currentConvId = currentSelectedConv?._id;
      const currentConvIdStr = currentConvId?.toString();
      const currentUserIdFromRef = currentUserIdRef.current;
      
      // Kiểm tra tin nhắn có thuộc conversation đang mở không
      if (currentSelectedConv && conversationIdStr && currentConvIdStr && conversationIdStr === currentConvIdStr) {
        setMessages(prev => {
          // Xác định sender_id của tin nhắn mới
          const messageSenderId = message.sender_id?._id?.toString() || message.sender_id?.id?.toString() || message.sender_id?.toString();
          const currentUserIdStr = currentUserIdFromRef?.toString();
          const isMyMessage = messageSenderId === currentUserIdStr;
          
          // Nếu là tin nhắn của mình, tìm và thay thế tin nhắn pending
          if (isMyMessage) {
            // Tìm tin nhắn pending gần nhất (tin nhắn cuối cùng có isPending)
            let pendingIndex = -1;
            for (let i = prev.length - 1; i >= 0; i--) {
              if (prev[i].isPending) {
                // Kiểm tra nội dung có khớp không (so sánh sau khi trim)
                const pendingContent = (prev[i].content || '').trim();
                const newContent = (message.content || '').trim();
                
                if (pendingContent === newContent || prev[i].tempId) {
                  pendingIndex = i;
                  break;
                }
              }
            }
            
            if (pendingIndex !== -1) {
              // Thay thế tin nhắn pending bằng tin nhắn thật từ server
              console.log('🔄 Thay thế tin nhắn pending tại index', pendingIndex, 'bằng tin nhắn thật:', message);
              const newMessages = [...prev];
              newMessages[pendingIndex] = {
                ...message,
                isPending: false // Đảm bảo xóa flag pending
              };
              // Scroll xuống cuối sau khi thay thế
              setTimeout(() => {
                scrollToBottom(true);
              }, 100);
              return newMessages;
            } else {
              console.log('⚠️ Không tìm thấy tin nhắn pending để thay thế');
              console.log('Danh sách messages hiện tại:', prev.map(m => ({ id: m._id, content: m.content?.substring(0, 20), isPending: m.isPending })));
              console.log('Tin nhắn mới từ server:', { id: message._id, content: message.content?.substring(0, 20) });
            }
          }
          
          // Kiểm tra tin nhắn đã tồn tại chưa (tránh duplicate)
          const messageId = message._id?.toString() || message._id;
          const exists = prev.some(msg => {
            // Bỏ qua tin nhắn pending khi kiểm tra duplicate
            if (msg.isPending) return false;
            const msgId = msg._id?.toString() || msg._id;
            return msgId === messageId;
          });
          
          if (!exists) {
            // Thêm tin nhắn mới (chỉ nếu không phải duplicate)
            console.log('➕ Thêm tin nhắn mới:', message);
            const newMessages = [...prev, message];
            // Scroll xuống cuối sau khi thêm tin nhắn mới
            setTimeout(() => {
              scrollToBottom(true);
            }, 100);
            return newMessages;
          }
          
          console.log('⚠️ Tin nhắn đã tồn tại, bỏ qua');
          return prev;
        });
        
        // Đánh dấu đã đọc nếu không phải tin nhắn của mình
        const senderId = message.sender_id?._id || message.sender_id?.id || message.sender_id;
        if (senderId && senderId.toString() !== currentUserIdFromRef?.toString()) {
          messagingService.markAsRead(currentSelectedConv._id);
        }
      }
      
      // Cập nhật lastMessage trong conversations (luôn luôn cập nhật)
      setConversations(prev => prev.map(conv => {
        const convId = conv._id?.toString() || conv._id;
        if (convId?.toString() === conversationIdStr || conv._id?.toString() === conversationIdStr) {
          return { 
            ...conv, 
            lastMessage: message, 
            last_message_at: message.send_at || new Date()
          };
        }
        return conv;
      }));
    });

    // Lắng nghe thông báo tin nhắn mới (từ conversation khác)
    newSocket.on('new_message_notification', (data) => {
      // Cập nhật conversations list
      setConversations(prev => prev.map(conv => {
        if (conv._id === data.conversation_id) {
          return { ...conv, lastMessage: data.message, last_message_at: data.message.send_at };
        }
        return conv;
      }));
    });

    // Lắng nghe typing indicator
    newSocket.on('user_typing', (data) => {
      if (data.conversation_id === selectedConversation?._id) {
        setTypingUsers(prev => ({
          ...prev,
          [data.user_id]: data.is_typing
        }));
        // Tự động xóa typing sau 3 giây
        setTimeout(() => {
          setTypingUsers(prev => {
            const newState = { ...prev };
            delete newState[data.user_id];
            return newState;
          });
        }, 3000);
      }
    });

    setSocket(newSocket);

    // Cleanup: Đóng socket khi component unmount
    return () => {
      console.log('Đóng kết nối Socket.IO');
      newSocket.close();
    };
  }, []); // Chỉ chạy một lần khi component mount

  // Fetch conversations on mount - Tự động load khi vào trang
  useEffect(() => {
    fetchConversations();
  }, []); // Chạy ngay khi component mount

  // Join conversation room when selecting a conversation
  useEffect(() => {
    if (socket && selectedConversation) {
      // Đảm bảo socket đã kết nối
      if (socket.connected) {
        socket.emit('join_conversation', { conversation_id: selectedConversation._id });
        fetchMessages(selectedConversation._id);
        // Đánh dấu đã đọc
        messagingService.markAsRead(selectedConversation._id);
      } else {
        // Nếu chưa kết nối, đợi kết nối rồi join
        socket.once('connect', () => {
          socket.emit('join_conversation', { conversation_id: selectedConversation._id });
          fetchMessages(selectedConversation._id);
          messagingService.markAsRead(selectedConversation._id);
        });
      }
    }
  }, [selectedConversation, socket]);

  // Scroll khi selectedConversation thay đổi
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom(true);
      }, 300);
    }
  }, [selectedConversation]);

  // Join tất cả conversations khi socket connect và đã có danh sách conversations
  useEffect(() => {
    if (socket && socket.connected && conversations.length > 0) {
      conversations.forEach(conv => {
        socket.emit('join_conversation', { conversation_id: conv._id });
      });
    }
  }, [socket, conversations]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await messagingService.getConversations(1, 50);
      if (result.success) {
        setConversations(result.data.conversations || []);
        if (result.data.conversations && result.data.conversations.length > 0) {
          setSelectedConversation(result.data.conversations[0]);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Không thể tải danh sách cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoadingMessages(true);
      const result = await messagingService.getMessages(conversationId, 1, 100);
      if (result.success) {
        setMessages(result.data.messages || []);
        // Scroll xuống cuối sau khi load messages
        setTimeout(() => {
          scrollToBottom(true);
        }, 200);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Không thể tải tin nhắn');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !socket) return;

    const messageContent = newMessage.trim();
    
    // Kiểm tra socket đã kết nối chưa
    if (!socket.connected) {
      setError('Đang kết nối đến server...');
      // Đợi socket kết nối rồi mới gửi
      socket.once('connect', () => {
        sendMessageNow(messageContent);
      });
      return;
    }

    sendMessageNow(messageContent);
  };

  const sendMessageNow = (messageContent) => {
    // Optimistic update - Hiển thị tin nhắn ngay lập tức
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const timestamp = Date.now();
    const tempMessage = {
      _id: tempId,
      content: messageContent,
      sender_id: {
        _id: currentUserId,
        full_name: user?.full_name || 'Bạn',
        avatar_url: user?.avatar_url || '',
        role: user?.role || 'teacher'
      },
      conversation_id: selectedConversation._id,
      send_at: new Date(),
      read_status: 0,
      isPending: true, // Đánh dấu là tin nhắn đang chờ xác nhận
      tempId: tempId, // Lưu tempId để dễ dàng tìm và thay thế
      tempTimestamp: timestamp // Lưu timestamp để so khớp
    };

    // Thêm tin nhắn tạm vào danh sách
    setMessages(prev => {
      console.log('📝 Thêm tin nhắn tạm (pending):', tempMessage);
      return [...prev, tempMessage];
    });
    
    // Xóa input
    setNewMessage('');

    // Gửi typing indicator stop
    socket.emit('typing', {
      conversation_id: selectedConversation._id,
      is_typing: false
    });
    setIsTyping(false);

    try {
      // Đảm bảo đã join conversation room trước khi gửi (socket tự động join khi connect)
      // Gửi qua socket
      socket.emit('send_message', {
        conversation_id: selectedConversation._id,
        content: messageContent
      });

      console.log('📤 Đã gửi tin nhắn qua socket:', messageContent);
      
      // Timeout: Nếu sau 3 giây vẫn chưa nhận được response, thử fetch lại messages
      const timeoutId = setTimeout(() => {
        setMessages(prev => {
          const stillPending = prev.find(msg => msg.tempId === tempId && msg.isPending);
          if (stillPending) {
            console.warn('⚠️ Tin nhắn chưa được xác nhận sau 3 giây, đang fetch lại messages...');
            // Fetch lại messages để cập nhật
            fetchMessages(selectedConversation._id);
          }
          return prev;
        });
      }, 3000);
      
      // Lưu timeoutId để có thể clear nếu cần
      // (có thể lưu trong ref nếu cần)
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Không thể gửi tin nhắn');
      
      // Xóa tin nhắn tạm nếu có lỗi
      setMessages(prev => {
        console.log('❌ Xóa tin nhắn tạm do lỗi');
        return prev.filter(msg => msg.tempId !== tempId);
      });
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!isTyping && socket && selectedConversation) {
      setIsTyping(true);
      socket.emit('typing', {
        conversation_id: selectedConversation._id,
        is_typing: true
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedConversation) {
        socket.emit('typing', {
          conversation_id: selectedConversation._id,
          is_typing: false
        });
        setIsTyping(false);
      }
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = diffMs / (1000 * 60);

      if (diffMins < 1) {
        return 'Vừa xong';
      } else if (diffMins < 60) {
        return formatDistanceToNow(date, { addSuffix: true });
      } else if (diffMins < 1440) {
        return format(date, 'HH:mm');
      } else {
        return format(date, 'dd/MM/yyyy HH:mm');
      }
    } catch (err) {
      return '';
    }
  };

  const getConversationTitle = (conversation) => {
    if (conversation.title) {
      return conversation.title;
    }
    if (conversation.class_id) {
      return conversation.class_id.class_name || 'Nhóm chat';
    }
    return 'Cuộc trò chuyện';
  };

  const filteredConversations = conversations.filter(conv => {
    const title = getConversationTitle(conv).toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

  return (
    <DashboardLayout>
      <TeacherNavbar />
      <ArgonBox 
        py={2} 
        sx={{ 
          height: 'calc(100vh - 64px)', // Trừ chiều cao navbar
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden' // Không cho scroll toàn bộ trang
        }}
      >
        <ArgonBox mb={2} sx={{ flexShrink: 0 }}>
          <ArgonTypography variant="h4" fontWeight="bold">
            Nhắn tin
          </ArgonTypography>
        </ArgonBox>

        {error && (
          <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid 
          container 
          spacing={2} 
          sx={{ 
            flex: 1,
            minHeight: 0, // Quan trọng: cho phép shrink
            height: '100%',
            overflow: 'hidden' // Không cho scroll container
          }}
        >
          {/* Danh sách conversations */}
          <Grid item xs={12} md={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden',
              borderRadius: 2,
              boxShadow: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <CardContent sx={{ pb: 1, pt: 1.5, bgcolor: 'grey.50' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Tìm kiếm cuộc trò chuyện..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                  sx={{ 
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      bgcolor: 'white',
                      fontSize: '0.875rem',
                      '&:hover': {
                        bgcolor: 'grey.50'
                      },
                      '&.Mui-focused': {
                        bgcolor: 'white',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                      }
                    }
                  }}
                />
              </CardContent>

              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : filteredConversations.length === 0 ? (
                  <Box p={3} textAlign="center">
                    <ChatIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Chưa có cuộc trò chuyện nào
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {filteredConversations.map((conv, index) => {
                      const isSelected = selectedConversation?._id === conv._id;
                      const lastMessage = conv.lastMessage;
                      const unreadCount = conv.participants_count || 0;

                      return (
                        <React.Fragment key={conv._id}>
                          <ListItem
                            button
                            selected={isSelected}
                            onClick={() => setSelectedConversation(conv)}
                            dense
                            sx={{
                              backgroundColor: isSelected ? 'primary.lighter' : 'transparent',
                              borderRadius: 1.5,
                              mx: 0.75,
                              mb: 0.25,
                              py: 0.75,
                              pr: 1,
                              transition: 'all 0.2s',
                              overflow: 'hidden',
                              '&:hover': {
                                backgroundColor: isSelected ? 'primary.lighter' : 'grey.50',
                                transform: 'translateX(2px)'
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar 
                                sx={{ 
                                  bgcolor: isSelected ? 'primary.main' : 'primary.lighter',
                                  color: isSelected ? 'white' : 'primary.main',
                                  width: 40,
                                  height: 40,
                                  boxShadow: isSelected ? 2 : 0,
                                  transition: 'all 0.2s'
                                }}
                              >
                                {conv.class_id ? <GroupIcon fontSize="small" /> : <ChatIcon fontSize="small" />}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box 
                                  display="flex" 
                                  justifyContent="space-between" 
                                  alignItems="center"
                                  sx={{ width: '100%', gap: 1 }}
                                >
                                  <Typography 
                                    variant="body2" 
                                    fontWeight="bold" 
                                    sx={{ 
                                      fontSize: '0.875rem',
                                      flex: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      minWidth: 0
                                    }}
                                  >
                                    {getConversationTitle(conv)}
                                  </Typography>
                                  {lastMessage && (
                                    <Typography 
                                      variant="caption" 
                                      color="text.secondary" 
                                      sx={{ 
                                        fontSize: '0.7rem',
                                        flexShrink: 0,
                                        whiteSpace: 'nowrap',
                                        ml: 1
                                      }}
                                    >
                                      {formatMessageTime(lastMessage.send_at)}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 0.25, pr: 0.5 }}>
                                  {lastMessage ? (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: '0.75rem',
                                        display: 'block',
                                        width: '100%'
                                      }}
                                    >
                                      {lastMessage.sender_id?.full_name || 'Người dùng'}: {lastMessage.content}
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                      Chưa có tin nhắn
                                    </Typography>
                                  )}
                                </Box>
                              }
                              sx={{ 
                                overflow: 'hidden',
                                '& .MuiListItemText-primary': {
                                  overflow: 'hidden'
                                }
                              }}
                            />
                          </ListItem>
                          {index < filteredConversations.length - 1 && <Divider />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Messages area */}
          <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden',
              borderRadius: 2,
              boxShadow: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              {!selectedConversation ? (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 3
                  }}
                >
                  <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Chọn một cuộc trò chuyện để bắt đầu
                  </Typography>
                </Box>
              ) : (
                  <>
                  {/* Header - Cố định ở trên */}
                  <CardContent 
                    sx={{ 
                      pb: 1, 
                      pt: 1.5, 
                      borderBottom: 1, 
                      borderColor: 'divider', 
                      flexShrink: 0,
                      bgcolor: 'background.paper',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.main',
                            width: 36,
                            height: 36,
                            boxShadow: 2
                          }}
                        >
                          {selectedConversation.class_id ? <GroupIcon fontSize="small" /> : <ChatIcon fontSize="small" />}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '0.9375rem', lineHeight: 1.2 }}>
                            {getConversationTitle(selectedConversation)}
                          </Typography>
                          {selectedConversation.participants_count && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {selectedConversation.participants_count} thành viên
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>

                  {/* Messages - Scrollable area ở giữa */}
                  <Box
                    ref={messagesContainerRef}
                    sx={{
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      p: 1.5,
                      bgcolor: 'grey.50',
                      backgroundImage: 'linear-gradient(to bottom, #f8f9fa 0%, #f5f7fa 100%)',
                      minHeight: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      '&::-webkit-scrollbar': {
                        width: '5px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '3px',
                        '&:hover': {
                          background: 'rgba(0,0,0,0.3)',
                        },
                      },
                    }}
                  >
                    {loadingMessages ? (
                      <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                      </Box>
                    ) : messages.length === 0 ? (
                      <Box textAlign="center" p={3}>
                        <Typography variant="body2" color="text.secondary">
                          Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                        </Typography>
                      </Box>
                      ) : (
                      <Stack 
                        spacing={1} 
                        sx={{ 
                          flexGrow: 1,
                          justifyContent: 'flex-start'
                        }}
                      >
                        {messages.map((message) => {
                          const senderId = message.sender_id?._id || message.sender_id;
                          const isOwnMessage = senderId === currentUserId;
                            return (
                              <Box
                                key={message._id || `temp_${message.send_at}`}
                                display="flex"
                                justifyContent={isOwnMessage ? 'flex-end' : 'flex-start'}
                                sx={{ flexShrink: 0 }}
                              >
                              <Paper
                                elevation={isOwnMessage ? 2 : 1}
                                sx={{
                                  p: 1,
                                  px: 1.25,
                                  maxWidth: '75%',
                                  bgcolor: isOwnMessage ? 'primary.main' : 'white',
                                  color: isOwnMessage ? 'white' : 'text.primary',
                                  opacity: message.isPending ? 0.7 : 1,
                                  borderRadius: isOwnMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                  boxShadow: isOwnMessage 
                                    ? '0 2px 6px rgba(0,0,0,0.15)' 
                                    : '0 1px 3px rgba(0,0,0,0.12)',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    boxShadow: isOwnMessage 
                                      ? '0 3px 10px rgba(0,0,0,0.2)' 
                                      : '0 2px 6px rgba(0,0,0,0.15)',
                                  }
                                }}
                              >
                                {!isOwnMessage && (
                                  <Typography 
                                    variant="caption" 
                                    fontWeight="600" 
                                    display="block" 
                                    mb={0.5}
                                    sx={{ 
                                      fontSize: '0.7rem',
                                      opacity: 0.9
                                    }}
                                  >
                                    {message.sender_id?.full_name || 'Người dùng'}
                                  </Typography>
                                )}
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    wordBreak: 'break-word', 
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.4,
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  {message.content}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  mt={0.5}
                                  sx={{
                                    opacity: 0.65,
                                    textAlign: 'right',
                                    fontSize: '0.65rem',
                                    fontWeight: 400
                                  }}
                                >
                                  {formatMessageTime(message.send_at)}
                                  {message.isPending && ' · Đang gửi...'}
                                </Typography>
                              </Paper>
                            </Box>
                          );
                        })}
                        {/* Typing indicator */}
                        {Object.keys(typingUsers).length > 0 && (
                          <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-start' }}>
                            <Paper 
                              elevation={1} 
                              sx={{ 
                                p: 1, 
                                px: 1.25,
                                maxWidth: '75%', 
                                bgcolor: 'white',
                                borderRadius: '16px 16px 16px 4px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={0.75}>
                                <Box 
                                  sx={{ 
                                    display: 'flex', 
                                    gap: 0.4,
                                    '& > div': {
                                      width: 5,
                                      height: 5,
                                      borderRadius: '50%',
                                      bgcolor: 'text.secondary',
                                      animation: 'typing 1.4s infinite',
                                      '&:nth-of-type(2)': { animationDelay: '0.2s' },
                                      '&:nth-of-type(3)': { animationDelay: '0.4s' }
                                    },
                                    '@keyframes typing': {
                                      '0%, 60%, 100%': { opacity: 0.3 },
                                      '30%': { opacity: 1 }
                                    }
                                  }}
                                >
                                  <Box />
                                  <Box />
                                  <Box />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                                  Đang soạn tin nhắn...
                                </Typography>
                              </Box>
                            </Paper>
                          </Box>
                        )}
                        {/* Spacer để đảm bảo scroll đến cuối */}
                        <Box ref={messagesEndRef} sx={{ height: '1px', flexShrink: 0 }} />
                      </Stack>
                    )}
                  </Box>

                  {/* Input - Cố định ở dưới */}
                  <CardContent 
                    sx={{ 
                      pt: 1.5, 
                      pb: 1.5, 
                      borderTop: 1, 
                      borderColor: 'divider', 
                      flexShrink: 0,
                      bgcolor: 'background.paper',
                      boxShadow: '0 -2px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth
                        multiline
                        maxRows={3}
                        placeholder="Nhập tin nhắn..."
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyPress={handleKeyPress}
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end" sx={{ mr: 0.5 }}>
                              <IconButton
                                color="primary"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || !socket?.connected}
                                size="small"
                                sx={{
                                  bgcolor: newMessage.trim() && socket?.connected 
                                    ? 'primary.main' 
                                    : 'grey.300',
                                  color: newMessage.trim() && socket?.connected 
                                    ? 'white' 
                                    : 'grey.500',
                                  width: 32,
                                  height: 32,
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    bgcolor: newMessage.trim() && socket?.connected 
                                      ? 'primary.dark' 
                                      : 'grey.400',
                                    transform: 'scale(1.05)'
                                  },
                                  '&:disabled': {
                                    bgcolor: 'grey.300',
                                    color: 'grey.500'
                                  }
                                }}
                              >
                                <SendIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'white',
                            borderRadius: 2.5,
                            fontSize: '0.875rem',
                            '&:hover': {
                              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                            },
                            '&.Mui-focused': {
                              boxShadow: '0 2px 10px rgba(25, 118, 210, 0.2)'
                            }
                          },
                          '& .MuiOutlinedInput-input': {
                            py: 1
                          }
                        }}
                      />
                      {!socket?.connected && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.7rem' }}>
                          <CircularProgress size={8} />
                          Đang kết nối...
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </>
              )}
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>
      {/* Footer không hiển thị trong chat để tiết kiệm không gian */}
    </DashboardLayout>
  );
};

export default TeacherChat;

