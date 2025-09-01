import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ChatRoom } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Hash, 
  Users, 
  Plus, 
  MessageCircle, 
  LogOut,
  Mail
} from 'lucide-react';

interface ChatSidebarProps {
  chatRooms: ChatRoom[];
  activeChatRoom: ChatRoom | null;
  onChatRoomSelect: (room: ChatRoom) => void;
  onCreateMessageRequest: (email: string, message?: string) => void;
}

export function ChatSidebar({ 
  chatRooms, 
  activeChatRoom, 
  onChatRoomSelect,
  onCreateMessageRequest 
}: ChatSidebarProps) {
  const { user, signOut } = useAuth();
  const [messageRequestEmail, setMessageRequestEmail] = useState('');
  const [messageRequestText, setMessageRequestText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleMessageRequest = () => {
    if (messageRequestEmail.trim()) {
      onCreateMessageRequest(messageRequestEmail, messageRequestText || undefined);
      setMessageRequestEmail('');
      setMessageRequestText('');
      setIsDialogOpen(false);
    }
  };

  const getChatIcon = (room: ChatRoom) => {
    switch (room.type) {
      case 'main':
        return <Hash className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      case 'direct':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-80 h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Citra Chat</h1>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.email || 'Anonymous'}
            </p>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Rooms List */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Channels
            </h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Message Request</DialogTitle>
                  <DialogDescription>
                    Send a direct message request to someone by their email address.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter their email address"
                      value={messageRequestEmail}
                      onChange={(e) => setMessageRequestEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Say something..."
                      value={messageRequestText}
                      onChange={(e) => setMessageRequestText(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleMessageRequest} className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {chatRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onChatRoomSelect(room)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors hover:bg-accent/50 ${
                  activeChatRoom?.id === room.id 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-foreground'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getChatIcon(room)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{room.name}</span>
                      {room.type === 'main' && (
                        <Badge variant="secondary" className="text-xs">
                          Main
                        </Badge>
                      )}
                    </div>
                    {room.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {room.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}