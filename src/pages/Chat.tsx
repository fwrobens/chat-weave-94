import { useChat } from '@/hooks/useChat';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatInfo } from '@/components/chat/ChatInfo';

export function Chat() {
  const {
    chatRooms,
    messages,
    activeChatRoom,
    setActiveChatRoom,
    sendMessage,
    createMessageRequest,
    loading,
  } = useChat();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background dark">
      <ChatSidebar
        chatRooms={chatRooms}
        activeChatRoom={activeChatRoom}
        onChatRoomSelect={setActiveChatRoom}
        onCreateMessageRequest={createMessageRequest}
      />
      
      <ChatInterface
        activeChatRoom={activeChatRoom}
        messages={messages}
        onSendMessage={sendMessage}
      />
      
      <ChatInfo activeChatRoom={activeChatRoom} />
    </div>
  );
}