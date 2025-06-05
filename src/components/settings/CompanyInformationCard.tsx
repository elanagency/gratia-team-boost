
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Building, Edit, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const companyFormSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  address: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  logo_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

interface CompanyData {
  name: string;
  address?: string | null;
  website?: string | null;
  logo_url?: string | null;
}

export const CompanyInformationCard = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const { companyId, isAdmin } = useAuth();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      address: "",
      website: "",
      logo_url: "",
    },
  });

  const fetchCompanyData = async () => {
    if (!companyId) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('name, address, website, logo_url')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      
      if (data && data.name) {
        const companyInfo: CompanyData = {
          name: data.name,
          address: data.address,
          website: data.website,
          logo_url: data.logo_url,
        };
        setCompanyData(companyInfo);
        form.reset({
          name: data.name,
          address: data.address || "",
          website: data.website || "",
          logo_url: data.logo_url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      toast.error("Failed to load company information");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const onSubmit = async (data: CompanyFormData) => {
    if (!companyId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          address: data.address || null,
          website: data.website || null,
          logo_url: data.logo_url || null,
        })
        .eq('id', companyId);
      
      if (error) throw error;
      
      const updatedCompanyData: CompanyData = {
        name: data.name,
        address: data.address,
        website: data.website,
        logo_url: data.logo_url,
      };
      setCompanyData(updatedCompanyData);
      setIsEditing(false);
      toast.success("Company information updated successfully");
    } catch (error) {
      console.error("Error updating company data:", error);
      toast.error("Failed to update company information");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (companyData) {
      form.reset({
        name: companyData.name,
        address: companyData.address || "",
        website: companyData.website || "",
        logo_url: companyData.logo_url || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Company Information</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse">Loading company information...</div>
        </div>
      </Card>
    );
  }

  if (!companyData) {
    return (
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Company Information</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-500">No company information found.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="dashboard-card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-[#F572FF]" />
          <h2 className="card-title">Company Information</h2>
        </div>
        {isAdmin && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>
      
      <div className="p-6">
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter company name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter company address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Website</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://www.example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Logo URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://www.example.com/logo.png" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#F572FF] hover:bg-[#F572FF]/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Company Name</Label>
              <p className="text-lg font-medium text-gray-900">{companyData.name}</p>
            </div>
            
            {companyData.address && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Address</Label>
                <p className="text-gray-900">{companyData.address}</p>
              </div>
            )}
            
            {companyData.website && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Website</Label>
                <p className="text-gray-900">
                  <a href={companyData.website} target="_blank" rel="noopener noreferrer" className="text-[#F572FF] hover:underline">
                    {companyData.website}
                  </a>
                </p>
              </div>
            )}
            
            {companyData.logo_url && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Company Logo</Label>
                <div className="mt-2">
                  <img 
                    src={companyData.logo_url} 
                    alt="Company Logo" 
                    className="h-16 w-auto object-contain rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            {!isAdmin && (
              <p className="text-sm text-gray-500 italic">
                Only administrators can edit company information.
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
