import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'main' | 'group' | 'direct';
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  sender?: {
    email?: string;
    avatar_url?: string;
  };
}

export interface MessageRequest {
  id: string;
  from_user_id: string;
  to_user_email: string;
  to_user_id?: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
}

export function useChat() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageRequests, setMessageRequests] = useState<MessageRequest[]>([]);
  const [activeChatRoom, setActiveChatRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch chat rooms user has access to
  const fetchChatRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setChatRooms(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching chat rooms",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fetch messages for active chat room
  const fetchMessages = async (chatRoomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', chatRoomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch sender profiles separately to avoid foreign key issues
      const messagesWithSenders = await Promise.all(
        (data || []).map(async (message) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, avatar_url')
            .eq('user_id', message.sender_id)
            .single();
          
          return {
            ...message,
            sender: profile || null,
          };
        })
      );
      
      setMessages(messagesWithSenders);
    } catch (error: any) {
      toast({
        title: "Error fetching messages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Send a message
  const sendMessage = async (content: string, chatRoomId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content,
          chat_room_id: chatRoomId,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Join main chat room for new users
  const joinMainChatRoom = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const mainRoom = chatRooms.find(room => room.type === 'main');
      if (!mainRoom) return;

      // Check if user is already a participant
      const { data: existingParticipant } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('chat_room_id', mainRoom.id)
        .eq('user_id', user.id)
        .single();

      if (!existingParticipant) {
        const { error } = await supabase
          .from('chat_participants')
          .insert({
            chat_room_id: mainRoom.id,
            user_id: user.id,
          });

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error joining main chat room:', error);
    }
  };

  // Create message request
  const createMessageRequest = async (toEmail: string, message?: string) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_requests')
        .insert({
          from_user_id: user.id,
          to_user_email: toEmail,
          message,
        });

      if (error) throw error;

      toast({
        title: "Message request sent",
        description: `Request sent to ${toEmail}`,
      });
    } catch (error: any) {
      toast({
        title: "Error sending message request",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchChatRooms();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (chatRooms.length > 0) {
      joinMainChatRoom();
    }
  }, [chatRooms]);

  useEffect(() => {
    if (activeChatRoom) {
      fetchMessages(activeChatRoom.id);
    }
  }, [activeChatRoom]);

  // Set up real-time subscriptions
  useEffect(() => {
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (activeChatRoom && payload.new.chat_room_id === activeChatRoom.id) {
            fetchMessages(activeChatRoom.id);
          }
        }
      )
      .subscribe();

    const chatRoomsChannel = supabase
      .channel('chat-rooms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
        },
        () => {
          fetchChatRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(chatRoomsChannel);
    };
  }, [activeChatRoom]);

  return {
    chatRooms,
    messages,
    messageRequests,
    activeChatRoom,
    setActiveChatRoom,
    sendMessage,
    createMessageRequest,
    loading,
  };
}