import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Search, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { UserSelector } from './UserSelector';
import { resetUserPassword } from '@/services/userManagementService';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export const UserPasswordReset = () => {
  const [selectedUserType, setSelectedUserType] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const copyToClipboard = async () => {
    if (newPassword) {
      await navigator.clipboard.writeText(newPassword);
      toast({
        title: "Copied",
        description: "Password copied to clipboard"
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedUser || !newPassword) {
      toast({
        title: "Error",
        description: "Please select a user and enter a new password",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsResetting(true);
    try {
      await resetUserPassword(selectedUser.id, newPassword);
      toast({
        title: "Success",
        description: `Password reset successfully for ${selectedUser.first_name} ${selectedUser.last_name} (${selectedUser.email})`
      });
      setIsDialogOpen(false);
      setNewPassword('');
      setSelectedUser(null);
      setSelectedUserType('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setSelectedUserType('');
    setNewPassword('');
    setShowPassword(false);
  };

  const getUserDisplayName = (user: User) => {
    const name = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : user.email;
    return `${name} (${user.email}) - ${user.role}`;
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          User Password Management
        </CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="userType">User Type</Label>
            <Select value={selectedUserType} onValueChange={setSelectedUserType}>
              <SelectTrigger>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutors">Tutors</SelectItem>
                <SelectItem value="parents">Parents</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="admins">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select User</Label>
            <UserSelector
              userType={selectedUserType}
              selectedUser={selectedUser}
              onUserSelect={setSelectedUser}
            />
          </div>
        </div>

        {selectedUser && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">Selected User:</div>
            <div className="text-sm text-muted-foreground">
              {getUserDisplayName(selectedUser)}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                disabled={!selectedUser}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Reset Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset User Password</DialogTitle>
                <DialogDescription>
                  You are about to reset the password for:
                  <br />
                  <strong>{selectedUser ? getUserDisplayName(selectedUser) : ''}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRandomPassword}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Generate
                    </Button>
                    {newPassword && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={copyToClipboard}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setNewPassword('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordReset}
                  disabled={!newPassword || isResetting}
                  className="flex items-center gap-2"
                >
                  {isResetting && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={resetForm}
            className="flex items-center gap-2"
          >
            Clear Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};