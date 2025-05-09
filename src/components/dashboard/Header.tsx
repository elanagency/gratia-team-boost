
import React from "react";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, Bell } from "lucide-react";

type HeaderProps = {
  displayName: string;
}

export const Header = ({ displayName }: HeaderProps) => {
  return (
    <header className="h-16 flex items-center px-6 bg-transparent my-[24px]">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-gray-800">
          Hello, {displayName} 👋
        </h1>
        <p className="text-lg text-gray-500">Here's what's going on today.</p>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
          <Search size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
          <HelpCircle size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
          <Bell size={20} />
        </Button>
      </div>
    </header>
  );
};
