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
import { Package, Coins, ShoppingCart, Clock, FileDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Progress } from "@/components/ui/progress";

const Products = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [purchasing, setPurchasing] = useState(false);
  const [deliveredKey, setDeliveredKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genTimer, setGenTimer] = useState(5);

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
    setGenerating(false);
    setGenProgress(0);
    setGenTimer(5);
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

      // Start key generation animation
      setGenerating(true);
      setPurchasing(false);

      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 100;
        const progress = Math.min((elapsed / 5000) * 100, 100);
        setGenProgress(progress);
        setGenTimer(Math.max(0, Math.ceil((5000 - elapsed) / 1000)));
        if (elapsed >= 5000) {
          clearInterval(interval);
          setGenerating(false);
          setDeliveredKey(data.key_code);
          toast.success(`🎉 ${selectedDuration}-day key generated!`);
          refreshProfile();
          fetchProducts();
        }
      }, 100);
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
      setPurchasing(false);
    }
  };

  const closeDialog = () => {
    setSelectedProduct(null);
    setDeliveredKey(null);
    setGenerating(false);
  };

  return (
    <DashboardLayout>
      <AnimatedBackground />
      <div className="space-y-6 relative z-10">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Browse and purchase digital access keys.</p>
        </div>

        {products.length === 0 ? (
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:bg-card/80 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {product.stock <= 0 ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-success/10 text-success border-0">{product.stock} left</Badge>
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
                        className="group-hover:shadow-md group-hover:shadow-primary/20 transition-shadow"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Buy Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={!!selectedProduct} onOpenChange={closeDialog}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
            <DialogHeader>
              <DialogTitle>
                {deliveredKey ? "🎉 Purchase Complete!" : generating ? "⚡ Generating Key..." : "Confirm Purchase"}
              </DialogTitle>
              <DialogDescription>
                {deliveredKey
                  ? `Here is your ${selectedDuration}-day access key. Copy it now — it won't be shown again.`
                  : generating
                  ? "Please wait while your key is being generated..."
                  : `You are about to purchase ${selectedProduct?.name}.`}
              </DialogDescription>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {generating ? (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="my-6 space-y-4"
                >
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center"
                    >
                      <Loader2 className="w-8 h-8 text-primary animate-pulse" />
                    </motion.div>
                    <motion.p
                      className="text-3xl font-bold text-primary"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {genTimer}s
                    </motion.p>
                    <Progress value={genProgress} className="w-full h-2" />
                    <p className="text-sm text-muted-foreground">Generating your {selectedDuration}-day key...</p>
                  </div>
                </motion.div>
              ) : deliveredKey ? (
                <motion.div
                  key="delivered"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="my-4"
                >
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg font-mono text-sm break-all select-all text-center backdrop-blur-sm">
                    {deliveredKey}
                  </div>
                  <Badge className="mt-2 bg-primary/10 text-primary border-0">
                    <Clock className="w-3 h-3 mr-1" /> {selectedDuration} days duration
                  </Badge>
                  {selectedProduct?.file_url && (
                    <a href={selectedProduct.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full mt-3">
                        <FileDown className="w-4 h-4 mr-1" /> Download File
                      </Button>
                    </a>
                  )}
                  <Button className="w-full mt-2" onClick={() => { navigator.clipboard.writeText(deliveredKey); toast.success("Copied!"); }}>
                    Copy Key
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="py-4 space-y-3">
                    {/* Duration selector */}
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Select Duration</label>
                      <div className="flex gap-2 flex-wrap">
                        {(selectedProduct?.duration_days || [30]).map((d: number) => (
                          <motion.div key={d} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant={selectedDuration === d ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedDuration(d)}
                              className={selectedDuration === d ? "shadow-md shadow-primary/30" : ""}
                            >
                              {d} Days
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Product:</span><span>{selectedProduct?.name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Duration:</span><span className="text-primary font-medium">{selectedDuration} days</span></div>
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
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Products;
