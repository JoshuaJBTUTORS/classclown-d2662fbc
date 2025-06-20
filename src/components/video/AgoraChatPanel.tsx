
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, Users } from 'lucide-react';
import AgoraRTM from 'agora-rtm-sdk';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: 'message' | 'system';
}

interface AgoraChatPanelProps {
  rtmToken: string;
  channelName: string;
  userId: string;
  userName: string;
  userRole: 'tutor' | 'student';
}

const AgoraChatPanel: React.FC<AgoraChatPanelProps> = ({
  rtmToken,
  channelName,
  userId,
  userName,
  userRole
}) => {
  const [rtmClient, setRtmClient] = useState<any>(null);
  const [rtmChannel, setRtmChannel] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initRTM = async () => {
      try {
        const client = AgoraRTM.createInstance('your-app-id'); // This should come from environment
        
        await client.login({ uid: userId, token: rtmToken });
        const channel = client.createChannel(channelName);
        
        // Set up event listeners
        channel.on('ChannelMessage', (message: any, memberId: string) => {
          const newMsg: Message = {
            id: Date.now().toString(),
            text: message.text,
            senderId: memberId,
            senderName: memberId === userId ? userName : `User ${memberId}`,
            timestamp: new Date(),
            type: 'message'
          };
          setMessages(prev => [...prev, newMsg]);
        });

        channel.on('MemberJoined', (memberId: string) => {
          const systemMsg: Message = {
            id: Date.now().toString(),
            text: `${memberId} joined the session`,
            senderId: 'system',
            senderName: 'System',
            timestamp: new Date(),
            type: 'system'
          };
          setMessages(prev => [...prev, systemMsg]);
          setOnlineUsers(prev => [...prev, memberId]);
        });

        channel.on('MemberLeft', (memberId: string) => {
          const systemMsg: Message = {
            id: Date.now().toString(),
            text: `${memberId} left the session`,
            senderId: 'system',
            senderName: 'System',
            timestamp: new Date(),
            type: 'system'
          };
          setMessages(prev => [...prev, systemMsg]);
          setOnlineUsers(prev => prev.filter(id => id !== memberId));
        });

        await channel.join();
        
        setRtmClient(client);
        setRtmChannel(channel);
        setIsConnected(true);

        // Add welcome message
        const welcomeMsg: Message = {
          id: Date.now().toString(),
          text: `Welcome to the lesson chat!`,
          senderId: 'system',
          senderName: 'System',
          timestamp: new Date(),
          type: 'system'
        };
        setMessages([welcomeMsg]);

      } catch (error) {
        console.error('RTM initialization failed:', error);
      }
    };

    initRTM();

    return () => {
      if (rtmChannel) {
        rtmChannel.leave();
      }
      if (rtmClient) {
        rtmClient.logout();
      }
    };
  }, [rtmToken, channelName, userId, userName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !rtmChannel || !isConnected) return;

    try {
      await rtmChannel.sendMessage({ text: newMessage });
      
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        senderId: userId,
        senderName: userName,
        timestamp: new Date(),
        type: 'message'
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <MessageCircle className="h-4 w-4" />
          <span>Chat</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Users className="h-3 w-3" />
          <span>{onlineUsers.length + 1} participants online</span>
          {!isConnected && <span className="text-red-500">(Connecting...)</span>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="space-y-1">
            {message.type === 'system' ? (
              <div className="text-center text-xs text-gray-500 italic">
                {message.text}
              </div>
            ) : (
              <div className={`${message.senderId === userId ? 'ml-8' : 'mr-8'}`}>
                <div className="text-xs text-gray-500 mb-1">
                  {message.senderName} ({message.senderId === userId ? 'You' : userRole})
                </div>
                <Card className={`p-2 ${
                  message.senderId === userId 
                    ? 'bg-primary text-white ml-auto' 
                    : 'bg-gray-100'
                }`}>
                  <p className="text-sm">{message.text}</p>
                </Card>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={!isConnected}
          />
          <Button 
            onClick={sendMessage} 
            size="sm"
            disabled={!newMessage.trim() || !isConnected}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgoraChatPanel;
