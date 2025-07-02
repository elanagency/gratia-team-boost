
import React from "react";

type HeaderProps = {
  displayName: string;
  isTeamView?: boolean;
}

export const Header = ({ displayName, isTeamView }: HeaderProps) => {
  return (
    <header className="h-16 flex items-center px-6 bg-transparent my-[24px]">
      <div className="flex-1">
        <h1 className="text-lg font-medium text-gray-800">
          Hello, {displayName || 'User'} 👋
        </h1>
      </div>
    </header>
  );
};
