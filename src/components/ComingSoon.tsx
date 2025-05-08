
import React from "react";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
}

const ComingSoon = ({ title }: ComingSoonProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
      
      <Card className="dashboard-card">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-16 w-16 rounded-full bg-[#F572FF]/10 flex items-center justify-center mb-4">
            <Construction className="h-8 w-8 text-[#F572FF]" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Coming Soon</h2>
          <p className="text-gray-500 mt-2 text-center max-w-md">
            This feature is currently under development. We'll notify you when it's ready!
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ComingSoon;
