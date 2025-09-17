export type UserStatusType = 'invited' | 'active' | 'deactivated';

export interface UserStatusInfo {
  type: UserStatusType;
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  icon?: string;
}

export function getUserStatus(invitationStatus: 'invited' | 'active', isActive: boolean = true): UserStatusInfo {
  // Determine status based on invitation_status and is_active
  if (invitationStatus === 'invited' && !isActive) {
    return {
      type: 'invited',
      label: 'Invited',
      variant: 'secondary',
      className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50',
      icon: 'mail'
    };
  }
  
  if (invitationStatus === 'active' && isActive) {
    return {
      type: 'active',
      label: 'Active',
      variant: 'default',
      className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
      icon: 'check'
    };
  }
  
  if (invitationStatus === 'active' && !isActive) {
    return {
      type: 'deactivated',
      label: 'Deactivated',
      variant: 'destructive',
      className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
      icon: 'x'
    };
  }
  
  // Fallback to invited status
  return {
    type: 'invited',
    label: 'Invited',
    variant: 'secondary',
    className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50',
    icon: 'mail'
  };
}