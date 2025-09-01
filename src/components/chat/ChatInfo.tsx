import { ChatRoom } from '@/hooks/useChat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Hash, Users, MessageCircle, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatInfoProps {
  activeChatRoom: ChatRoom | null;
}

export function ChatInfo({ activeChatRoom }: ChatInfoProps) {
  const getChatIcon = (room: ChatRoom) => {
    switch (room.type) {
      case 'main':
        return <Hash className="h-6 w-6" />;
      case 'group':
        return <Users className="h-6 w-6" />;
      case 'direct':
        return <MessageCircle className="h-6 w-6" />;
      default:
        return <Hash className="h-6 w-6" />;
    }
  };

  const getChatTypeLabel = (type: string) => {
    switch (type) {
      case 'main':
        return 'Main Channel';
      case 'group':
        return 'Group Chat';
      case 'direct':
        return 'Direct Message';
      default:
        return 'Unknown';
    }
  };

  if (!activeChatRoom) {
    return (
      <div className="w-80 bg-card border-l border-border flex items-center justify-center">
        <div className="text-center p-6">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No chat selected</h3>
          <p className="text-muted-foreground text-sm">
            Select a chat to view details and participants
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-l border-border">
      <ScrollArea className="h-full">
        <div className="p-6">
          {/* Chat Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                {getChatIcon(activeChatRoom)}
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">{activeChatRoom.name}</h2>
            <Badge variant="secondary" className="mb-2">
              {getChatTypeLabel(activeChatRoom.type)}
            </Badge>
            {activeChatRoom.description && (
              <p className="text-sm text-muted-foreground">
                {activeChatRoom.description}
              </p>
            )}
          </div>

          <Separator className="mb-6" />

          {/* Chat Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activeChatRoom.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {activeChatRoom.type === 'main' && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">About this channel</h4>
                <p className="text-sm text-muted-foreground">
                  This is the main channel where all registered users can participate. 
                  It's a great place to meet new people and engage in general discussions.
                </p>
              </div>
            )}

            {activeChatRoom.type === 'group' && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Group Chat</h4>
                <p className="text-sm text-muted-foreground">
                  This is a custom group chat created by one of the members. 
                  Only invited participants can view and send messages here.
                </p>
              </div>
            )}

            {activeChatRoom.type === 'direct' && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Direct Message</h4>
                <p className="text-sm text-muted-foreground">
                  This is a private conversation between you and another user. 
                  Only participants can see the messages exchanged here.
                </p>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Participants Section */}
          <div>
            <h4 className="font-medium mb-4 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Participants
            </h4>
            <div className="space-y-3">
              {/* This would be populated with actual participants in a real implementation */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">You</p>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}