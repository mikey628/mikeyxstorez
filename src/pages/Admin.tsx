import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users, Package, Key, Plus, Trash2, Edit, Search,
  Coins, Download, Ban, Shield, CheckCircle, XCircle, Upload,
  LogOut, Link as LinkIcon, Globe, Clock,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { ThemeSettings as ThemeSettingsComponent } from "@/components/ThemeSettings";

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  const [stats, setStats] = useState({ users: 0, sales: 0, points: 0, stock: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({ whatsapp_link: "", tiktok_link: "", discord_link: "" });

  // Product dialog
  const [productDialog, setProductDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name: "", description: "", price_points: 0, duration_days: "30" });
  const [productFile, setProductFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Key dialog
  const [keyDialog, setKeyDialog] = useState(false);
  const [keyProductId, setKeyProductId] = useState("");
  const [keysInput, setKeysInput] = useState("");
  const [keyDuration, setKeyDuration] = useState<number>(30);
  const [keyPrice, setKeyPrice] = useState<number>(0);

  // Points dialog
  const [pointsDialog, setPointsDialog] = useState(false);
  const [pointsUserId, setPointsUserId] = useState("");
  const [pointsUserEmail, setPointsUserEmail] = useState("");
  const [pointsAmount, setPointsAmount] = useState(0);
  const [pointsMode, setPointsMode] = useState<"add" | "set">("set");

  // Confirm delete dialog
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<any>(null);

  const fetchAll = async () => {
    const [{ count: userCount }, { data: prods }, { data: txns }, { data: allKeys }, { data: allUsers }, { data: settings }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*").order("created_at"),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("keys").select("*, products(name)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("site_settings").select("*"),
    ]);

    setProducts(prods || []);
    setTransactions(txns || []);
    setKeys(allKeys || []);
    setUsers(allUsers || []);

    const links: Record<string, string> = { whatsapp_link: "", tiktok_link: "", discord_link: "" };
    (settings || []).forEach((s: any) => { links[s.key] = s.value || ""; });
    setSocialLinks(links);

    const totalSales = (txns || []).filter((t: any) => t.type === "purchase").length;
    const totalPoints = (allUsers || []).reduce((s: number, u: any) => s + (u.wallet_points || 0), 0);
    const totalStock = (prods || []).reduce((s: number, p: any) => s + (p.stock || 0), 0);
    setStats({ users: userCount || 0, sales: totalSales, points: totalPoints, stock: totalStock });
  };

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin]);

  if (!loading && !isAdmin) return <Navigate to="/dashboard" replace />;

  // Save social links
  const saveSocialLinks = async () => {
    for (const [key, value] of Object.entries(socialLinks)) {
      await supabase.from("site_settings").update({ value }).eq("key", key);
    }
    toast.success("Social links updated!");
  };

  // Product CRUD
  const saveProduct = async () => {
    const durationDays = productForm.duration_days.split(",").map(d => parseInt(d.trim())).filter(d => !isNaN(d));
    
    let fileUrl = editProduct?.file_url || null;
    if (productFile) {
      setUploading(true);
      setUploadProgress(0);
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 20, 90));
      }, 300);

      const filePath = `products/${Date.now()}_${productFile.name}`;
      const { error: uploadErr } = await supabase.storage.from("product-files").upload(filePath, productFile);
      
      clearInterval(progressInterval);
      
      if (uploadErr) { 
        toast.error("File upload failed"); 
        setUploading(false);
        setUploadProgress(0);
        return; 
      }
      setUploadProgress(100);
      const { data: { publicUrl } } = supabase.storage.from("product-files").getPublicUrl(filePath);
      fileUrl = publicUrl;
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }

    const payload = { 
      name: productForm.name, 
      description: productForm.description, 
      price_points: productForm.price_points,
      duration_days: durationDays.length > 0 ? durationDays : [30],
      file_url: fileUrl,
    };

    if (editProduct) {
      await supabase.from("products").update(payload).eq("id", editProduct.id);
      toast.success("Product updated");
    } else {
      await supabase.from("products").insert({ ...payload, stock: 0 });
      toast.success("Product created");
    }
    setProductDialog(false);
    setEditProduct(null);
    setProductForm({ name: "", description: "", price_points: 0, duration_days: "30" });
    setProductFile(null);
    fetchAll();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast.success("Product deleted");
    fetchAll();
  };

  // Add keys with duration and price
  const addKeys = async () => {
    const codes = keysInput.split("\n").map((k) => k.trim()).filter(Boolean);
    if (!codes.length || !keyProductId) return;
    const rows = codes.map((key_code) => ({ product_id: keyProductId, key_code, duration_days: keyDuration }));
    await supabase.from("keys").insert(rows);
    const prod = products.find(p => p.id === keyProductId);
    if (prod) {
      // Update stock and save price for this duration
      const currentPrices = prod.duration_prices || {};
      const updatedPrices = { ...currentPrices, [String(keyDuration)]: keyPrice };
      await supabase.from("products").update({ 
        stock: prod.stock + codes.length,
        duration_prices: updatedPrices 
      }).eq("id", keyProductId);
    }
    toast.success(`${codes.length} keys added (${keyDuration} days @ ${keyPrice} pts each)`);
    setKeyDialog(false);
    setKeysInput("");
    setKeyDuration(30);
    setKeyPrice(0);
    fetchAll();
  };

  // Edit points
  const editPoints = async () => {
    const target = users.find((u) => u.user_id === pointsUserId);
    if (!target) { toast.error("User not found"); return; }
    const newPoints = pointsMode === "set" ? pointsAmount : target.wallet_points + pointsAmount;
    await supabase.from("profiles").update({ wallet_points: newPoints }).eq("user_id", target.user_id);
    await supabase.from("transactions").insert({
      user_id: target.user_id,
      type: "point_added",
      amount: pointsMode === "set" ? newPoints - target.wallet_points : pointsAmount,
      description: pointsMode === "set" ? `Admin set points to ${newPoints}` : `Admin added ${pointsAmount} points`,
    });
    toast.success(`Points updated for ${target.email}`);
    setPointsDialog(false);
    setPointsUserId("");
    setPointsUserEmail("");
    setPointsAmount(0);
    fetchAll();
  };

  const toggleApproval = async (u: any) => {
    await supabase.from("profiles").update({ is_approved: !u.is_approved }).eq("user_id", u.user_id);
    toast.success(u.is_approved ? "User access revoked" : "User approved!");
    fetchAll();
  };

  const toggleBan = async (u: any) => {
    await supabase.from("profiles").update({ is_banned: !u.is_banned }).eq("user_id", u.user_id);
    toast.success(u.is_banned ? "User unbanned" : "User banned");
    fetchAll();
  };

  // Logout user
  const logoutUser = async (u: any) => {
    try {
      const { error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "logout", target_user_id: u.user_id },
      });
      if (error) throw error;
      toast.success(`${u.email} has been logged out`);
    } catch (err: any) {
      toast.error(err.message || "Failed to logout user");
    }
  };

  // Delete user
  const confirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "delete", target_user_id: deleteTargetUser.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`${deleteTargetUser.email} has been deleted`);
      setDeleteUserDialog(false);
      setDeleteTargetUser(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const exportCSV = () => {
    const headers = "ID,User ID,Type,Amount,Description,Date\n";
    const rows = transactions.map((t: any) => `${t.id},${t.user_id},${t.type},${t.amount},"${t.description}",${t.created_at}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "sales_report.csv"; a.click();
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.display_name || "").toLowerCase().includes(searchUser.toLowerCase())
  );

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Total Sales", value: stats.sales, icon: Package },
    { label: "Points in System", value: stats.points, icon: Coins },
    { label: "Stock Remaining", value: stats.stock, icon: Key },
  ];

  // Get available durations for selected product in key dialog
  const selectedKeyProduct = products.find(p => p.id === keyProductId);
  const availableDurations = selectedKeyProduct?.duration_days || [30];

  return (
    <DashboardLayout>
      <AnimatedBackground />
      <div className="space-y-6 relative z-10">
        <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className="w-6 h-6 text-muted-foreground" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-5 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="keys">Keys</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => { setEditProduct(null); setProductForm({ name: "", description: "", price_points: 0, duration_days: "1,3,5,6,7,10,14,15,30" }); setProductFile(null); setProductDialog(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
              <Button variant="outline" onClick={() => setKeyDialog(true)}>
                <Key className="w-4 h-4 mr-1" /> Add Keys
              </Button>
            </div>
            <div className="space-y-2">
              {products.map((p) => (
                <Card key={p.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.price_points} pts · Stock: {p.stock} · Days: {(p.duration_days || [30]).join(", ")}
                        {p.file_url && " · 📎 File"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { 
                        setEditProduct(p); 
                        setProductForm({ name: p.name, description: p.description || "", price_points: p.price_points, duration_days: (p.duration_days || [30]).join(", ") }); 
                        setProductFile(null); setProductDialog(true); 
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by email or name..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="pl-10 bg-card/50 backdrop-blur-sm" />
            </div>
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <Card key={u.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{u.display_name || u.email}</p>
                        {u.is_banned && <Badge variant="destructive">Banned</Badge>}
                        {u.is_approved ? (
                          <Badge className="bg-success/10 text-success border-0">Approved</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email} · {u.wallet_points} pts · {u.total_purchases} purchases</p>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Button variant="ghost" size="icon" title="Edit Points" onClick={() => {
                        setPointsUserId(u.user_id); setPointsUserEmail(u.email);
                        setPointsAmount(u.wallet_points); setPointsMode("set"); setPointsDialog(true);
                      }}>
                        <Coins className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" title={u.is_approved ? "Revoke" : "Approve"} onClick={() => toggleApproval(u)}>
                        {u.is_approved ? <XCircle className="w-4 h-4 text-warning" /> : <CheckCircle className="w-4 h-4 text-success" />}
                      </Button>
                      <Button variant="ghost" size="icon" title={u.is_banned ? "Unban" : "Ban"} onClick={() => toggleBan(u)}>
                        <Ban className={`w-4 h-4 ${u.is_banned ? "text-success" : "text-destructive"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" title="Force Logout" onClick={() => logoutUser(u)}>
                        <LogOut className="w-4 h-4 text-warning" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Delete User" onClick={() => { setDeleteTargetUser(u); setDeleteUserDialog(true); }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* KEYS TAB */}
          <TabsContent value="keys" className="space-y-4">
            <div className="space-y-2">
              {keys.map((k) => (
                <Card key={k.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-mono">{k.key_code}</span>
                      <span className="text-muted-foreground ml-2">({(k as any).products?.name})</span>
                      {k.duration_days && <span className="text-muted-foreground ml-1">· {k.duration_days}d</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {k.is_used ? (
                        <Badge variant="secondary">Used</Badge>
                      ) : (
                        <Badge className="bg-success/10 text-success border-0">Available</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TRANSACTIONS TAB */}
          <TabsContent value="transactions" className="space-y-4">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
            <div className="space-y-2">
              {transactions.map((tx) => (
                <Card key={tx.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-3 flex items-center justify-between text-sm">
                    <div>
                      <Badge variant="outline" className="mr-2">{tx.type.replace("_", " ")}</Badge>
                      {tx.description}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{tx.amount} pts</span>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Globe className="w-4 h-4" /> Social Links</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">WhatsApp Link</label>
                    <Input placeholder="https://wa.me/..." value={socialLinks.whatsapp_link} onChange={(e) => setSocialLinks({...socialLinks, whatsapp_link: e.target.value})} className="bg-background/50" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">TikTok Link</label>
                    <Input placeholder="https://tiktok.com/..." value={socialLinks.tiktok_link} onChange={(e) => setSocialLinks({...socialLinks, tiktok_link: e.target.value})} className="bg-background/50" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Discord Link</label>
                    <Input placeholder="https://discord.gg/..." value={socialLinks.discord_link} onChange={(e) => setSocialLinks({...socialLinks, discord_link: e.target.value})} className="bg-background/50" />
                  </div>
                  <Button onClick={saveSocialLinks}>
                    <LinkIcon className="w-4 h-4 mr-1" /> Save Links
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <ThemeSettingsComponent />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Product Dialog */}
        <Dialog open={productDialog} onOpenChange={setProductDialog}>
          <DialogContent className="bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Product Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="bg-background/50" />
              <Input placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="bg-background/50" />
              <Input type="number" placeholder="Price (Points)" value={productForm.price_points} onChange={(e) => setProductForm({ ...productForm, price_points: parseInt(e.target.value) || 0 })} className="bg-background/50" />
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Duration days (comma separated)</label>
                <Input placeholder="1,3,5,6,7,10,14,15,30" value={productForm.duration_days} onChange={(e) => setProductForm({ ...productForm, duration_days: e.target.value })} className="bg-background/50" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Product File (optional)</label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("product-file-input")?.click()}>
                    <Upload className="w-4 h-4 mr-1" /> {productFile ? productFile.name : (editProduct?.file_url ? "Replace File" : "Upload File")}
                  </Button>
                  <input id="product-file-input" type="file" className="hidden" onChange={(e) => setProductFile(e.target.files?.[0] || null)} />
                </div>
                {uploading && (
                  <div className="mt-2 space-y-1">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}% uploaded</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProductDialog(false)}>Cancel</Button>
              <Button onClick={saveProduct} disabled={uploading}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Keys Dialog */}
        <Dialog open={keyDialog} onOpenChange={setKeyDialog}>
          <DialogContent className="bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Add Keys to Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <select
                className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm"
                value={keyProductId}
                onChange={(e) => { setKeyProductId(e.target.value); setKeyDuration(30); }}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              {keyProductId && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Key Duration (days)
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {availableDurations.map((d: number) => (
                        <Button
                          key={d}
                          variant={keyDuration === d ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setKeyDuration(d);
                            // Pre-fill existing price for this duration
                            const existingPrice = selectedKeyProduct?.duration_prices?.[String(d)];
                            setKeyPrice(existingPrice || selectedKeyProduct?.price_points || 0);
                          }}
                          className={keyDuration === d ? "shadow-md shadow-primary/30" : ""}
                        >
                          {d}d
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-1">
                      <Coins className="w-3 h-3" /> Price for {keyDuration}-day key (points)
                    </label>
                    <Input
                      type="number"
                      placeholder={`Price for ${keyDuration}-day key`}
                      value={keyPrice}
                      onChange={(e) => setKeyPrice(parseInt(e.target.value) || 0)}
                      className="bg-background/50"
                    />
                  </div>
                </div>
              )}

              <textarea
                className="w-full min-h-[120px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm font-mono"
                placeholder="Enter keys (one per line)"
                value={keysInput}
                onChange={(e) => setKeysInput(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setKeyDialog(false)}>Cancel</Button>
              <Button onClick={addKeys}>Add Keys ({keyDuration}d)</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Points Dialog */}
        <Dialog open={pointsDialog} onOpenChange={setPointsDialog}>
          <DialogContent className="bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Edit Points — {pointsUserEmail}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant={pointsMode === "set" ? "default" : "outline"} size="sm" onClick={() => setPointsMode("set")}>Set Points</Button>
                <Button variant={pointsMode === "add" ? "default" : "outline"} size="sm" onClick={() => setPointsMode("add")}>Add Points</Button>
              </div>
              <Input type="number" placeholder={pointsMode === "set" ? "New point balance" : "Points to add"} value={pointsAmount} onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)} className="bg-background/50" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPointsDialog(false)}>Cancel</Button>
              <Button onClick={editPoints}>{pointsMode === "set" ? "Set Points" : "Add Points"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirm Dialog */}
        <Dialog open={deleteUserDialog} onOpenChange={setDeleteUserDialog}>
          <DialogContent className="bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>⚠️ Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete <strong>{deleteTargetUser?.email}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteUserDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDeleteUser}>Delete Permanently</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
