import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Clock, MessageSquare, CheckCircle, Eye } from 'lucide-react';
import PageTitle from '@/components/ui/PageTitle';
import { useCleoUserDetail, useConversationDetail } from '@/hooks/useAdminCleoTracker';
import { ConversationDetailDialog } from '@/components/admin/cleo/ConversationDetailDialog';
import { format, formatDistanceToNow } from 'date-fns';

const CleoUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  
  const { data: userDetail, isLoading } = useCleoUserDetail(userId);
  const { data: conversationDetail } = useConversationDetail(selectedConversationId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!userDetail) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-8 text-muted-foreground">User not found</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'active':
        return <Badge variant="secondary">Active</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/cleo-tracker')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tracker
        </Button>
        <PageTitle title={`${userDetail.firstName} ${userDetail.lastName}`} />
        <p className="text-muted-foreground mt-2">{userDetail.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{userDetail.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              {userDetail.lessonsCompleted} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voice Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{userDetail.voiceMinutesUsed.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">minutes used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{userDetail.textMessagesSent}</div>
            <p className="text-xs text-muted-foreground">text messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voice Quota</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{userDetail.voiceQuotaRemaining}</div>
            <p className="text-xs text-muted-foreground">
              of {userDetail.voiceQuotaTotal} minutes remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {userDetail.topicsStudied.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Topics Studied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userDetail.topicsStudied.map((topic, idx) => (
                <Badge key={idx} variant="secondary">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-center">Duration</TableHead>
                  <TableHead className="text-center">Messages</TableHead>
                  <TableHead className="text-center">Mode</TableHead>
                  <TableHead className="text-center">Completion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDetail.conversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No conversations yet
                    </TableCell>
                  </TableRow>
                ) : (
                  userDetail.conversations.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium">{conv.topic}</TableCell>
                      <TableCell>{getStatusBadge(conv.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(conv.createdAt), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{conv.durationMinutes.toFixed(1)} min</TableCell>
                      <TableCell className="text-center">{conv.messageCount}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {conv.mode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {conv.completionPercentage || 0}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedConversationId(conv.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConversationDetailDialog
        conversation={conversationDetail}
        open={!!selectedConversationId}
        onOpenChange={(open) => !open && setSelectedConversationId(undefined)}
      />
    </div>
  );
};

export default CleoUserDetail;
