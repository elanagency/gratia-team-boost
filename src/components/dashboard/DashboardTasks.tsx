
import React from "react";
import { Card } from "@/components/ui/card";
import { Award, Gift, FileCheck, CreditCard } from "lucide-react";

type TaskItem = {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  date: string;
};

export const DashboardTasks = () => {
  // Sample tasks for the dashboard
  const tasks: TaskItem[] = [
    { 
      id: 1,
      title: "Review recognition requests",
      description: "3 requests need your attention",
      icon: Award,
      iconBg: "#ffedd5",
      iconColor: "#f59e0b",
      date: "Today"
    },
    { 
      id: 2,
      title: "Process reward claims",
      description: "You have 2 pending reward claims to review",
      icon: Gift,
      iconBg: "#e0e7ff",
      iconColor: "#6366f1",
      date: "Today"
    },
    { 
      id: 3,
      title: "Upload team photos",
      description: "Add photos from the recent team event",
      icon: FileCheck,
      iconBg: "#dcfce7",
      iconColor: "#10b981",
      date: "Today"
    },
    { 
      id: 4,
      title: "Set up payment method",
      description: "Complete your billing information",
      icon: CreditCard,
      iconBg: "#fae8ff",
      iconColor: "#F572FF",
      date: "Yesterday"
    }
  ];

  return (
    <Card className="dashboard-card h-full">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Things to do</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 flex items-center gap-4">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: task.iconBg }}
            >
              <task.icon style={{ color: task.iconColor }} size={18} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">{task.title}</h4>
              <p className="text-sm text-gray-500">{task.description}</p>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-400">{task.date}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
