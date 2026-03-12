
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Trash2 } from "lucide-react";


const ProfileSettings = () => {
  const { user, firstName, lastName, isLoading, isAdmin, avatarUrl } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    firstName: firstName,
    lastName: lastName,
    birthday: '',
    companyStartDate: ''
  });

  // Fetch profile date fields
  React.useEffect(() => {
    const fetchDates = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('birthday, company_start_date')
        .eq('id', user.id)
        .single();
      if (data) {
        setForm(prev => ({
          ...prev,
          birthday: data.birthday || '',
          companyStartDate: data.company_start_date || ''
        }));
      }
    };
    fetchDates();
  }, [user?.id]);

  // Update form when auth context data changes
  React.useEffect(() => {
    setForm(prev => ({
      ...prev,
      firstName: firstName,
      lastName: lastName
    }));
  }, [firstName, lastName]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${user.id}/avatar.${ext}`;

    try {
      setAvatarLoading(true);

      // Delete old files
      const { data: existingFiles } = await supabase.storage.from('avatars').list(user.id);
      if (existingFiles?.length) {
        await supabase.storage.from('avatars').remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success("Profile photo updated!");
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error("Failed to upload photo");
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id) return;
    try {
      setAvatarLoading(true);

      const { data: existingFiles } = await supabase.storage.from('avatars').list(user.id);
      if (existingFiles?.length) {
        await supabase.storage.from('avatars').remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success("Profile photo removed");
    } catch (error) {
      console.error('Remove avatar error:', error);
      toast.error("Failed to remove photo");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("User ID not found");
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: form.firstName,
          last_name: form.lastName,
          birthday: form.birthday || null,
          company_start_date: form.companyStartDate || null,
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

  const initials = firstName ? firstName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || "U");

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      
      {/* Avatar Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            Upload a photo to personalize your profile across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
                <AvatarFallback className="text-2xl bg-[#F572FF]/10 text-[#F572FF]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {avatarLoading ? 'Uploading...' : 'Upload Photo'}
                </Button>
                {avatarUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={avatarLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 5MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and how we can reach you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={form.birthday}
                  onChange={(e) => setForm({...form, birthday: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-start-date">Company Start Date</Label>
                <Input
                  id="company-start-date"
                  type="date"
                  value={form.companyStartDate}
                  onChange={(e) => setForm({...form, companyStartDate: e.target.value})}
                />
              </div>
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
