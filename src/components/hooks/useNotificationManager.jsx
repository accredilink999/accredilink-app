import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export const useNotificationManager = () => {
  const queryClient = useQueryClient();
  const unsubscribesRef = useRef([]);
  const processedNotificationIdsRef = useRef(new Set());
  const audioContextRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Play audible alert
  const playAudioAlert = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      const now = audioContext.currentTime;

      for (let i = 0; i < 2; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = i === 0 ? 800 : 1000;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.3, now + (i * 0.3));
        gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.3) + 0.25);
        
        osc.start(now + (i * 0.3));
        osc.stop(now + (i * 0.3) + 0.25);
      }
    } catch (error) {
      console.log('Audio alert error:', error);
    }
  }, []);

  // Create notification from entity
  const createNotification = useCallback((type, data, actionUrl) => {
    const notificationId = `${type}-${data.id}-${Date.now()}`;
    
    // Prevent duplicate notifications
    if (processedNotificationIdsRef.current.has(notificationId)) {
      return;
    }
    processedNotificationIdsRef.current.add(notificationId);

    // Get notification details based on type
    const getNotificationDetails = () => {
      switch (type) {
        case 'message':
          return {
            title: data.title || 'New Message',
            description: data.content?.substring(0, 100) || 'You have a new message',
            url: actionUrl || '/messages',
          };
        case 'announcement':
          return {
            title: data.title || 'New Announcement',
            description: data.content?.substring(0, 100) || 'New announcement from management',
            url: actionUrl || '/messages',
          };
        case 'chat':
          return {
            title: `Message from ${data.sender_name}`,
            description: data.content?.substring(0, 100) || 'You have a new message',
            url: actionUrl || '/chat',
          };
        case 'approval':
          return {
            title: 'Approval Update',
            description: data.description || 'Your leave or swap request has been reviewed',
            url: actionUrl || '/approvals-and-financials',
          };
        case 'shift_reminder':
          return {
            title: 'Shift Reminder',
            description: `Shift coming up: ${data.start_time}`,
            url: actionUrl || '/rota',
          };
        case 'training':
          return {
            title: 'Training Reminder',
            description: data.training_name || 'You have a training assignment',
            url: actionUrl || '/training',
          };
        case 'incident':
          return {
            title: 'New Incident Report',
            description: data.title || 'An incident has been reported',
            url: actionUrl || '/incidents',
          };
        default:
          return {
            title: 'Notification',
            description: data.content || 'You have a new notification',
            url: actionUrl || '/dashboard',
          };
      }
    };

    const details = getNotificationDetails();

    // Play audio alert
    playAudioAlert();

    // Show toast notification
    toast.custom((t) => (
      <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-teal-500 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => {
          window.location.href = details.url;
          toast.dismiss(t);
        }}
      >
        <h3 className="font-semibold text-slate-900">{details.title}</h3>
        <p className="text-sm text-slate-600 mt-1">{details.description}</p>
        <p className="text-xs text-teal-600 mt-2 font-medium">Click to view →</p>
      </div>
    ), {
      duration: 6000,
    });

    // Store for offline delivery if needed
    try {
      localStorage.setItem(
        'pending_notifications',
        JSON.stringify([
          ...JSON.parse(localStorage.getItem('pending_notifications') || '[]'),
          { type, data, actionUrl, timestamp: Date.now() }
        ])
      );
    } catch (error) {
      console.log('Could not store notification:', error);
    }
  }, [playAudioAlert]);

  // Subscribe to messages/announcements
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeMessages = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' && event.data) {
        const message = event.data;
        if (message.type === 'announcement' && (!message.read_by || !message.read_by.includes(user.id))) {
          createNotification('announcement', message, '/messages');
        } else if (message.type === 'direct' && message.recipient_id === user.id) {
          createNotification('message', message, '/messages');
        }
      }
    });

    unsubscribesRef.current.push(unsubscribeMessages);
    return () => unsubscribeMessages();
  }, [user?.id, createNotification]);

  // Subscribe to chat messages
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeChatMessages = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type === 'create' && event.data) {
        const message = event.data;
        if (message.sender_id !== user.id) {
          // Check if user is part of this conversation
          base44.entities.Conversation.list().then(conversations => {
            const userConversation = conversations.find(c =>
              c.id === message.conversation_id && c.participants?.includes(user.id)
            );
            if (userConversation) {
              createNotification('chat', message, '/chat');
            }
          }).catch(err => console.log('Conversation check failed:', err));
        }
      }
    });

    unsubscribesRef.current.push(unsubscribeChatMessages);
    return () => unsubscribeChatMessages();
  }, [user?.id, createNotification]);

  // Subscribe to leave requests (approvals)
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeLeave = base44.entities.LeaveRequest.subscribe((event) => {
      if (event.type === 'update' && event.data) {
        const leave = event.data;
        if (leave.staff_id === user.id && (leave.status === 'approved' || leave.status === 'rejected')) {
          createNotification('approval', {
            id: leave.id,
            description: `Leave request ${leave.status}`
          }, '/approvals-and-financials');
        }
      }
    });

    unsubscribesRef.current.push(unsubscribeLeave);
    return () => unsubscribeLeave();
  }, [user?.id, createNotification]);

  // Subscribe to shift swap requests (approvals)
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeSwaps = base44.entities.ShiftSwapRequest.subscribe((event) => {
      if (event.type === 'update' && event.data) {
        const swap = event.data;
        if (swap.requester_id === user.id && (swap.status === 'approved' || swap.status === 'rejected')) {
          createNotification('approval', {
            id: swap.id,
            description: `Shift swap ${swap.status}`
          }, '/rota');
        }
      }
    });

    unsubscribesRef.current.push(unsubscribeSwaps);
    return () => unsubscribeSwaps();
  }, [user?.id, createNotification]);

  // Subscribe to incidents
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeIncidents = base44.entities.Incident.subscribe((event) => {
      if (event.type === 'create' && event.data) {
        const incident = event.data;
        createNotification('incident', incident, '/incidents');
      }
    });

    unsubscribesRef.current.push(unsubscribeIncidents);
    return () => unsubscribeIncidents();
  }, [user?.id, createNotification]);

  // Subscribe to custom notifications
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeNotifications = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data) {
        const notification = event.data;
        if (notification.recipient_id === user.id && !notification.is_read) {
          createNotification(notification.type || 'notification', notification);
        }
      }
    });

    unsubscribesRef.current.push(unsubscribeNotifications);
    return () => unsubscribeNotifications();
  }, [user?.id, createNotification]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      unsubscribesRef.current.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.log('Unsubscribe error:', error);
        }
      });
    };
  }, []);

  return { playAudioAlert, createNotification };
};