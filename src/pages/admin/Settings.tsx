
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Copy, CopyCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { CompanyPointsCard } from "@/components/settings/CompanyPointsCard";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [copied, setCopied] = useState(false);
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

  const copyPublicUrl = () => {
    if (!company?.handle) return;
    
    const url = `${window.location.origin}/c/${company.handle}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        toast.success("Public URL copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        console.error("Failed to copy URL: ", error);
        toast.error("Failed to copy URL");
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Company Settings</h1>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-[#F572FF] hover:bg-[#E061EE]"
        >
          Save Changes
        </Button>
      </div>
      
      {/* Points Balance Card */}
      {company && (
        <CompanyPointsCard 
          companyPoints={company.points_balance || 0} 
          onPointsUpdated={fetchCompanyData} 
        />
      )}
      
      {/* Public URL Card */}
      <Card className="dashboard-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium mb-1">Public Company URL</h2>
            <p className="text-sm text-gray-600">Share this URL with your team members</p>
          </div>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <Input 
              readOnly 
              value={company?.handle ? `${window.location.origin}/c/${company.handle}` : 'Loading...'}
              className="bg-gray-50 font-mono text-sm"
            />
            <Button
              onClick={copyPublicUrl}
              variant="outline"
              size="icon"
              className="flex-shrink-0"
              disabled={!company?.handle}
            >
              {copied ? <CopyCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>
      
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
