import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Trash2, Plus, Building2 } from "lucide-react";
import { useDepartmentManagement } from "@/hooks/useDepartmentManagement";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";

const DepartmentManagement = () => {
  const {
    departments,
    isLoading,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  } = useDepartmentManagement();

  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [editingDepartment, setEditingDepartment] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) return;

    try {
      await createDepartment.mutateAsync(newDepartmentName);
      setNewDepartmentName("");
      setShowCreateDialog(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartment || !editingDepartment.name.trim()) return;

    try {
      await updateDepartment.mutateAsync({
        id: editingDepartment.id,
        name: editingDepartment.name,
      });
      setEditingDepartment(null);
      setShowEditDialog(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deletingDepartmentId) return;

    try {
      await deleteDepartment.mutateAsync(deletingDepartmentId);
      setDeletingDepartmentId(null);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const startEdit = (department: { id: string; name: string }) => {
    setEditingDepartment({ ...department });
    setShowEditDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Department Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Manage your company departments. You can create, edit, and delete departments.
          </p>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="department-name">Department Name</Label>
                  <Input
                    id="department-name"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    placeholder="Enter department name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateDepartment();
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setNewDepartmentName("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateDepartment}
                    disabled={!newDepartmentName.trim() || createDepartment.isPending}
                  >
                    {createDepartment.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {departments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No departments created yet</p>
            <p className="text-sm">Create your first department to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {departments.map((department) => (
              <div
                key={department.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <h4 className="font-medium">{department.name}</h4>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(department)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingDepartmentId(department.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-department-name">Department Name</Label>
                <Input
                  id="edit-department-name"
                  value={editingDepartment?.name || ""}
                  onChange={(e) =>
                    setEditingDepartment(prev =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  placeholder="Enter department name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUpdateDepartment();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingDepartment(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateDepartment}
                  disabled={
                    !editingDepartment?.name.trim() || updateDepartment.isPending
                  }
                >
                  {updateDepartment.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingDepartmentId}
          onOpenChange={() => setDeletingDepartmentId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Department</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this department? This action cannot be
                undone. All team members assigned to this department will need to be
                reassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDepartment}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteDepartment.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default DepartmentManagement;