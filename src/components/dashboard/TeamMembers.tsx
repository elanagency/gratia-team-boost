
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Link } from "react-router-dom";

export const TeamMembers = () => {
  const { teamMembers, isLoading } = useTeamMembers();

  // Show only the first 3 team members on the dashboard
  const displayMembers = teamMembers.slice(0, 3);

  return (
    <Card className="dashboard-card h-full">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Your team</h2>
        <Link to="/dashboard/team" className="text-sm text-[#F572FF] flex items-center">
          View All <ChevronRight size={16} />
        </Link>
      </div>
      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F572FF]"></div>
          </div>
        ) : displayMembers.length > 0 ? (
          displayMembers.map((member) => (
            <div key={member.id} className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#F572FF]/10 flex items-center justify-center text-[#F572FF] font-medium">
                {member.name.charAt(0)}
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-800">{member.name}</p>
                <p className="text-xs text-gray-500">Team Member</p>
              </div>
              <div className="ml-auto flex items-center">
                <span className="text-sm font-medium mr-1 text-[#F572FF]">{member.points}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">points</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            No team members found
          </div>
        )}
      </div>
    </Card>
  );
};
