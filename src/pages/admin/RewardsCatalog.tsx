
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import RewardCard from "@/components/rewards/RewardCard";
import AddProductDialog from "@/components/rewards/AddProductDialog";
import { useRewardCatalog } from "@/hooks/useRewardCatalog";

const RewardsCatalog = () => {
  const { 
    rewards, 
    isLoadingRewards, 
    isAddProductOpen, 
    setIsAddProductOpen, 
    handleAddProduct, 
    isLoading,
    handleDeleteProduct,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    rewardToDelete,
    confirmDeleteProduct,
    isDeleting
  } = useRewardCatalog();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Rewards Catalog</h2>
        <Button 
          onClick={() => setIsAddProductOpen(true)}
          className="bg-[#F572FF] hover:bg-[#F572FF]/90"
        >
          Add Product
        </Button>
      </div>

      {isLoadingRewards ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F572FF]"></div>
        </div>
      ) : rewards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <RewardCard 
              key={reward.id} 
              reward={reward} 
              onDelete={handleDeleteProduct}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-800">No products in catalog</h3>
          <p className="text-gray-500 mt-2">
            Add products by clicking the "Add Product" button
          </p>
        </Card>
      )}

      <AddProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        onAddProduct={handleAddProduct}
        isLoading={isLoading}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{rewardToDelete?.name}" from your rewards catalog.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RewardsCatalog;
