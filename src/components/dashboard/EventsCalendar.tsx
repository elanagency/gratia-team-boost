
import React from "react";
import { Card } from "@/components/ui/card";
import { Calendar, ChevronRight } from "lucide-react";

export const EventsCalendar = () => {
  return (
    <Card className="dashboard-card">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Upcoming events</h2>
        <a href="#" className="text-sm text-[#F572FF] flex items-center">
          View Calendar <ChevronRight size={16} />
        </a>
      </div>
      <div className="py-4 px-6">
        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded-lg shadow-sm border border-gray-100">
            <span className="text-sm text-gray-500">Nov</span>
            <span className="text-xl font-bold text-gray-800">15</span>
          </div>
          <div className="ml-4">
            <h3 className="font-medium text-gray-800">Team Recognition Event</h3>
            <p className="text-sm text-gray-500">Monthly recognition ceremony</p>
            <div className="mt-1 flex items-center">
              <Calendar size={14} className="text-gray-400 mr-1" />
              <span className="text-xs text-gray-500">10:00 AM - 11:00 AM</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
