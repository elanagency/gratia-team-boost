import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Trash2, Plus, Upload, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCompanyRegions } from "@/hooks/useCompanyRegions";
import { useCompanyValues } from "@/hooks/useCompanyValues";
import { RegionBadge } from "@/components/team/RegionBadge";

interface CompanyData {
  name: string;
  address?: string | null;
  website?: string | null;
  logo_url?: string | null;
}

const inputStyle = {
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  height: 38,
  borderRadius: 13.375,
  borderColor: "#E8E6F0",
  backgroundColor: "#F5F5F7",
};

export const CompanyInformationCard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CompanyData>({ name: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [newValueName, setNewValueName] = useState("");
  const [newValueColor, setNewValueColor] = useState("#7F2BFE");
  const [isAddingValue, setIsAddingValue] = useState(false);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [editingValueName, setEditingValueName] = useState("");
  const [editingValueColor, setEditingValueColor] = useState("");
  const { companyId, isAdmin } = useAuth();
  const { regionCodes, isLoading: isLoadingRegions } = useCompanyRegions(companyId);
  const { values, isLoading: isLoadingValues, addValue, updateValue, deleteValue } = useCompanyValues();

  const fetchCompanyData = async () => {
    if (!companyId) return;
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("name, address, website, logo_url")
        .eq("id", companyId)
        .single();

      if (error) throw error;
      if (data && data.name) {
        const info: CompanyData = {
          name: data.name,
          address: data.address,
          website: data.website,
          logo_url: data.logo_url,
        };
        setCompanyData(info);
        setEditData(info);
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

  const handleSave = async () => {
    if (!companyId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: editData.name,
          address: editData.address || null,
          website: editData.website || null,
          logo_url: editData.logo_url || null,
        })
        .eq("id", companyId);

      if (error) throw error;
      setCompanyData(editData);
      setIsEditing(false);
      toast.success("Company information updated successfully");
    } catch (error) {
      console.error("Error updating company data:", error);
      toast.error("Failed to update company information");
    } finally {
      setIsSaving(false);
    }
  };

  const COLOR_PRESETS = ["#7F2BFE", "#FC5BFF", "#F59E0B", "#22C55E", "#3B82F6", "#EF4444", "#8B5CF6", "#EC4899"];

  const handleAddValue = async () => {
    if (!newValueName.trim()) return;
    setIsAddingValue(false);
    await addValue(newValueName.trim(), newValueColor);
    setNewValueName("");
    setNewValueColor("#7F2BFE");
  };

  const startEditing = (value: { id: string; name: string; color: string }) => {
    setEditingValueId(value.id);
    setEditingValueName(value.name);
    setEditingValueColor(value.color);
  };

  const handleSaveEdit = async () => {
    if (!editingValueId || !editingValueName.trim()) return;
    await updateValue(editingValueId, editingValueName.trim(), editingValueColor);
    setEditingValueId(null);
  };

  const ColorSwatches = ({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) => (
    <div className="flex items-center gap-1.5">
      {COLOR_PRESETS.map((c) => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          style={{
            width: 18, height: 18, borderRadius: "50%", background: c, border: selected === c ? "2px solid #0F0533" : "2px solid transparent",
            cursor: "pointer", flexShrink: 0, transition: "border-color 0.15s",
          }}
        />
      ))}
    </div>
  );

  if (isLoading) {
    return <div className="animate-pulse" style={{ fontFamily: "Inter, sans-serif" }}>Loading company information...</div>;
  }

  if (!companyData) {
    return <p style={{ fontFamily: "Inter, sans-serif", color: "#9996AA" }}>No company information found.</p>;
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column", gap: 30, border: "1px solid #E8E6F0", borderRadius: 15, padding: 15 }}>
      {/* Company Profile Section */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F0533", marginBottom: 4 }}>Company Profile</h2>
        <p style={{ fontSize: 13, color: "#9996AA", marginBottom: 18.75 }}>Basic information about your organization</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {/* Company Name */}
          <div>
            <Label style={{ fontSize: 13, fontWeight: 500, color: "#0F0533", marginBottom: 6, display: "block" }}>
              Company Name
            </Label>
            {isEditing ? (
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                style={inputStyle}
              />
            ) : (
              <div
                style={{
                  ...inputStyle,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 15,
                  paddingRight: 15,
                  color: "#0F0533",
                }}
              >
                {companyData.name}
              </div>
            )}
          </div>

          {/* Company Logo */}
          <div>
            <Label style={{ fontSize: 13, fontWeight: 500, color: "#0F0533", marginBottom: 6, display: "block" }}>
              Company Logo
            </Label>
            <div className="flex items-center gap-3">
              {companyData.logo_url ? (
                <img
                  src={companyData.logo_url}
                  alt="Company Logo"
                  className="h-10 w-10 object-contain rounded-lg border"
                  style={{ borderColor: "#E8E6F0" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "#F5F5F7",
                    border: "1px solid #E8E6F0",
                  }}
                >
                  <Building size={18} color="#9996AA" />
                </div>
              )}
              {isEditing ? (
                <Input
                  value={editData.logo_url || ""}
                  onChange={(e) => setEditData({ ...editData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  style={{ ...inputStyle, flex: 1 }}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  style={{ borderRadius: 9.375, borderColor: "#E8E6F0", fontSize: 13, fontFamily: "Inter, sans-serif" }}
                  onClick={() => isAdmin && setIsEditing(true)}
                  disabled={!isAdmin}
                >
                  <Upload size={14} className="mr-1.5" />
                  Upload
                </Button>
              )}
            </div>
          </div>

          {/* Gift Card Regions */}
          <div>
            <Label style={{ fontSize: 13, fontWeight: 500, color: "#0F0533", marginBottom: 6, display: "block" }}>
              Gift Card Regions
            </Label>
            {isLoadingRegions ? (
              <span style={{ fontSize: 13, color: "#9996AA" }}>Loading regions...</span>
            ) : regionCodes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {regionCodes.map((code) => (
                  <RegionBadge key={code} regionCode={code} showName size="md" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 items-center">
                <RegionBadge regionCode="AU" showName size="md" />
                <span style={{ fontSize: 12, color: "#9996AA" }}>(default)</span>
              </div>
            )}
          </div>

          {/* Edit / Save buttons */}
          {isAdmin && (
            <div className="flex gap-2 pt-1">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      borderRadius: 9.375,
                      background: "linear-gradient(135deg, #7F2BFE, #FC5BFF)",
                      fontSize: 13,
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setEditData(companyData); setIsEditing(false); }}
                    disabled={isSaving}
                    style={{ borderRadius: 9.375, borderColor: "#E8E6F0", fontSize: 13, fontFamily: "Inter, sans-serif" }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  style={{ borderRadius: 9.375, borderColor: "#E8E6F0", fontSize: 13, fontFamily: "Inter, sans-serif" }}
                >
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#E8E6F0" }} />

      {/* Company Values Section */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F0533", marginBottom: 4 }}>Company Values</h2>
        <p style={{ fontSize: 13, color: "#9996AA", marginBottom: 18.75 }}>
          Define the values used when giving recognition
        </p>

        {isLoadingValues ? (
          <div className="animate-pulse" style={{ fontSize: 13, color: "#9996AA" }}>Loading values...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {values.map((value) => (
              editingValueId === value.id ? (
                <div key={value.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, borderRadius: 13.375, background: "#F5F5F7", border: "1px solid #E8E6F0" }}>
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingValueName}
                      onChange={(e) => setEditingValueName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") setEditingValueId(null);
                      }}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                  <ColorSwatches selected={editingValueColor} onSelect={setEditingValueColor} />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} disabled={!editingValueName.trim()} size="sm" style={{ borderRadius: 9.375, background: "linear-gradient(135deg, #7F2BFE, #FC5BFF)", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Save</Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingValueId(null)} style={{ borderRadius: 9.375, borderColor: "#E8E6F0", fontSize: 13, fontFamily: "Inter, sans-serif" }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div
                  key={value.id}
                  className="flex items-center justify-between"
                  style={{
                    height: 38, paddingLeft: 15, paddingRight: 11.25, borderRadius: 13.375,
                    background: "#F5F5F7", border: "1px solid #E8E6F0",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: value.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#0F0533" }}>{value.name}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEditing(value)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                        <Pencil size={14} color="#9996AA" />
                      </button>
                      <button onClick={() => deleteValue(value.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                        <Trash2 size={15} color="#9996AA" />
                      </button>
                    </div>
                  )}
                </div>
              )
            ))}

            {/* Add Value */}
            {isAdmin && (
              isAddingValue ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, borderRadius: 13.375, background: "#F5F5F7", border: "1px solid #E8E6F0" }}>
                  <Input
                    value={newValueName}
                    onChange={(e) => setNewValueName(e.target.value)}
                    placeholder="Value name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddValue();
                      if (e.key === "Escape") { setIsAddingValue(false); setNewValueName(""); setNewValueColor("#7F2BFE"); }
                    }}
                    style={{ ...inputStyle }}
                  />
                  <ColorSwatches selected={newValueColor} onSelect={setNewValueColor} />
                  <div className="flex gap-2">
                    <Button onClick={handleAddValue} disabled={!newValueName.trim()} size="sm" style={{ borderRadius: 9.375, background: "linear-gradient(135deg, #7F2BFE, #FC5BFF)", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Add</Button>
                    <Button variant="outline" size="sm" onClick={() => { setIsAddingValue(false); setNewValueName(""); setNewValueColor("#7F2BFE"); }} style={{ borderRadius: 9.375, borderColor: "#E8E6F0", fontSize: 13, fontFamily: "Inter, sans-serif" }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingValue(true)}
                  className="flex items-center justify-center gap-1.5 w-full"
                  style={{
                    height: 38,
                    borderRadius: 13.375,
                    border: "1px dashed #E8E6F0",
                    background: "transparent",
                    color: "#9996AA",
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: "Inter, sans-serif",
                    cursor: "pointer",
                    transition: "border-color 0.15s",
                  }}
                >
                  <Plus size={15} />
                  Add Value
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
