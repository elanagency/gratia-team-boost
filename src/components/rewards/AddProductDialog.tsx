
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProduct: (url: string, pointsMultiplier: number) => void;
  isLoading: boolean;
}

export const AddProductDialog = ({ 
  open, 
  onOpenChange, 
  onAddProduct, 
  isLoading 
}: AddProductDialogProps) => {
  const [productUrl, setProductUrl] = useState("");
  const [pointsMultiplier, setPointsMultiplier] = useState(1);

  const handleAddProduct = () => {
    if (!productUrl) {
      toast("Please enter a valid product URL", {
        description: "URL is required to add a product"
      });
      return;
    }

    // Validate URL format
    try {
      new URL(productUrl);
    } catch (e) {
      toast("Invalid URL format", {
        description: "Please enter a valid URL"
      });
      return;
    }

    onAddProduct(productUrl, pointsMultiplier);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Product to Rewards Catalog</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="productUrl">Product URL (Amazon or Shopify)</Label>
            <Input
              id="productUrl"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://example.com/product"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="pointsMultiplier">Points per dollar</Label>
            <Input
              id="pointsMultiplier"
              type="number"
              value={pointsMultiplier}
              onChange={(e) => setPointsMultiplier(Number(e.target.value))}
              min={0.1}
              step={0.1}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              1 point = ${1/pointsMultiplier} (e.g., for a $20 product, this would be {20 * pointsMultiplier} points)
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddProduct} 
            disabled={isLoading}
            className="bg-[#F572FF] hover:bg-[#F572FF]/90"
          >
            {isLoading ? "Adding..." : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
