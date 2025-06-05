
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Building, Edit, Save, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const companyFormSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  handle: z.string().min(2, "Company handle must be at least 2 characters").regex(/^[a-zA-Z0-9-_]+$/, "Handle can only contain letters, numbers, hyphens, and underscores"),
  description: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  industry: z.string().optional(),
  size: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

interface CompanyData {
  name: string;
  handle: string;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  size?: string | null;
}

export const CompanyInformationCard = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [isHandleAvailable, setIsHandleAvailable] = useState<boolean | null>(null);
  const [originalHandle, setOriginalHandle] = useState<string>("");
  const { companyId, isAdmin } = useAuth();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      handle: "",
      description: "",
      website: "",
      industry: "",
      size: "",
    },
  });

  const companyHandle = form.watch("handle");

  // Check handle availability when it changes (but skip if it's the original handle)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (companyHandle && companyHandle.length >= 2 && companyHandle !== originalHandle) {
        setIsCheckingHandle(true);
        try {
          const { data, error } = await supabase
            .from('companies')
            .select('id')
            .eq('handle', companyHandle)
            .maybeSingle();

          if (error) throw error;
          setIsHandleAvailable(data === null);
        } catch (error) {
          console.error("Error checking handle availability:", error);
          setIsHandleAvailable(null);
        } finally {
          setIsCheckingHandle(false);
        }
      } else {
        setIsHandleAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [companyHandle, originalHandle]);

  const fetchCompanyData = async () => {
    if (!companyId) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('name, handle, description, website, industry, size')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      
      if (data && data.name && data.handle) {
        const companyInfo: CompanyData = {
          name: data.name,
          handle: data.handle,
          description: data.description,
          website: data.website,
          industry: data.industry,
          size: data.size,
        };
        setCompanyData(companyInfo);
        setOriginalHandle(data.handle);
        form.reset({
          name: data.name,
          handle: data.handle,
          description: data.description || "",
          website: data.website || "",
          industry: data.industry || "",
          size: data.size || "",
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
    
    // Prevent submission if handle is being used by another company
    if (data.handle !== originalHandle && isHandleAvailable === false) {
      toast.error("Company handle is already taken. Please choose another.");
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          handle: data.handle,
          description: data.description || null,
          website: data.website || null,
          industry: data.industry || null,
          size: data.size || null,
        })
        .eq('id', companyId);
      
      if (error) throw error;
      
      const updatedCompanyData: CompanyData = {
        name: data.name,
        handle: data.handle,
        description: data.description,
        website: data.website,
        industry: data.industry,
        size: data.size,
      };
      setCompanyData(updatedCompanyData);
      setOriginalHandle(data.handle);
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
        description: companyData.description || "",
        website: companyData.website || "",
        industry: companyData.industry || "",
        size: companyData.size || "",
      });
    }
    setIsEditing(false);
    setIsHandleAvailable(null);
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
                      <div className="relative">
                        <Input {...field} placeholder="Enter company handle" />
                        {isCheckingHandle ? (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        ) : (field.value !== originalHandle && isHandleAvailable === true) ? (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-green-500">
                            <Check className="h-5 w-5" />
                          </div>
                        ) : (field.value !== originalHandle && isHandleAvailable === false) ? (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500">
                            <X className="h-5 w-5" />
                          </div>
                        ) : null}
                      </div>
                    </FormControl>
                    <p className="text-xs text-gray-400">Your team URL: grattia.com/{field.value || 'your-handle'}</p>
                    {field.value !== originalHandle && isHandleAvailable === false && (
                      <p className="text-xs text-red-500 mt-1">This handle is already taken</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Tell us about your company" />
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
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Technology, Healthcare, Finance" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 1-10, 11-50, 51-200, 200+" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving || (companyHandle !== originalHandle && isHandleAvailable === false)}
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
            
            {companyData.description && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="text-gray-900">{companyData.description}</p>
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
            
            {companyData.industry && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Industry</Label>
                <p className="text-gray-900">{companyData.industry}</p>
              </div>
            )}
            
            {companyData.size && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Company Size</Label>
                <p className="text-gray-900">{companyData.size}</p>
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
