'use client';

import { Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDisplayName, NAME_MAPPING } from '@/lib/utils';

interface UserFilterProps {
  selectedUsers: string[];
  onUsersChange: (users: string[]) => void;
}

export function UserFilter({ selectedUsers, onUsersChange }: UserFilterProps) {
  const availableUsers = Object.keys(NAME_MAPPING);

  const handleUserSelect = (userId: string) => {
    if (userId === 'all') {
      onUsersChange(availableUsers);
    } else {
      onUsersChange([userId]);
    }
  };

  const getSelectedValue = () => {
    if (selectedUsers.length === 0) {
      return 'all';
    } else if (selectedUsers.length === availableUsers.length) {
      return 'all';
    } else {
      return selectedUsers[0];
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          User Filter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={getSelectedValue()} onValueChange={handleUserSelect}>
          <SelectTrigger className="w-full h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {availableUsers.map((user) => (
              <SelectItem key={user} value={user}>
                {getDisplayName(user)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
} 