import { useState, useRef, useEffect } from 'react';
import { ChatRoom, Message } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Hash, Users, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatInterfaceProps {
  activeChatRoom: ChatRoom | null;
  messages: Message[];
  onSendMessage: (content: string, chatRoomId: string) => void;
}

export function ChatInterface({ 
  activeChatRoom, 
  messages, 
  onSendMessage 
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatRoom || !user) return;

    onSendMessage(newMessage.trim(), activeChatRoom.id);
    setNewMessage('');
  };

  const getChatIcon = (room: ChatRoom) => {
    switch (room.type) {
      case 'main':
        return <Hash className="h-5 w-5" />;
      case 'group':
        return <Users className="h-5 w-5" />;
      case 'direct':
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Hash className="h-5 w-5" />;
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  if (!activeChatRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No chat selected</h3>
          <p className="text-muted-foreground">
            Choose a channel from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-3">
          {getChatIcon(activeChatRoom)}
          <div>
            <h2 className="font-semibold">{activeChatRoom.name}</h2>
            {activeChatRoom.description && (
              <p className="text-sm text-muted-foreground">
                {activeChatRoom.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.sender_id === user?.id;
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
              
              return (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    isOwnMessage ? 'justify-end' : ''
                  }`}
                >
                  {!isOwnMessage && (
                    <Avatar className={`h-8 w-8 ${showAvatar ? '' : 'invisible'}`}>
                      <AvatarFallback>
                        {message.sender?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {showAvatar && !isOwnMessage && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">
                          {message.sender?.email || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                    
                    {isOwnMessage && showAvatar && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  {isOwnMessage && (
                    <Avatar className={`h-8 w-8 ${showAvatar ? '' : 'invisible'}`}>
                      <AvatarFallback>
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${activeChatRoom.name}...`}
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}