
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
}

const ComingSoon = ({ title }: ComingSoonProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      
      <Card className="border-gray-800 bg-gray-900 text-white">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-semibold text-[#F572FF]">Coming Soon</h2>
          <p className="text-gray-400 mt-2">This feature is currently under development</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;
