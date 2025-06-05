
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Database, Users, Settings2 } from "lucide-react";

const PlatformSettings = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600">Configure platform-wide settings</p>
        </div>
      </div>

      {/* Platform Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Platform Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="point-rate">Point Exchange Rate (USD per point)</Label>
              <Input id="point-rate" placeholder="0.01" />
            </div>
            <div>
              <Label htmlFor="min-purchase">Minimum Point Purchase</Label>
              <Input id="min-purchase" placeholder="100" />
            </div>
            <div>
              <Label htmlFor="max-purchase">Maximum Point Purchase</Label>
              <Input id="max-purchase" placeholder="10000" />
            </div>
            <div>
              <Label htmlFor="default-slots">Default Team Slots</Label>
              <Input id="default-slots" placeholder="5" />
            </div>
          </div>
          <Button className="bg-[#F572FF] hover:bg-[#E061EE]">
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Admin Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Platform Admin Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-admin">Add New Platform Admin</Label>
            <div className="flex space-x-2">
              <Input id="new-admin" placeholder="admin@email.com" className="flex-1" />
              <Button>Add Admin</Button>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Current Platform Admins</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">admin@grattia.com</span>
                <Button variant="outline" size="sm">Remove</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium">Database Health</h4>
              <p className="text-sm text-gray-600">Excellent</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium">Active Users</h4>
              <p className="text-sm text-gray-600">1,245</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium">Security Status</h4>
              <p className="text-sm text-gray-600">Secure</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformSettings;
