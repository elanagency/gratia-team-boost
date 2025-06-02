
import React from "react";
import { Sidebar } from "./Sidebar";

type MemoizedSidebarProps = {
  user: any;
  firstName: string;
  lastName: string;
  handleLogout: () => Promise<void>;
  isTeamView?: boolean;
}

export const MemoizedSidebar = React.memo(({ 
  user, 
  firstName, 
  lastName, 
  handleLogout, 
  isTeamView 
}: MemoizedSidebarProps) => {
  return (
    <Sidebar 
      user={user}
      firstName={firstName}
      lastName={lastName}
      handleLogout={handleLogout}
      isTeamView={isTeamView}
    />
  );
});

MemoizedSidebar.displayName = 'MemoizedSidebar';
