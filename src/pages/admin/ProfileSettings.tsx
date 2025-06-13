
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const ProfileSettings = () => {
  const { user, firstName, lastName, isLoading, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: firstName,
    lastName: lastName,
    shippingName: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: ''
  });

  // Fetch shipping info on component mount
  React.useEffect(() => {
    const fetchShippingInfo = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip_code, shipping_country')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching shipping info:', error);
        return;
      }
      
      if (data) {
        setForm(prev => ({
          ...prev,
          shippingName: data.shipping_name || '',
          shippingAddress: data.shipping_address || '',
          shippingCity: data.shipping_city || '',
          shippingState: data.shipping_state || '',
          shippingZipCode: data.shipping_zip_code || '',
          shippingCountry: data.shipping_country || ''
        }));
      }
    };
    
    fetchShippingInfo();
  }, [user?.id]);

  // Update form when auth context data changes
  React.useEffect(() => {
    setForm(prev => ({
      ...prev,
      firstName: firstName,
      lastName: lastName
    }));
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
          shipping_name: form.shippingName,
          shipping_address: form.shippingAddress,
          shipping_city: form.shippingCity,
          shipping_state: form.shippingState,
          shipping_zip_code: form.shippingZipCode,
          shipping_country: form.shippingCountry,
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
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      
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
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Shipping Information Section - Only show for team members */}
            {!isAdmin && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Save your shipping information to make reward redemption faster
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shipping-name">Full Name</Label>
                    <Input
                      id="shipping-name"
                      value={form.shippingName}
                      onChange={(e) => setForm({...form, shippingName: e.target.value})}
                      placeholder="Full name for shipping"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shipping-address">Address</Label>
                    <Input
                      id="shipping-address"
                      value={form.shippingAddress}
                      onChange={(e) => setForm({...form, shippingAddress: e.target.value})}
                      placeholder="Street address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shipping-city">City</Label>
                      <Input
                        id="shipping-city"
                        value={form.shippingCity}
                        onChange={(e) => setForm({...form, shippingCity: e.target.value})}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping-state">State</Label>
                      <Input
                        id="shipping-state"
                        value={form.shippingState}
                        onChange={(e) => setForm({...form, shippingState: e.target.value})}
                        placeholder="State"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shipping-zip">Zip Code</Label>
                      <Input
                        id="shipping-zip"
                        value={form.shippingZipCode}
                        onChange={(e) => setForm({...form, shippingZipCode: e.target.value})}
                        placeholder="Zip code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping-country">Country</Label>
                      <Input
                        id="shipping-country"
                        value={form.shippingCountry}
                        onChange={(e) => setForm({...form, shippingCountry: e.target.value})}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
