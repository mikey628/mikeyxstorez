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
import { Package, Coins, ShoppingCart, Clock, FileDown } from "lucide-react";

const Products = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [purchasing, setPurchasing] = useState(false);
  const [deliveredKey, setDeliveredKey] = useState<string | null>(null);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at");
    setProducts(data || []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openPurchaseDialog = (product: any) => {
    setSelectedProduct(product);
    setSelectedDuration((product.duration_days || [30])[0]);
    setDeliveredKey(null);
  };

  const handlePurchase = async () => {
    if (!user || !selectedProduct) return;
    if ((profile?.wallet_points ?? 0) < selectedProduct.price_points) {
      toast.error("Insufficient points!");
      return;
    }
    setPurchasing(true);

    try {
      const { data, error } = await supabase.functions.invoke("purchase-key", {
        body: { product_id: selectedProduct.id, duration_days: selectedDuration },
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Duration: {(product.duration_days || [30]).join(", ")} days
                  </div>
                  {product.file_url && (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <FileDown className="w-3 h-3" />
                      Includes downloadable file
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Coins className="w-4 h-4" />
                      {product.price_points} Points
                    </div>
                    <Button
                      size="sm"
                      disabled={product.stock <= 0}
                      onClick={() => openPurchaseDialog(product)}
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
                  : `You are about to purchase ${selectedProduct?.name}.`}
              </DialogDescription>
            </DialogHeader>
            {deliveredKey ? (
              <div className="my-4">
                <div className="bg-secondary p-4 rounded-lg font-mono text-sm break-all select-all text-center">
                  {deliveredKey}
                </div>
                {selectedProduct?.file_url && (
                  <a href={selectedProduct.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full mt-2">
                      <FileDown className="w-4 h-4 mr-1" /> Download File
                    </Button>
                  </a>
                )}
                <Button className="w-full mt-2" onClick={() => { navigator.clipboard.writeText(deliveredKey); toast.success("Copied!"); }}>
                  Copy Key
                </Button>
              </div>
            ) : (
              <>
                <div className="py-4 space-y-3">
                  {/* Duration selector */}
                  {(selectedProduct?.duration_days || [30]).length > 1 && (
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Select Duration</label>
                      <div className="flex gap-2 flex-wrap">
                        {(selectedProduct?.duration_days || [30]).map((d: number) => (
                          <Button
                            key={d}
                            variant={selectedDuration === d ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedDuration(d)}
                          >
                            {d} Days
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Product:</span><span>{selectedProduct?.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Duration:</span><span>{selectedDuration} days</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Price:</span><span>{selectedProduct?.price_points} pts</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Your Balance:</span><span>{profile?.wallet_points ?? 0} pts</span></div>
                    <div className="flex justify-between font-medium"><span>After Purchase:</span><span>{(profile?.wallet_points ?? 0) - (selectedProduct?.price_points ?? 0)} pts</span></div>
                  </div>
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
