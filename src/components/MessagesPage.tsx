import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, Search, ArrowLeft } from 'lucide-react';

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ConversationWithProfile {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  created_at: string;
  other_user: Profile;
  last_message?: {
    content: string | null;
    message_type: string;
    sender_id: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  shared_post_id: string | null;
  message_type: 'text' | 'shared_post';
  is_read: boolean;
  created_at: string;
}

export const MessagesPage = () => {
  const { user } = useAuth();
  const { conversations, loading, sendMessage, getUsersForSharing } = useDirectMessages();
  const { toast } = useToast();
  
  const [enrichedConversations, setEnrichedConversations] = useState<ConversationWithProfile[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Fetch and enrich conversations with user profiles
  useEffect(() => {
    const enrichConversations = async () => {
      if (!user || conversations.length === 0) {
        setEnrichedConversations([]);
        return;
      }

      try {
        const enriched = await Promise.all(
          conversations.map(async (conv) => {
            const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
            
            // Get other user's profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id, username, display_name, avatar_url')
              .eq('user_id', otherUserId)
              .single();

            // Get last message
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('content, message_type, sender_id')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              ...conv,
              other_user: profile || {
                user_id: otherUserId,
                username: 'Unknown',
                display_name: 'Unknown User',
                avatar_url: null
              },
              last_message: lastMessage
            };
          })
        );

        setEnrichedConversations(enriched);
      } catch (error) {
        console.error('Error enriching conversations:', error);
      }
    };

    enrichConversations();
  }, [conversations, user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) {
        setMessages([]);
        return;
      }

      try {
        setMessagesLoading(true);
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConversation)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages((data as Message[]) || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        });
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  // Fetch users for new conversations
  useEffect(() => {
    const fetchUsers = async () => {
      if (showNewMessage) {
        try {
          const allUsers = await getUsersForSharing();
          setUsers(allUsers);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }
    };

    fetchUsers();
  }, [showNewMessage, getUsersForSharing]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      await sendMessage(selectedConversation, newMessage.trim());
      setNewMessage('');
      
      // Refresh messages
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data as Message[]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const startNewConversation = async (recipientId: string) => {
    try {
      const { data: conversationId, error } = await supabase.rpc(
        'get_or_create_conversation',
        { user_1: user?.id, user_2: recipientId }
      );

      if (error) throw error;
      
      setSelectedConversation(conversationId);
      setShowNewMessage(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversationData = enrichedConversations.find(conv => conv.id === selectedConversation);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedConversation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <h1 className="text-2xl font-bold text-foreground">
            {selectedConversation && selectedConversationData
              ? selectedConversationData.other_user.display_name || selectedConversationData.other_user.username
              : 'Messages'
            }
          </h1>
        </div>
        {!selectedConversation && (
          <Button onClick={() => setShowNewMessage(true)} size="sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            New Message
          </Button>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              New Message
              <Button variant="ghost" size="sm" onClick={() => setShowNewMessage(false)}>
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => startNewConversation(user.user_id)}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>{user.display_name?.[0] || user.username[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{user.display_name || user.username}</div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No users found
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversations List */}
      {!selectedConversation && !showNewMessage && (
        <div className="space-y-3">
          {enrichedConversations.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">No conversations yet</p>
                  <Button onClick={() => setShowNewMessage(true)} variant="outline">
                    Start a conversation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            enrichedConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conversation.other_user.avatar_url || ''} />
                      <AvatarFallback>
                        {conversation.other_user.display_name?.[0] || conversation.other_user.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">
                          {conversation.other_user.display_name || conversation.other_user.username}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message?.message_type === 'shared_post'
                          ? 'Shared a post'
                          : conversation.last_message?.content || 'No messages yet'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Message View */}
      {selectedConversation && selectedConversationData && (
        <div className="space-y-4">
          {/* Messages */}
          <Card className="min-h-[400px] flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-8 bg-muted rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.message_type === 'shared_post' ? (
                          <div className="text-sm">
                            <Badge variant="secondary">Shared Post</Badge>
                          </div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[40px] max-h-24 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};