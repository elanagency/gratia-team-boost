export type UserStatusType = 'invited' | 'active' | 'deactivated';

export interface UserStatusInfo {
  type: UserStatusType;
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  icon?: string;
}

export function getUserStatus(status: UserStatusType): UserStatusInfo {
  switch (status) {
    case 'invited':
      return {
        type: 'invited',
        label: 'Invited',
        variant: 'secondary',
        className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50',
        icon: 'mail'
      };
    case 'active':
      return {
        type: 'active',
        label: 'Active',
        variant: 'default',
        className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
        icon: 'check'
      };
    case 'deactivated':
      return {
        type: 'deactivated',
        label: 'Deactivated',
        variant: 'destructive',
        className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50',
        icon: 'x'
      };
    default:
      return {
        type: 'invited',
        label: 'Invited',
        variant: 'secondary',
        className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50',
        icon: 'mail'
      };
  }
}