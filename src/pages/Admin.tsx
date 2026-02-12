import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users, Package, Key, History, Plus, Trash2, Edit, Search,
  Coins, Download, Ban, Shield,
} from "lucide-react";
import { Navigate } from "react-router-dom";

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  const [stats, setStats] = useState({ users: 0, sales: 0, points: 0, stock: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState("");

  // Product dialog
  const [productDialog, setProductDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name: "", description: "", price_points: 0 });

  // Key dialog
  const [keyDialog, setKeyDialog] = useState(false);
  const [keyProductId, setKeyProductId] = useState("");
  const [keysInput, setKeysInput] = useState("");

  // Points dialog
  const [pointsDialog, setPointsDialog] = useState(false);
  const [pointsEmail, setPointsEmail] = useState("");
  const [pointsAmount, setPointsAmount] = useState(0);

  const fetchAll = async () => {
    const [{ count: userCount }, { data: prods }, { data: txns }, { data: allKeys }, { data: allUsers }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*").order("created_at"),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("keys").select("*, products(name)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);

    setProducts(prods || []);
    setTransactions(txns || []);
    setKeys(allKeys || []);
    setUsers(allUsers || []);

    const totalSales = (txns || []).filter((t: any) => t.type === "purchase").length;
    const totalPoints = (allUsers || []).reduce((s: number, u: any) => s + (u.wallet_points || 0), 0);
    const totalStock = (prods || []).reduce((s: number, p: any) => s + (p.stock || 0), 0);

    setStats({ users: userCount || 0, sales: totalSales, points: totalPoints, stock: totalStock });
  };

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  if (!loading && !isAdmin) return <Navigate to="/dashboard" replace />;

  // Product CRUD
  const saveProduct = async () => {
    if (editProduct) {
      await supabase.from("products").update(productForm).eq("id", editProduct.id);
      toast.success("Product updated");
    } else {
      await supabase.from("products").insert({ ...productForm, stock: 0 });
      toast.success("Product created");
    }
    setProductDialog(false);
    setEditProduct(null);
    setProductForm({ name: "", description: "", price_points: 0 });
    fetchAll();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast.success("Product deleted");
    fetchAll();
  };

  // Add keys
  const addKeys = async () => {
    const codes = keysInput.split("\n").map((k) => k.trim()).filter(Boolean);
    if (!codes.length || !keyProductId) return;
    const rows = codes.map((key_code) => ({ product_id: keyProductId, key_code }));
    await supabase.from("keys").insert(rows);
    // Update stock
    await supabase.from("products").update({ stock: products.find(p => p.id === keyProductId)!.stock + codes.length }).eq("id", keyProductId);
    toast.success(`${codes.length} keys added`);
    setKeyDialog(false);
    setKeysInput("");
    fetchAll();
  };

  // Add points
  const addPoints = async () => {
    const target = users.find((u) => u.email === pointsEmail);
    if (!target) { toast.error("User not found"); return; }
    await supabase.from("profiles").update({ wallet_points: target.wallet_points + pointsAmount }).eq("user_id", target.user_id);
    await supabase.from("transactions").insert({
      user_id: target.user_id,
      type: "point_added",
      amount: pointsAmount,
      description: `Admin added ${pointsAmount} points`,
    });
    toast.success(`${pointsAmount} points added to ${pointsEmail}`);
    setPointsDialog(false);
    setPointsEmail("");
    setPointsAmount(0);
    fetchAll();
  };

  // Ban user
  const toggleBan = async (u: any) => {
    await supabase.from("profiles").update({ is_banned: !u.is_banned }).eq("user_id", u.user_id);
    toast.success(u.is_banned ? "User unbanned" : "User banned");
    fetchAll();
  };

  // Export CSV
  const exportCSV = () => {
    const headers = "ID,User ID,Type,Amount,Description,Date\n";
    const rows = transactions.map((t: any) => `${t.id},${t.user_id},${t.type},${t.amount},"${t.description}",${t.created_at}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales_report.csv";
    a.click();
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className="w-6 h-6 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="keys">Keys</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => { setEditProduct(null); setProductForm({ name: "", description: "", price_points: 0 }); setProductDialog(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
              <Button variant="outline" onClick={() => { setKeyDialog(true); }}>
                <Key className="w-4 h-4 mr-1" /> Add Keys
              </Button>
            </div>
            <div className="space-y-2">
              {products.map((p) => (
                <Card key={p.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.price_points} pts · Stock: {p.stock}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditProduct(p); setProductForm({ name: p.name, description: p.description || "", price_points: p.price_points }); setProductDialog(true); }}>
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="pl-10" />
              </div>
              <Button onClick={() => setPointsDialog(true)}>
                <Coins className="w-4 h-4 mr-1" /> Add Points
              </Button>
            </div>
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <Card key={u.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{u.display_name || u.email}</p>
                        {u.is_banned && <Badge variant="destructive">Banned</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email} · {u.wallet_points} pts · {u.total_purchases} purchases</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => toggleBan(u)}>
                      <Ban className={`w-4 h-4 ${u.is_banned ? "text-success" : "text-destructive"}`} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* KEYS TAB */}
          <TabsContent value="keys" className="space-y-4">
            <div className="space-y-2">
              {keys.map((k) => (
                <Card key={k.id} className="border-border/50">
                  <CardContent className="p-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-mono">{k.key_code}</span>
                      <span className="text-muted-foreground ml-2">({(k as any).products?.name})</span>
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
                <Card key={tx.id} className="border-border/50">
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
        </Tabs>

        {/* Product Dialog */}
        <Dialog open={productDialog} onOpenChange={setProductDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Product Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
              <Input placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
              <Input type="number" placeholder="Price (Points)" value={productForm.price_points} onChange={(e) => setProductForm({ ...productForm, price_points: parseInt(e.target.value) || 0 })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProductDialog(false)}>Cancel</Button>
              <Button onClick={saveProduct}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Keys Dialog */}
        <Dialog open={keyDialog} onOpenChange={setKeyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Keys to Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={keyProductId}
                onChange={(e) => setKeyProductId(e.target.value)}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <textarea
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                placeholder="Enter keys (one per line)"
                value={keysInput}
                onChange={(e) => setKeysInput(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setKeyDialog(false)}>Cancel</Button>
              <Button onClick={addKeys}>Add Keys</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Points Dialog */}
        <Dialog open={pointsDialog} onOpenChange={setPointsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Points to User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="User Email" value={pointsEmail} onChange={(e) => setPointsEmail(e.target.value)} />
              <Input type="number" placeholder="Points Amount" value={pointsAmount} onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPointsDialog(false)}>Cancel</Button>
              <Button onClick={addPoints}>Add Points</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
