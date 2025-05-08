
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);
  
  useEffect(() => {
    fetchCompanyData();
  }, []);
  
  const fetchCompanyData = async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      // Get company through company_members
      const { data: companyMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (companyMember) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyMember.company_id)
          .single();
        
        if (companyData) {
          setCompany(companyData);
        }
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      toast.error("Failed to load company data");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: company.name,
          // Add other fields here as needed
        })
        .eq('id', company.id);
      
      if (error) {
        throw error;
      }
      
      toast.success("Company settings updated");
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Company Settings</h1>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-[#F572FF] hover:bg-[#E061EE]"
        >
          Save Changes
        </Button>
      </div>
      
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="logo">Company Logo</Label>
            <div className="h-32 w-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
              Click to upload
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input 
              id="company-name" 
              value={company?.name || ""}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              placeholder="Your Company Name"
            />
            <p className="text-sm text-gray-500">This name will be visible to your team members</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="legal-name">Legal Company Name</Label>
            <Input 
              id="legal-name" 
              placeholder="Legal Company Name (as registered)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-email">Company Email</Label>
            <Input 
              id="company-email" 
              type="email"
              placeholder="company@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-address">Company Address</Label>
            <Input 
              id="company-address" 
              placeholder="Full company address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-phone">Phone Number</Label>
            <Input 
              id="company-phone" 
              placeholder="Phone number for contact"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-website">Website</Label>
            <Input 
              id="company-website" 
              placeholder="https://www.yourcompany.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-description">About the Company</Label>
            <Textarea 
              id="company-description" 
              placeholder="Briefly describe what your company does"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
