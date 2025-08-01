'use client';

import { Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    <div className="space-y-3">
      <div className="flex items-center mb-3">
        <Users className="h-4 w-4 text-black mr-2" />
        <p className="text-gray-600 text-sm">Filter by user</p>
      </div>
      
      <Select value={getSelectedValue()} onValueChange={handleUserSelect}>
        <SelectTrigger className="w-full h-10 border-gray-200 hover:border-gray-300">
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
    </div>
  );
} 