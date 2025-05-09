
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const { companyId } = useAuth();
  
  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);
  
  const fetchCompanyData = async () => {
    if (!companyId) return;
    
    setLoading(true);
    
    try {
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      
      if (companyData) {
        setCompany(companyData);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      toast.error("Failed to load company data");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!company || !companyId) return;
    
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
      
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Company Information</h2>
        </div>
        
        <div className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="logo">Company Logo</Label>
            <div className="flex items-center">
              <div className="h-24 w-24 border-2 border-dashed border-gray-200 rounded-md flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                <Upload className="h-6 w-6 mb-1" />
                <span className="text-xs">Upload</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-700">Upload your company logo</p>
                <p className="text-xs text-gray-500 mt-1">Recommended size: 200x200px. Max size: 2MB.</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input 
                id="company-name" 
                value={company?.name || ""}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                placeholder="Your Company Name"
              />
              <p className="text-xs text-gray-500">This name will be visible to your team members</p>
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
              <Label htmlFor="company-address">Company Address</Label>
              <Input 
                id="company-address" 
                placeholder="Full company address"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-description">About the Company</Label>
            <Textarea 
              id="company-description" 
              placeholder="Briefly describe what your company does"
              rows={4}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
