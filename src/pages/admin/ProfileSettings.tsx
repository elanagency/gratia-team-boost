
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const ProfileSettings = () => {
  const { user, firstName, lastName, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: firstName,
    lastName: lastName
  });

  // Update form when auth context data changes
  React.useEffect(() => {
    setForm({
      firstName: firstName,
      lastName: lastName
    });
  }, [firstName, lastName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("User ID not found");
      return;
    }
    
    try {
      setLoading(true);
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: form.firstName,
          last_name: form.lastName,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading profile data...</div>;
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and how we can reach you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={form.firstName}
                  onChange={(e) => setForm({...form, firstName: e.target.value})}
                  placeholder="Your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={form.lastName}
                  onChange={(e) => setForm({...form, lastName: e.target.value})}
                  placeholder="Your last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
            
            <Button type="submit" disabled={loading} className="bg-[#F572FF] hover:bg-[#E55DE9] text-white">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
