
import React from "react";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

type TeamMember = {
  id: number;
  name: string;
  role: string;
  country: string;
};

export const TeamMembers = () => {
  // Sample team members - will fetch actual data in the future
  const teamMembers: TeamMember[] = [
    { id: 1, name: "Mike Johnson", role: "Developer", country: "United States" },
    { id: 2, name: "Sarah Chen", role: "Designer", country: "Singapore" },
    { id: 3, name: "Alex Patel", role: "Marketing", country: "India" }
  ];

  return (
    <Card className="dashboard-card h-full">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Your team</h2>
        <a href="#" className="text-sm text-[#F572FF] flex items-center">
          View All <ChevronRight size={16} />
        </a>
      </div>
      <div className="p-6 space-y-4">
        {teamMembers.map((member) => (
          <div key={member.id} className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
              {member.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-800">{member.name}</p>
              <p className="text-xs text-gray-500">{member.role}</p>
            </div>
            <div className="ml-auto">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{member.country}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
