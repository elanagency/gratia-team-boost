import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slack, Bell, Users, Calendar, TrendingUp } from "lucide-react";

const SlackNotificationsCard = () => {
  const notificationTypes = [
    {
      icon: Bell,
      title: "Recognition Notifications",
      description: "Get notified when team members give or receive recognition points",
      enabled: false
    },
    {
      icon: TrendingUp,
      title: "Point Allocation Alerts",
      description: "Monthly notifications when points are allocated to team members",
      enabled: false
    },
    {
      icon: Users,
      title: "Team Milestones",
      description: "Celebrate when team members reach point milestones or achievements",
      enabled: false
    },
    {
      icon: Calendar,
      title: "Weekly/Monthly Summaries",
      description: "Regular summaries of team activity and engagement metrics",
      enabled: false
    }
  ];

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-[#4A154B] flex items-center justify-center">
              <Slack className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Slack Notifications</CardTitle>
              <CardDescription>Connect your Slack workspace to receive team notifications</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
            Coming Soon
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <Slack className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Workspace Connection</p>
              <p className="text-sm text-gray-500">Not connected</p>
            </div>
          </div>
          <Button variant="outline" disabled className="opacity-50">
            Connect to Slack
          </Button>
        </div>

        <Separator />

        {/* Notification Types Preview */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Available Notification Types</h4>
          <div className="space-y-3">
            {notificationTypes.map((notification, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/50 opacity-60">
                <div className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center mt-0.5">
                  <notification.icon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{notification.title}</h5>
                  <p className="text-sm text-gray-500 mt-1">{notification.description}</p>
                </div>
                <div className="h-8 w-8 rounded border bg-white flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Selection Preview */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Default Channel</h4>
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <div className="w-full p-3 border rounded-md bg-gray-50 text-gray-500 cursor-not-allowed">
                # Select a channel...
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500 text-center">
            Connect your Slack workspace to start receiving automated notifications about team recognition and achievements.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SlackNotificationsCard;