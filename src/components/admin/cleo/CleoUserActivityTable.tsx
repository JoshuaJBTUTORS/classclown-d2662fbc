import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Search } from 'lucide-react';
import { CleoUserSummary } from '@/types/adminCleoTracker';
import { formatDistanceToNow, format } from 'date-fns';

interface CleoUserActivityTableProps {
  users: CleoUserSummary[];
  onSearchChange: (search: string) => void;
}

export const CleoUserActivityTable = ({ users, onSearchChange }: CleoUserActivityTableProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearchChange(value);
  };

  const formatLastActive = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead className="text-center">Conversations</TableHead>
              <TableHead className="text-center">Completed</TableHead>
              <TableHead className="text-center">Voice (min)</TableHead>
              <TableHead className="text-center">Messages</TableHead>
              <TableHead>Voice Quota</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No users found with Cleo activity
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{user.totalConversations}</TableCell>
                  <TableCell className="text-center">{user.lessonsCompleted}</TableCell>
                  <TableCell className="text-center">{user.voiceMinutesUsed.toFixed(1)}</TableCell>
                  <TableCell className="text-center">{user.textMessagesSent}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {user.voiceQuotaRemaining || 0} min
                    </div>
                    <div className="text-xs text-muted-foreground">
                      of {user.voiceQuotaTotal || 0} total
                    </div>
                  </TableCell>
                  <TableCell>{formatLastActive(user.lastActive)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/cleo-tracker/${user.userId}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
