
import React from "react";
import { Header } from "./Header";

type MemoizedHeaderProps = {
  displayName: string;
  isTeamView?: boolean;
}

export const MemoizedHeader = React.memo(({ displayName, isTeamView }: MemoizedHeaderProps) => {
  return <Header displayName={displayName} isTeamView={isTeamView} />;
});

MemoizedHeader.displayName = 'MemoizedHeader';
