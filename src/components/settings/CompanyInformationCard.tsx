
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
  handle: z.string().min(2, "Company handle must be at least 2 characters").regex(/^[a-zA-Z0-9-_]+$/, "Handle can only contain letters, numbers, hyphens, and underscores"),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

interface CompanyData {
  name: string;
  handle: string;
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
      handle: "",
    },
  });

  const fetchCompanyData = async () => {
    if (!companyId) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('name, handle')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      
      setCompanyData(data);
      form.reset({
        name: data.name,
        handle: data.handle,
      });
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
          handle: data.handle,
        })
        .eq('id', companyId);
      
      if (error) throw error;
      
      setCompanyData(data);
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
        handle: companyData.handle,
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
                name="handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Handle</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter company handle" />
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
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Company Handle</Label>
              <p className="text-lg font-medium text-gray-900">@{companyData.handle}</p>
            </div>
            
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
