-- Create enum for chat room types
CREATE TYPE chat_room_type AS ENUM ('main', 'group', 'direct');

-- Create enum for message request status
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create chat_rooms table
CREATE TABLE public.chat_rooms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type chat_room_type NOT NULL DEFAULT 'group',
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Create chat_participants table (many-to-many relationship)
CREATE TABLE public.chat_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_admin BOOLEAN DEFAULT false,
    UNIQUE(chat_room_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_edited BOOLEAN DEFAULT false
);

-- Create message_requests table for private messaging
CREATE TABLE public.message_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    to_user_email TEXT NOT NULL,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status request_status DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_rooms
CREATE POLICY "Users can view rooms they participate in" 
ON public.chat_rooms FOR SELECT 
USING (
    id IN (
        SELECT chat_room_id FROM public.chat_participants 
        WHERE user_id = auth.uid()
    ) OR type = 'main'
);

CREATE POLICY "Users can create rooms" 
ON public.chat_rooms FOR INSERT 
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Room creators can update rooms" 
ON public.chat_rooms FOR UPDATE 
USING (auth.uid() = created_by OR created_by IS NULL);

-- Create RLS policies for chat_participants
CREATE POLICY "Users can view participants of their rooms" 
ON public.chat_participants FOR SELECT 
USING (
    chat_room_id IN (
        SELECT chat_room_id FROM public.chat_participants 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can join rooms" 
ON public.chat_participants FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in their rooms" 
ON public.messages FOR SELECT 
USING (
    chat_room_id IN (
        SELECT chat_room_id FROM public.chat_participants 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can send messages to their rooms" 
ON public.messages FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id AND
    chat_room_id IN (
        SELECT chat_room_id FROM public.chat_participants 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own messages" 
ON public.messages FOR UPDATE 
USING (auth.uid() = sender_id);

-- Create RLS policies for message_requests
CREATE POLICY "Users can view their own requests" 
ON public.message_requests FOR SELECT 
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create message requests" 
ON public.message_requests FOR INSERT 
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update requests sent to them" 
ON public.message_requests FOR UPDATE 
USING (auth.uid() = to_user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_chat_rooms_updated_at
    BEFORE UPDATE ON public.chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_requests_updated_at
    BEFORE UPDATE ON public.message_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the main group chat that all users can access (without created_by)
INSERT INTO public.chat_rooms (name, description, type, created_by) 
VALUES ('General Chat', 'Main group chat for all users', 'main', NULL);

-- Enable realtime for all tables
ALTER TABLE public.chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.message_requests REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE public.chat_rooms;
ALTER publication supabase_realtime ADD TABLE public.chat_participants;
ALTER publication supabase_realtime ADD TABLE public.messages;
ALTER publication supabase_realtime ADD TABLE public.message_requests;