
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
        <h1 className="text-2xl font-semibold text-white">Company Settings</h1>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-[#F572FF] hover:bg-[#E061EE]"
        >
          Save Changes
        </Button>
      </div>
      
      <Card className="border-[#333333] bg-[#222222] text-white">
        <CardHeader>
          <CardTitle className="text-xl text-white">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="logo" className="text-gray-300">Company Logo</Label>
            <div className="h-32 w-32 border-2 border-dashed border-[#444444] rounded-md flex items-center justify-center text-gray-400">
              Click to upload
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-name" className="text-gray-300">Company Name</Label>
            <Input 
              id="company-name" 
              value={company?.name || ""}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              placeholder="Your Company Name"
              className="bg-[#333333] text-white border-[#444444]"
            />
            <p className="text-sm text-gray-500">This name will be visible to your team members</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="legal-name" className="text-gray-300">Legal Company Name</Label>
            <Input 
              id="legal-name" 
              placeholder="Legal Company Name (as registered)"
              className="bg-[#333333] text-white border-[#444444]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-email" className="text-gray-300">Company Email</Label>
            <Input 
              id="company-email" 
              type="email"
              placeholder="company@example.com"
              className="bg-[#333333] text-white border-[#444444]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-address" className="text-gray-300">Company Address</Label>
            <Input 
              id="company-address" 
              placeholder="Full company address"
              className="bg-[#333333] text-white border-[#444444]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-phone" className="text-gray-300">Phone Number</Label>
            <Input 
              id="company-phone" 
              placeholder="Phone number for contact"
              className="bg-[#333333] text-white border-[#444444]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-website" className="text-gray-300">Website</Label>
            <Input 
              id="company-website" 
              placeholder="https://www.yourcompany.com"
              className="bg-[#333333] text-white border-[#444444]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-description" className="text-gray-300">About the Company</Label>
            <Textarea 
              id="company-description" 
              placeholder="Briefly describe what your company does"
              rows={4}
              className="bg-[#333333] text-white border-[#444444]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
