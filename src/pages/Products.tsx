import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Package, Coins, ShoppingCart } from "lucide-react";

const Products = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [deliveredKey, setDeliveredKey] = useState<string | null>(null);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at");
    setProducts(data || []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handlePurchase = async () => {
    if (!user || !selectedProduct) return;
    if ((profile?.wallet_points ?? 0) < selectedProduct.price_points) {
      toast.error("Insufficient points!");
      return;
    }
    setPurchasing(true);

    try {
      const { data, error } = await supabase.functions.invoke("purchase-key", {
        body: { product_id: selectedProduct.id },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setDeliveredKey(data.key_code);
      toast.success("Purchase successful! Your key is ready.");
      await refreshProfile();
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  const closeDialog = () => {
    setSelectedProduct(null);
    setDeliveredKey(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Browse and purchase digital access keys.</p>
        </div>

        {products.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="border-border/50 hover:border-primary/30 transition-all group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    {product.stock <= 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : (
                      <Badge variant="secondary">{product.stock} left</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{product.description || "No description."}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Coins className="w-4 h-4" />
                      {product.price_points} Points
                    </div>
                    <Button
                      size="sm"
                      disabled={product.stock <= 0}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Buy Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedProduct} onOpenChange={closeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{deliveredKey ? "🎉 Purchase Complete!" : "Confirm Purchase"}</DialogTitle>
              <DialogDescription>
                {deliveredKey
                  ? "Here is your access key. Copy it now — it won't be shown again."
                  : `You are about to purchase ${selectedProduct?.name} for ${selectedProduct?.price_points} points.`}
              </DialogDescription>
            </DialogHeader>
            {deliveredKey ? (
              <div className="my-4">
                <div className="bg-secondary p-4 rounded-lg font-mono text-sm break-all select-all text-center">
                  {deliveredKey}
                </div>
                <Button className="w-full mt-4" onClick={() => { navigator.clipboard.writeText(deliveredKey); toast.success("Copied!"); }}>
                  Copy Key
                </Button>
              </div>
            ) : (
              <>
                <div className="py-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Product:</span><span>{selectedProduct?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Price:</span><span>{selectedProduct?.price_points} pts</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Your Balance:</span><span>{profile?.wallet_points ?? 0} pts</span></div>
                  <div className="flex justify-between font-medium"><span>After Purchase:</span><span>{(profile?.wallet_points ?? 0) - (selectedProduct?.price_points ?? 0)} pts</span></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button onClick={handlePurchase} disabled={purchasing}>
                    {purchasing ? "Processing..." : "Confirm Purchase"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Products;
