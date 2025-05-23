
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, Send, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { messageService } from '@/services/messageService';

interface Recipient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
}

const NewMessage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, userRole, isAdmin, isOwner } = useAuth();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  
  // Fetch potential recipients based on role restrictions
  const { data: allUsers, isLoading } = useQuery({
    queryKey: ['message-recipients'],
    queryFn: async () => {
      // Check if profile exists and has organization data
      if (!profile) return [];
      
      let query = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          user_roles:user_roles(role)
        `)
        .eq('organization_id', profile.organization_id || '')
        .neq('id', profile.id); // Exclude current user
      
      // Apply role-based filtering
      if (isAdmin || isOwner) {
        // Admins and owners can only message tutors
        query = query.eq('user_roles.role', 'tutor');
      } else if (userRole === 'tutor') {
        // Tutors can only message admins and owners
        query = query.in('user_roles.role', ['admin', 'owner']);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to include role information
      return data.map((user: any) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        role: user.user_roles?.[0]?.role || 'unknown'
      }));
    },
    enabled: !!profile && (isAdmin || isOwner || userRole === 'tutor')
  });
  
  // Filter recipients based on search term
  useEffect(() => {
    if (!allUsers) return;
    
    if (!searchTerm.trim()) {
      setRecipients(allUsers);
      return;
    }
    
    const filtered = allUsers.filter(user => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    });
    
    setRecipients(filtered);
  }, [searchTerm, allUsers]);
  
  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      if (selectedRecipients.length === 0) {
        throw new Error("Please select at least one recipient");
      }
      
      if (!message.trim()) {
        throw new Error("Message cannot be empty");
      }
      
      // For a single recipient, use direct conversation
      if (selectedRecipients.length === 1) {
        const recipientId = selectedRecipients[0].id;
        const conversationId = await supabase.rpc('get_or_create_direct_conversation', {
          p_other_user_id: recipientId,
          p_first_message: message.trim()
        });
        
        return conversationId;
      }
      
      // For multiple recipients, create a group chat
      const userIds = selectedRecipients.map(r => r.id);
      const title = selectedRecipients.map(r => `${r.first_name || ''} ${r.last_name || ''}`).join(', ');
      
      const conversationId = await supabase.rpc('create_conversation', {
        p_title: title.substring(0, 50), // Limit title length
        p_user_ids: userIds,
        p_is_group: true,
        p_first_message: message.trim()
      });
      
      return conversationId;
    },
    onSuccess: (conversationId) => {
      toast({
        title: "Message sent",
        description: "Your conversation has been created",
      });
      navigate(`/messages/${conversationId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating conversation",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSelectRecipient = (recipient: Recipient) => {
    if (selectedRecipients.find(r => r.id === recipient.id)) {
      setSelectedRecipients(selectedRecipients.filter(r => r.id !== recipient.id));
    } else {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createConversationMutation.mutate();
  };
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'tutor':
        return 'Tutor';
      case 'owner':
        return 'Owner';
      default:
        return 'User';
    }
  };

  // Redirect if user is a student (not allowed to message)
  useEffect(() => {
    if (userRole === 'student' || userRole === 'parent') {
      toast({
        title: "Access denied",
        description: "Messaging is only available for tutors and administrators.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [userRole, navigate, toast]);

  if (userRole === 'student' || userRole === 'parent') {
    return null; // Don't render anything if student somehow reaches this page
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/messages')} 
          className="mr-2"
        >
          <ChevronLeft className="mr-1" />
          Back to Messages
        </Button>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>New Message</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipients">
                {isAdmin || isOwner 
                  ? "Select Tutors" 
                  : userRole === 'tutor' 
                    ? "Select Administrators"
                    : "Recipients"}
              </Label>
              <div className="flex items-center gap-2 border rounded-md p-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isAdmin || isOwner ? "Search tutors..." : "Search administrators..."}
                  className="border-none shadow-none focus-visible:ring-0"
                />
              </div>
              
              {/* Selected recipients */}
              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedRecipients.map(recipient => (
                    <div 
                      key={recipient.id} 
                      className="flex items-center gap-1 bg-primary text-primary-foreground py-1 px-2 rounded-full text-sm"
                    >
                      <span>{recipient.first_name} {recipient.last_name}</span>
                      <button 
                        type="button" 
                        className="hover:bg-primary-focus rounded-full"
                        onClick={() => handleSelectRecipient(recipient)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* User list */}
              <div className="border rounded-md overflow-hidden mt-2">
                <div className="max-h-60 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading users...</div>
                  ) : recipients.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm ? 'No users found' : 'No users available'}
                    </div>
                  ) : (
                    recipients.map(recipient => (
                      <div 
                        key={recipient.id}
                        className={`flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer ${
                          selectedRecipients.some(r => r.id === recipient.id) 
                            ? 'bg-gray-100' 
                            : ''
                        }`}
                        onClick={() => handleSelectRecipient(recipient)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={recipient.avatar_url || undefined} />
                          <AvatarFallback>
                            {`${recipient.first_name?.charAt(0) || ''}${recipient.last_name?.charAt(0) || ''}`.toUpperCase() || <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="font-medium">{recipient.first_name} {recipient.last_name}</div>
                          <div className="text-xs text-gray-500">
                            {getRoleLabel(recipient.role)}
                          </div>
                        </div>
                        
                        <div className="h-4 w-4 border border-gray-300 rounded-sm flex items-center justify-center">
                          {selectedRecipients.some(r => r.id === recipient.id) && (
                            <div className="h-2 w-2 bg-primary rounded-sm" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="min-h-[200px]"
                disabled={createConversationMutation.isPending}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end">
            <Button 
              type="submit" 
              disabled={
                createConversationMutation.isPending || 
                selectedRecipients.length === 0 || 
                !message.trim()
              }
            >
              {createConversationMutation.isPending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default NewMessage;
