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
  LogOut, Link as LinkIcon, Globe, Clock, Power, AlertTriangle, RotateCcw,
  Tag, Gift, Image, Video, QrCode, CreditCard, Eye, ExternalLink, Server, UserPlus, Bell,
  Gamepad2, MessageCircle, Send,
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
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [resetDialog, setResetDialog] = useState(false);
  const [resetType, setResetType] = useState<"keys" | "points" | "all">("all");

  // Realtime notification
  const [pendingNotifCount, setPendingNotifCount] = useState(0);
  const [showNotifBell, setShowNotifBell] = useState(false);

  // Topup management
  const [topupRequests, setTopupRequests] = useState<any[]>([]);
  const [topupPackages, setTopupPackages] = useState<any[]>([]);
  const [topupServers, setTopupServers] = useState<any[]>([]);
  const [topupAdmins, setTopupAdmins] = useState<any[]>([]);
  const [topupSettings, setTopupSettings] = useState({
    payment_method: "qr",
    processing_time: "5-30 minutes",
    esewa_qr_url: "",
    khalti_qr_url: "",
    bank_qr_url: "",
    currency: "USD",
    admin_can_view_proofs: "true",
    admin_can_approve: "true",
    admin_can_reject: "true",
  });
  const [qrUploading, setQrUploading] = useState<string | null>(null);
  const [pkgDialog, setPkgDialog] = useState(false);
  const [editPkg, setEditPkg] = useState<any>(null);
  const [pkgForm, setPkgForm] = useState({ label: "", price: 0, duration_days: 0, description: "" });
  const [pkgImageFile, setPkgImageFile] = useState<File | null>(null);
  const [proofViewUrl, setProofViewUrl] = useState<string | null>(null);
  const [proofViewLoading, setProofViewLoading] = useState(false);

  // Server management
  const [serverDialog, setServerDialog] = useState(false);
  const [editServer, setEditServer] = useState<any>(null);
  const [serverForm, setServerForm] = useState({ name: "", flag: "🌐" });
  const [serverLogoFile, setServerLogoFile] = useState<File | null>(null);
  const [serverUploading, setServerUploading] = useState(false);

  // Topup games management
  const [topupGames, setTopupGames] = useState<any[]>([]);
  const [gameDialog, setGameDialog] = useState(false);
  const [editGame, setEditGame] = useState<any>(null);
  const [gameForm, setGameForm] = useState<any>({ name: "", emoji: "🎮", uid_label: "Game UID", id_label: "Player ID" });
  const [gameImageFile, setGameImageFile] = useState<File | null>(null);
  const [gameUploading, setGameUploading] = useState(false);

  // Topup admin management
  const [topupAdminDialog, setTopupAdminDialog] = useState(false);
  const [topupAdminEmail, setTopupAdminEmail] = useState("");

  // Chat management
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({});
  const [activeChatSession, setActiveChatSession] = useState<string | null>(null);
  const [chatReply, setChatReply] = useState("");
  const [chatSettings, setChatSettings] = useState({ welcome: "Welcome! 👋 How can we help you today?", response_time: "5-15 minutes", enabled: "true" });
  const [unreadChats, setUnreadChats] = useState(0);

  // Credit packages & requests
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [creditRequests, setCreditRequests] = useState<any[]>([]);
  const [creditPkgDialog, setCreditPkgDialog] = useState(false);
  const [editCreditPkg, setEditCreditPkg] = useState<any>(null);
  const [creditPkgForm, setCreditPkgForm] = useState({ amount: 0, price: 0, description: "" });

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

  // Offers management
  const [offers, setOffers] = useState<any[]>([]);
  const [offerDialog, setOfferDialog] = useState(false);
  const [editOffer, setEditOffer] = useState<any>(null);
  const [offerForm, setOfferForm] = useState({ title: "", description: "", type: "offer", price_points: 0, duration_days: 0, key_code: "", is_active: true });

  // Logo media
  const [logoImage, setLogoImage] = useState("");
  const [logoVideo, setLogoVideo] = useState("");
  const [logoImageFile, setLogoImageFile] = useState<File | null>(null);
  const [logoVideoFile, setLogoVideoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

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
    const { data: offerData } = await supabase.from("offers").select("*").order("sort_order");
    const { data: topupReqs } = await supabase.from("topup_requests").select("*, topup_servers(name,flag)").order("created_at", { ascending: false });
    const { data: topupPkgs } = await supabase.from("topup_packages").select("*").order("sort_order");
    const { data: srvs } = await supabase.from("topup_servers").select("*").order("sort_order");
    const { data: tadmins } = await supabase.from("topup_admins").select("*").order("created_at", { ascending: false });
    const { data: gms } = await supabase.from("topup_games").select("*").order("sort_order");
    const { data: sessions } = await supabase.from("chat_sessions").select("*").order("updated_at", { ascending: false });
    const { data: credPkgs } = await supabase.from("credit_packages" as any).select("*").order("sort_order");
    const { data: credReqs } = await supabase.from("credit_requests" as any).select("*").order("created_at", { ascending: false });
    setTopupGames(gms || []);
    setChatSessions(sessions || []);
    setUnreadChats((sessions || []).filter((s: any) => s.status === "open").length);
    setCreditPackages(credPkgs || []);
    setCreditRequests(credReqs || []);

    setProducts(prods || []);
    setTransactions(txns || []);
    setKeys(allKeys || []);
    setUsers(allUsers || []);
    setOffers(offerData || []);
    setTopupRequests(topupReqs || []);
    setTopupPackages(topupPkgs || []);
    setTopupServers(srvs || []);
    setTopupAdmins(tadmins || []);
    // Sync pending count from fresh load
    const pending = (topupReqs || []).filter((r: any) => r.status === "pending").length;
    setPendingNotifCount(pending);

    const links: Record<string, string> = { whatsapp_link: "", tiktok_link: "", discord_link: "" };
    let mMode = false;
    let reqApproval = true;
    const ts = { 
      payment_method: "qr", processing_time: "5-30 minutes", 
      esewa_qr_url: "", khalti_qr_url: "", bank_qr_url: "",
      currency: "USD",
      admin_can_view_proofs: "true", admin_can_approve: "true", admin_can_reject: "true",
    };
    const chatSet = { welcome: "Welcome! 👋 How can we help you today?", response_time: "5-15 minutes", enabled: "true" };
    (settings || []).forEach((s: any) => {
      if (s.key === "maintenance_mode") mMode = s.value === "true";
      else if (s.key === "require_approval") reqApproval = s.value !== "false";
      else if (s.key === "logo_image_url") setLogoImage(s.value || "");
      else if (s.key === "logo_video_url") setLogoVideo(s.value || "");
      else if (s.key === "topup_payment_method") ts.payment_method = s.value || "qr";
      else if (s.key === "topup_processing_time") ts.processing_time = s.value || "5-30 minutes";
      else if (s.key === "esewa_qr_url") ts.esewa_qr_url = s.value || "";
      else if (s.key === "khalti_qr_url") ts.khalti_qr_url = s.value || "";
      else if (s.key === "bank_qr_url") ts.bank_qr_url = s.value || "";
      else if (s.key === "topup_currency") ts.currency = s.value || "USD";
      else if (s.key === "topup_admin_can_view_proofs") ts.admin_can_view_proofs = s.value || "true";
      else if (s.key === "topup_admin_can_approve") ts.admin_can_approve = s.value || "true";
      else if (s.key === "topup_admin_can_reject") ts.admin_can_reject = s.value || "true";
      else if (s.key === "chat_welcome_message") chatSet.welcome = s.value || chatSet.welcome;
      else if (s.key === "chat_response_time") chatSet.response_time = s.value || chatSet.response_time;
      else if (s.key === "chat_enabled") chatSet.enabled = s.value || "true";
      else links[s.key] = s.value || "";
    });
    setSocialLinks(links);
    setMaintenanceMode(mMode);
    setRequireApproval(reqApproval);
    setTopupSettings(ts);
    setChatSettings(chatSet);

    const totalSales = (txns || []).filter((t: any) => t.type === "purchase").length;
    const totalPoints = (allUsers || []).reduce((s: number, u: any) => s + (u.wallet_points || 0), 0);
    const totalStock = (prods || []).reduce((s: number, p: any) => s + (p.stock || 0), 0);
    setStats({ users: userCount || 0, sales: totalSales, points: totalPoints, stock: totalStock });
  };

  useEffect(() => { if (isAdmin) fetchAll(); }, [isAdmin]);

  // Realtime subscription for new topup requests
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("topup-requests-admin-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "topup_requests" },
        (payload) => {
          setTopupRequests((prev) => [payload.new as any, ...prev]);
          setPendingNotifCount((c) => c + 1);
          setShowNotifBell(true);
          toast.info(`🔔 New topup request: UID ${(payload.new as any).game_uid}`, {
            description: `${(payload.new as any).product_name} · $${(payload.new as any).amount_paid}`,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "topup_requests" },
        (payload) => {
          setTopupRequests((prev) =>
            prev.map((r) => (r.id === (payload.new as any).id ? { ...r, ...(payload.new as any) } : r))
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

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

    const payload: any = { 
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
    setProductForm({ name: "", description: "", price_points: 0, duration_days: "30", price_usd: "" } as any);
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

  const toggleMaintenance = async () => {
    const newVal = !maintenanceMode;
    await supabase.from("site_settings").update({ value: String(newVal) }).eq("key", "maintenance_mode");
    setMaintenanceMode(newVal);
    toast.success(newVal ? "Maintenance mode ON — site is offline for users" : "Maintenance mode OFF — site is live");
  };

  const toggleRequireApproval = async () => {
    const newVal = !requireApproval;
    await supabase.from("site_settings").update({ value: String(newVal) }).eq("key", "require_approval");
    setRequireApproval(newVal);
    toast.success(newVal ? "Login approval REQUIRED — new users need admin approval" : "Login approval OFF — all users can login freely");
  };

  const saveTopupSettings = async () => {
    const updates = [
      { key: "topup_payment_method", value: topupSettings.payment_method },
      { key: "topup_processing_time", value: topupSettings.processing_time },
      { key: "topup_currency", value: topupSettings.currency },
      { key: "topup_admin_can_view_proofs", value: topupSettings.admin_can_view_proofs },
      { key: "topup_admin_can_approve", value: topupSettings.admin_can_approve },
      { key: "topup_admin_can_reject", value: topupSettings.admin_can_reject },
    ];
    for (const u of updates) {
      await supabase.from("site_settings").update({ value: u.value }).eq("key", u.key);
    }
    toast.success("Topup settings saved!");
  };

  // Generate signed URL for private payment proof (bucket is private)
  const viewProof = async (storagePath: string) => {
    if (!storagePath) return;
    setProofViewLoading(true);
    setProofViewUrl(null);
    // If it's already a full URL (legacy), show directly
    if (storagePath.startsWith("http")) {
      setProofViewUrl(storagePath);
      setProofViewLoading(false);
      return;
    }
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(storagePath, 3600); // 1 hour expiry
    if (error || !data?.signedUrl) {
      toast.error("Could not load proof image");
      setProofViewLoading(false);
      return;
    }
    setProofViewUrl(data.signedUrl);
    setProofViewLoading(false);
  };

  const uploadTopupQr = async (file: File, type: "esewa" | "khalti" | "bank") => {
    setQrUploading(type);
    const path = `${type}_qr_${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("topup-qr").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); setQrUploading(null); return; }
    const { data: { publicUrl } } = supabase.storage.from("topup-qr").getPublicUrl(path);
    const settingKey = `${type}_qr_url`;
    const { count } = await supabase.from("site_settings").select("*", { count: "exact", head: true }).eq("key", settingKey);
    if (count && count > 0) {
      await supabase.from("site_settings").update({ value: publicUrl }).eq("key", settingKey);
    } else {
      await supabase.from("site_settings").insert({ key: settingKey, value: publicUrl });
    }
    setTopupSettings(s => ({ ...s, [`${type}_qr_url`]: publicUrl }));
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} QR updated!`);
    setQrUploading(null);
  };

  const saveTopupPackage = async () => {
    if (!pkgForm.label || !pkgForm.price) { toast.error("Fill all fields"); return; }
    let imageUrl: string | undefined = editPkg?.image_url;
    if (pkgImageFile) {
      const path = `pkg_${Date.now()}_${pkgImageFile.name}`;
      const { error: upErr } = await supabase.storage.from("topup-qr").upload(path, pkgImageFile, { upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from("topup-qr").getPublicUrl(path);
        imageUrl = publicUrl;
      }
    }
    const payload = { ...pkgForm, image_url: imageUrl };
    if (editPkg) {
      await supabase.from("topup_packages").update(payload).eq("id", editPkg.id);
      toast.success("Package updated");
    } else {
      await supabase.from("topup_packages").insert(payload);
      toast.success("Package added");
    }
    setPkgDialog(false);
    setEditPkg(null);
    setPkgForm({ label: "", price: 0, duration_days: 0, description: "", game_id: "", diamonds: 0, emoji: "💎" } as any);
    setPkgImageFile(null);
    fetchAll();
  };

  const saveTopupGame = async () => {
    if (!gameForm.name) { toast.error("Enter game name"); return; }
    setGameUploading(true);
    let imageUrl: string | undefined = editGame?.image_url;
    if (gameImageFile) {
      const path = `game_${Date.now()}_${gameImageFile.name}`;
      const { error: upErr } = await supabase.storage.from("logo-media").upload(path, gameImageFile, { upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from("logo-media").getPublicUrl(path);
        imageUrl = publicUrl;
      }
    }
    const payload = { name: gameForm.name, emoji: gameForm.emoji, image_url: imageUrl, uid_label: gameForm.uid_label || "Game UID", id_label: gameForm.id_label || "Player ID" };
    if (editGame) {
      await supabase.from("topup_games").update(payload).eq("id", editGame.id);
      toast.success("Game updated");
    } else {
      await supabase.from("topup_games").insert(payload);
      toast.success("Game added");
    }
    setGameDialog(false);
    setEditGame(null);
    setGameForm({ name: "", emoji: "🎮", uid_label: "Game UID", id_label: "Player ID" });
    setGameImageFile(null);
    setGameUploading(false);
    fetchAll();
  };

  const saveChatSettings = async () => {
    const updates = [
      { key: "chat_welcome_message", value: chatSettings.welcome },
      { key: "chat_response_time", value: chatSettings.response_time },
      { key: "chat_enabled", value: chatSettings.enabled },
    ];
    for (const u of updates) {
      await supabase.from("site_settings").update({ value: u.value }).eq("key", u.key);
    }
    toast.success("Chat settings saved!");
  };

  const loadChatMessages = async (sessionId: string) => {
    setActiveChatSession(sessionId);
    const { data } = await supabase.from("chat_messages").select("*").eq("session_id", sessionId).order("created_at");
    setChatMessages(prev => ({ ...prev, [sessionId]: data || [] }));
  };

  const sendAdminReply = async () => {
    if (!chatReply.trim() || !activeChatSession) return;
    await supabase.from("chat_messages").insert({
      session_id: activeChatSession,
      sender_role: "admin",
      content: chatReply.trim(),
    });
    setChatReply("");
    loadChatMessages(activeChatSession);
  };

  const saveServer = async () => {
    if (!serverForm.name) { toast.error("Enter server name"); return; }
    setServerUploading(true);
    let logoUrl: string | undefined = editServer?.logo_url;
    if (serverLogoFile) {
      const path = `server_logo_${Date.now()}.${serverLogoFile.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("logo-media").upload(path, serverLogoFile, { upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from("logo-media").getPublicUrl(path);
        logoUrl = publicUrl;
      }
    }
    const payload = { name: serverForm.name, flag: serverForm.flag, logo_url: logoUrl };
    if (editServer) {
      await supabase.from("topup_servers").update(payload).eq("id", editServer.id);
      toast.success("Server updated");
    } else {
      await supabase.from("topup_servers").insert(payload);
      toast.success("Server added");
    }
    setServerDialog(false);
    setEditServer(null);
    setServerForm({ name: "", flag: "🌐" });
    setServerLogoFile(null);
    setServerUploading(false);
    fetchAll();
  };

  const deleteServer = async (id: string) => {
    await supabase.from("topup_servers").delete().eq("id", id);
    toast.success("Server removed");
    fetchAll();
  };

  const addTopupAdmin = async () => {
    if (!topupAdminEmail.trim()) { toast.error("Enter email"); return; }
    // Find user by email
    const targetUser = users.find(u => u.email.toLowerCase() === topupAdminEmail.toLowerCase());
    if (!targetUser) { toast.error("User not found. Make sure they have an account."); return; }
    const { error } = await supabase.from("topup_admins").insert({ user_id: targetUser.user_id, email: targetUser.email });
    if (error) { toast.error(error.message); return; }
    toast.success(`${targetUser.email} added as Topup Admin!`);
    setTopupAdminDialog(false);
    setTopupAdminEmail("");
    fetchAll();
  };

  const removeTopupAdmin = async (id: string) => {
    await supabase.from("topup_admins").delete().eq("id", id);
    toast.success("Topup admin removed");
    fetchAll();
  };

  const updateTopupStatus = async (id: string, status: string) => {
    await supabase.from("topup_requests").update({ status }).eq("id", id);
    toast.success(`Request marked as ${status}`);
    fetchAll();
  };

  const performReset = async () => {
    if (resetType === "keys" || resetType === "all") {
      // Delete all unused keys and mark used ones
      await supabase.from("keys").delete().eq("is_used", false);
      // Reset product stock to 0
      for (const p of products) {
        await supabase.from("products").update({ stock: 0, duration_prices: {} }).eq("id", p.id);
      }
    }
    if (resetType === "points" || resetType === "all") {
      // Reset all user wallet points to 0
      for (const u of users) {
        await supabase.from("profiles").update({ wallet_points: 0, total_purchases: 0 }).eq("user_id", u.user_id);
      }
    }
    toast.success(`Reset complete: ${resetType === "all" ? "keys + points" : resetType}`);
    setResetDialog(false);
    fetchAll();
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    (u.display_name || "").toLowerCase().includes(searchUser.toLowerCase())
  );

  // Offers CRUD
  const saveOffer = async () => {
    const payload = {
      title: offerForm.title,
      description: offerForm.description || null,
      type: offerForm.type,
      price_points: offerForm.price_points || null,
      duration_days: offerForm.duration_days || null,
      key_code: offerForm.key_code || null,
      is_active: offerForm.is_active,
    };
    if (editOffer) {
      await supabase.from("offers").update(payload).eq("id", editOffer.id);
      toast.success("Offer updated");
    } else {
      await supabase.from("offers").insert(payload);
      toast.success("Offer added!");
    }
    setOfferDialog(false);
    setEditOffer(null);
    setOfferForm({ title: "", description: "", type: "offer", price_points: 0, duration_days: 0, key_code: "", is_active: true });
    fetchAll();
  };

  const deleteOffer = async (id: string) => {
    await supabase.from("offers").delete().eq("id", id);
    toast.success("Offer removed");
    fetchAll();
  };

  const toggleOfferActive = async (o: any) => {
    await supabase.from("offers").update({ is_active: !o.is_active }).eq("id", o.id);
    fetchAll();
  };

  // Logo media upload
  const uploadLogoMedia = async (file: File, type: "image" | "video") => {
    setLogoUploading(true);
    const ext = file.name.split(".").pop();
    const path = `logo_${type}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logo-media").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); setLogoUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("logo-media").getPublicUrl(path);
    const key = type === "image" ? "logo_image_url" : "logo_video_url";
    const { count } = await supabase.from("site_settings").select("*", { count: "exact", head: true }).eq("key", key);
    if (count && count > 0) {
      await supabase.from("site_settings").update({ value: publicUrl }).eq("key", key);
    } else {
      await supabase.from("site_settings").insert({ key, value: publicUrl });
    }
    if (type === "image") setLogoImage(publicUrl); else setLogoVideo(publicUrl);
    toast.success(`Logo ${type} uploaded!`);
    setLogoUploading(false);
  };



  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Total Sales", value: stats.sales, icon: Package },
    { label: "Credits in System", value: `$${stats.points}`, icon: Coins },
    { label: "Stock Remaining", value: stats.stock, icon: Key },
  ];

  // Get available durations for selected product in key dialog
  const selectedKeyProduct = products.find(p => p.id === keyProductId);
  const availableDurations = selectedKeyProduct?.duration_days || [30];

  return (
    <DashboardLayout>
      <AnimatedBackground />
      <div className="space-y-6 relative z-10">
        <motion.div className="flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          {/* Notification Bell */}
          <button
            onClick={() => {
              setPendingNotifCount(0);
              setShowNotifBell(false);
              // Scroll to topup tab
              document.querySelector('[value="topup"]')?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            }}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
            title={`${pendingNotifCount} pending topup request${pendingNotifCount !== 1 ? "s" : ""}`}
          >
            <Bell className={`w-5 h-5 ${showNotifBell ? "text-primary" : "text-muted-foreground"}`} />
            {pendingNotifCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
              >
                {pendingNotifCount > 99 ? "99+" : pendingNotifCount}
              </motion.span>
            )}
          </button>
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
          <TabsList className="flex flex-wrap gap-1 bg-card/50 backdrop-blur-sm h-auto p-1">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="keys">Keys</TabsTrigger>
            <TabsTrigger value="transactions">Txns</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="topup" className="relative" onClick={() => { setPendingNotifCount(0); setShowNotifBell(false); }}>
              Topup
              {pendingNotifCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                  {pendingNotifCount > 9 ? "9+" : pendingNotifCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="chat" className="relative">
              Chat
              {unreadChats > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                  {unreadChats > 9 ? "9+" : unreadChats}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => { setEditProduct(null); setProductForm({ name: "", description: "", price_points: 0, duration_days: "1,3,5,6,7,10,14,15,30", price_usd: "" } as any); setProductFile(null); setProductDialog(true); }}>
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
                        {p.price_points} pts{(p as any).price_usd ? ` · $${(p as any).price_usd}` : ""} · Stock: {p.stock} · Days: {(p.duration_days || [30]).join(", ")}
                        {p.file_url && " · 📎 File"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { 
                        setEditProduct(p); 
                        setProductForm({ name: p.name, description: p.description || "", price_points: p.price_points, duration_days: (p.duration_days || [30]).join(", "), price_usd: (p as any).price_usd || "" } as any); 
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

            {/* Maintenance Mode */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Power className="w-4 h-4" /> Server Controls</h3>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <div>
                    <p className="text-sm font-medium">{maintenanceMode ? "🔴 Site is OFFLINE" : "🟢 Site is ONLINE"}</p>
                    <p className="text-xs text-muted-foreground">Toggle maintenance mode for all users</p>
                  </div>
                  <Button
                    variant={maintenanceMode ? "default" : "destructive"}
                    onClick={toggleMaintenance}
                  >
                    <Power className="w-4 h-4 mr-1" />
                    {maintenanceMode ? "Go Online" : "Go Offline"}
                  </Button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{requireApproval ? "🔐 Login Approval: ON" : "🔓 Login Approval: OFF"}</p>
                    <p className="text-xs text-muted-foreground">
                      {requireApproval ? "New users need admin approval to login" : "All registered users can login freely"}
                    </p>
                  </div>
                  <Button
                    variant={requireApproval ? "default" : "outline"}
                    onClick={toggleRequireApproval}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    {requireApproval ? "Disable" : "Enable"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reset System */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm border-destructive/30">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /> Danger Zone — Reset</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => { setResetType("keys"); setResetDialog(true); }}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Reset All Keys
                  </Button>
                  <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => { setResetType("points"); setResetDialog(true); }}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Reset All Points
                  </Button>
                  <Button variant="destructive" onClick={() => { setResetType("all"); setResetDialog(true); }}>
                    <AlertTriangle className="w-4 h-4 mr-1" /> Reset Everything
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

          {/* OFFERS TAB */}
          <TabsContent value="offers" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => { setEditOffer(null); setOfferForm({ title: "", description: "", type: "offer", price_points: 0, duration_days: 0, key_code: "", is_active: true }); setOfferDialog(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add Offer
              </Button>
              <Button variant="outline" onClick={() => { setEditOffer(null); setOfferForm({ title: "", description: "", type: "free", price_points: 0, duration_days: 0, key_code: "", is_active: true }); setOfferDialog(true); }}>
                <Gift className="w-4 h-4 mr-1" /> Add Free Key
              </Button>
            </div>

            {/* Logo Media Upload */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Image className="w-4 h-4 text-primary" /> Logo Ball Media</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Promo Image</p>
                    {logoImage && <img src={logoImage} alt="Logo" className="w-full h-24 object-cover rounded-lg" />}
                    <Button variant="outline" size="sm" className="w-full" disabled={logoUploading} onClick={() => document.getElementById("logo-img-input")?.click()}>
                      <Image className="w-4 h-4 mr-1" /> {logoUploading ? "Uploading..." : "Upload Image"}
                    </Button>
                    <input id="logo-img-input" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogoMedia(f, "image"); }} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Promo Video</p>
                    {logoVideo && <video src={logoVideo} className="w-full h-24 object-cover rounded-lg" muted />}
                    <Button variant="outline" size="sm" className="w-full" disabled={logoUploading} onClick={() => document.getElementById("logo-vid-input")?.click()}>
                      <Video className="w-4 h-4 mr-1" /> {logoUploading ? "Uploading..." : "Upload Video"}
                    </Button>
                    <input id="logo-vid-input" type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogoMedia(f, "video"); }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {offers.map((o) => (
                <Card key={o.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-4 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={o.type === "free" ? "secondary" : "outline"} className={o.type === "free" ? "bg-success/20 text-success border-0" : ""}>
                          {o.type === "free" ? "🎁 Free" : "🏷️ Offer"}
                        </Badge>
                        <p className="font-medium text-sm truncate">{o.title}</p>
                        {!o.is_active && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {o.price_points ? `${o.price_points} pts` : "Free"} · {o.duration_days ? `${o.duration_days}d` : "—"}
                        {o.key_code ? ` · Key: ${o.key_code.substring(0, 8)}...` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" title={o.is_active ? "Hide" : "Show"} onClick={() => toggleOfferActive(o)}>
                        {o.is_active ? <CheckCircle className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditOffer(o); setOfferForm({ title: o.title, description: o.description || "", type: o.type, price_points: o.price_points || 0, duration_days: o.duration_days || 0, key_code: o.key_code || "", is_active: o.is_active }); setOfferDialog(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteOffer(o.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {offers.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No offers yet. Add one above!</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TOPUP TAB */}
          <TabsContent value="topup" className="space-y-4">
            {/* Topup Settings */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><QrCode className="w-4 h-4 text-primary" /> Topup Settings</h3>
                
                {/* Payment Method Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <div>
                    <p className="text-sm font-medium">Payment Method</p>
                    <p className="text-xs text-muted-foreground">Choose how users pay</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant={topupSettings.payment_method === "qr" ? "default" : "outline"}
                      onClick={() => setTopupSettings(s => ({ ...s, payment_method: "qr" }))}>
                      <QrCode className="w-3 h-3 mr-1" /> QR Pay
                    </Button>
                    <Button size="sm" variant={topupSettings.payment_method === "points" ? "default" : "outline"}
                      onClick={() => setTopupSettings(s => ({ ...s, payment_method: "points" }))}>
                      <CreditCard className="w-3 h-3 mr-1" /> Points
                    </Button>
                  </div>
                </div>

                {/* Currency Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <div>
                    <p className="text-sm font-medium">💱 Price Currency</p>
                    <p className="text-xs text-muted-foreground">Shown on package prices</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant={topupSettings.currency === "USD" ? "default" : "outline"}
                      onClick={() => setTopupSettings(s => ({ ...s, currency: "USD" }))}>
                      $ USD
                    </Button>
                    <Button size="sm" variant={topupSettings.currency === "NPR" ? "default" : "outline"}
                      onClick={() => setTopupSettings(s => ({ ...s, currency: "NPR" }))}>
                      Rs. NPR
                    </Button>
                  </div>
                </div>

                {/* Processing Time */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Processing Time (shown to users)</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. 5-30 minutes"
                      value={topupSettings.processing_time}
                      onChange={(e) => setTopupSettings(s => ({ ...s, processing_time: e.target.value }))}
                      className="bg-background/50"
                    />
                    <Button onClick={saveTopupSettings}>Save All</Button>
                  </div>
                </div>

                {/* Topup Admin Permissions */}
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <p className="text-sm font-medium flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-primary" /> Topup Admin Permissions</p>
                  <p className="text-xs text-muted-foreground">Control what topup admins can do</p>
                  {[
                    { key: "admin_can_view_proofs" as const, label: "Can view payment proofs" },
                    { key: "admin_can_approve" as const, label: "Can approve requests" },
                    { key: "admin_can_reject" as const, label: "Can reject requests" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-background/50 border border-border/30">
                      <span className="text-sm">{label}</span>
                      <Button
                        size="sm"
                        variant={topupSettings[key] === "true" ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={() => setTopupSettings(s => ({ ...s, [key]: s[key] === "true" ? "false" : "true" }))}
                      >
                        {topupSettings[key] === "true" ? "✅ ON" : "❌ OFF"}
                      </Button>
                    </div>
                  ))}
                </div>

                {/* QR Upload — 3 options */}
                {topupSettings.payment_method === "qr" && (
                  <div className="space-y-3 pt-2 border-t border-border/30">
                    <label className="text-sm text-muted-foreground font-medium">Payment QR Codes (eSewa, Khalti, Bank)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(["esewa", "khalti", "bank"] as const).map((type) => {
                        const labels = { esewa: "eSewa", khalti: "Khalti", bank: "Bank Transfer" };
                        const colors = { esewa: "text-green-500", khalti: "text-purple-500", bank: "text-blue-500" };
                        const qrUrl = topupSettings[`${type}_qr_url` as keyof typeof topupSettings] as string;
                        return (
                          <div key={type} className="space-y-2 text-center">
                            <p className={`text-xs font-medium ${colors[type]}`}>{labels[type]}</p>
                            {qrUrl && (
                              <img src={qrUrl} alt={`${type} QR`} className="w-24 h-24 object-contain mx-auto rounded-lg border border-border/50 bg-white p-1" />
                            )}
                            <Button variant="outline" size="sm" className="w-full text-xs" disabled={qrUploading === type}
                              onClick={() => document.getElementById(`qr-input-${type}`)?.click()}>
                              <Upload className="w-3 h-3 mr-1" />
                              {qrUploading === type ? "Uploading..." : (qrUrl ? "Replace" : "Upload")}
                            </Button>
                            <input id={`qr-input-${type}`} type="file" accept="image/*" className="hidden"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadTopupQr(f, type); }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Games Management */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Gamepad2 className="w-4 h-4 text-primary" /> Games</h3>
                  <Button size="sm" onClick={() => { setEditGame(null); setGameForm({ name: "", emoji: "🎮", uid_label: "Game UID", id_label: "Player ID" }); setGameImageFile(null); setGameDialog(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add Game
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Add game titles — packages will be grouped under each game.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {topupGames.map((game) => (
                    <div key={game.id} className="p-3 rounded-lg bg-background/50 border border-border/30 text-center relative group">
                      {game.image_url
                        ? <img src={game.image_url} alt={game.name} className="w-10 h-10 object-contain mx-auto mb-1 rounded-lg" />
                        : <span className="text-3xl block mb-1">{game.emoji || "🎮"}</span>}
                      <p className="text-xs font-medium truncate">{game.name}</p>
                      <div className="absolute top-1 right-1 gap-0.5 hidden group-hover:flex">
                        <button onClick={() => { setEditGame(game); setGameForm({ name: game.name, emoji: game.emoji || "🎮", uid_label: game.uid_label || "Game UID", id_label: game.id_label || "Player ID" }); setGameImageFile(null); setGameDialog(true); }}
                          className="p-0.5 rounded bg-card/80 text-muted-foreground hover:text-foreground"><Edit className="w-3 h-3" /></button>
                        <button onClick={async () => { await supabase.from("topup_games").delete().eq("id", game.id); fetchAll(); }}
                          className="p-0.5 rounded bg-card/80 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                  {topupGames.length === 0 && <p className="col-span-3 text-center text-muted-foreground text-xs py-3">No games yet.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Servers Management */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Server className="w-4 h-4 text-primary" /> Game Servers</h3>
                  <Button size="sm" onClick={() => { setEditServer(null); setServerForm({ name: "", flag: "🌐" }); setServerLogoFile(null); setServerDialog(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add Server
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {topupServers.map((srv) => (
                    <div key={srv.id} className="p-3 rounded-lg bg-background/50 border border-border/30 text-center relative group">
                      {srv.logo_url ? (
                        <img src={srv.logo_url} alt={srv.name} className="w-8 h-8 object-contain mx-auto mb-1 rounded" />
                      ) : (
                        <span className="text-2xl block mb-1">{srv.flag || "🌐"}</span>
                      )}
                      <p className="text-xs font-medium truncate">{srv.name}</p>
                      <div className="absolute top-1 right-1 gap-0.5 hidden group-hover:flex">
                        <button onClick={() => { setEditServer(srv); setServerForm({ name: srv.name, flag: srv.flag || "🌐" }); setServerLogoFile(null); setServerDialog(true); }}
                          className="p-0.5 rounded bg-card/80 text-muted-foreground hover:text-foreground">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteServer(srv.id)}
                          className="p-0.5 rounded bg-card/80 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {topupServers.length === 0 && (
                    <p className="col-span-3 text-center text-muted-foreground text-xs py-3">No servers added yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Topup Packages */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Packages</h3>
                  <Button size="sm" onClick={() => { setEditPkg(null); setPkgForm({ label: "", price: 0, duration_days: 0, description: "" }); setPkgImageFile(null); setPkgDialog(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {topupPackages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                      {pkg.image_url ? (
                        <img src={pkg.image_url} alt={pkg.label} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-primary/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{pkg.label}</p>
                        <p className="text-xs text-muted-foreground">${pkg.price} · {pkg.duration_days}d</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => { setEditPkg(pkg); setPkgForm({ label: pkg.label, price: pkg.price, duration_days: pkg.duration_days || 0, description: pkg.description || "" }); setPkgImageFile(null); setPkgDialog(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                         <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("topup_packages").delete().eq("id", pkg.id); fetchAll(); }}>
                           <Trash2 className="w-4 h-4 text-destructive" />
                         </Button>
                       </div>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>

            {/* Topup Requests */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Coins className="w-4 h-4 text-primary" /> Payment Requests ({topupRequests.filter(r => r.status === "pending").length} pending)</h3>
                <div className="space-y-2">
                  {topupRequests.map((req) => {
                    const userInfo = users.find(u => u.user_id === req.user_id);
                    return (
                      <div key={req.id} className={`p-3 rounded-lg border ${req.status === "pending" ? "border-warning/40 bg-warning/5" : req.status === "approved" ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={req.status === "pending" ? "outline" : req.status === "approved" ? "default" : "destructive"} className="text-xs">
                                {req.status}
                              </Badge>
                              {req.fake_score >= 50 && (
                                <Badge variant="destructive" className="text-xs">⚠️ Suspicious</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="font-medium text-sm mt-1">
                               UID: <span className="font-mono">{req.game_uid}</span>
                               {req.game_name && req.game_name !== `User@${req.game_uid}` && (
                                 <span className="text-primary ml-2 font-semibold">🎮 {req.game_name}</span>
                               )}
                             </p>
                             <p className="text-xs text-muted-foreground">{req.duration_label} · {topupSettings.currency === "NPR" ? "Rs." : "$"}{req.amount_paid}</p>
                             {req.server_name && <p className="text-xs text-muted-foreground">Server: {req.server_name}</p>}
                             {userInfo && <p className="text-xs text-muted-foreground">User: {userInfo.email}</p>}
                             {req.payment_method && <p className="text-xs text-muted-foreground">Payment: {req.payment_method.replace("qr_", "").toUpperCase()}</p>}
                           </div>
                           <div className="flex gap-1 shrink-0 flex-col">
                             {req.payment_proof_url && topupSettings.admin_can_view_proofs === "true" && (
                               <Button variant="ghost" size="icon" title="View proof" onClick={() => viewProof(req.payment_proof_url)}>
                                 {proofViewLoading ? <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            )}
                            {req.status === "pending" && (
                              <>
                                <Button variant="ghost" size="icon" title="Approve" onClick={() => updateTopupStatus(req.id, "approved")}>
                                  <CheckCircle className="w-4 h-4 text-success" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Reject" onClick={() => updateTopupStatus(req.id, "rejected")}>
                                  <XCircle className="w-4 h-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {topupRequests.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-6">No topup requests yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Topup Admins */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4 text-primary" /> Topup Admins</h3>
                  <Button size="sm" onClick={() => { setTopupAdminEmail(""); setTopupAdminDialog(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Topup admins can view/approve payment requests but cannot change products, prices, or QR codes.</p>
                <div className="space-y-2">
                  {topupAdmins.map((ta) => (
                    <div key={ta.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                      <div>
                        <p className="text-sm font-medium">{ta.email}</p>
                        <p className="text-xs text-muted-foreground">Added {new Date(ta.created_at).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeTopupAdmin(ta.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {topupAdmins.length === 0 && (
                    <p className="text-center text-muted-foreground text-xs py-2">No topup admins yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CHAT TAB */}
          <TabsContent value="chat" className="space-y-4">
            {/* Chat Settings */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" /> Live Chat Settings</h3>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Welcome Message</label>
                  <Input value={chatSettings.welcome} onChange={(e) => setChatSettings(s => ({ ...s, welcome: e.target.value }))} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Response Time (shown to users)</label>
                  <Input value={chatSettings.response_time} onChange={(e) => setChatSettings(s => ({ ...s, response_time: e.target.value }))} className="bg-background/50" placeholder="e.g. 5-15 minutes" />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-border/30">
                  <div>
                    <p className="text-sm font-medium">Live Chat {chatSettings.enabled === "true" ? "🟢 Enabled" : "🔴 Disabled"}</p>
                    <p className="text-xs text-muted-foreground">Toggle chat widget for all users</p>
                  </div>
                  <Button size="sm" variant={chatSettings.enabled === "true" ? "default" : "outline"}
                    onClick={() => setChatSettings(s => ({ ...s, enabled: s.enabled === "true" ? "false" : "true" }))}>
                    {chatSettings.enabled === "true" ? "Disable" : "Enable"}
                  </Button>
                </div>
                <Button onClick={saveChatSettings}><CheckCircle className="w-4 h-4 mr-1" /> Save Settings</Button>
              </CardContent>
            </Card>

            {/* Chat Sessions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm">Conversations ({chatSessions.length})</h3>
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {chatSessions.map((session) => (
                      <button key={session.id} onClick={() => loadChatMessages(session.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${activeChatSession === session.id ? "border-primary bg-primary/10" : "border-border/30 bg-background/50 hover:border-primary/40"}`}>
                        <p className="text-sm font-medium truncate">{session.user_email}</p>
                        <p className="text-xs text-muted-foreground">{new Date(session.created_at).toLocaleDateString()}</p>
                      </button>
                    ))}
                    {chatSessions.length === 0 && <p className="text-center text-muted-foreground text-xs py-4">No chats yet.</p>}
                  </div>
                </CardContent>
              </Card>

              {activeChatSession && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm flex flex-col" style={{ maxHeight: "400px" }}>
                  <CardContent className="p-3 flex flex-col h-full gap-2">
                    <h3 className="font-semibold text-sm shrink-0">Reply</h3>
                    <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                      {(chatMessages[activeChatSession] || []).map((msg) => (
                        <div key={msg.id} className={`flex gap-2 ${msg.sender_role === "admin" ? "flex-row-reverse" : ""}`}>
                          <div className={`rounded-xl px-3 py-2 max-w-[80%] text-sm ${msg.sender_role === "admin" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Input value={chatReply} onChange={(e) => setChatReply(e.target.value)} placeholder="Type reply..." className="text-sm h-9"
                        onKeyDown={(e) => e.key === "Enter" && sendAdminReply()} />
                      <Button size="icon" className="h-9 w-9 shrink-0" onClick={sendAdminReply} disabled={!chatReply.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Price (Points)</label>
                  <Input type="number" placeholder="Points" value={productForm.price_points} onChange={(e) => setProductForm({ ...productForm, price_points: parseInt(e.target.value) || 0 })} className="bg-background/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Price (USD $)</label>
                  <Input type="number" placeholder="0.00" step="0.01" value={(productForm as any).price_usd || ""} onChange={(e) => setProductForm({ ...productForm, price_usd: e.target.value } as any)} className="bg-background/50" />
                </div>
              </div>
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

        {/* Reset Confirm Dialog */}
        <Dialog open={resetDialog} onOpenChange={setResetDialog}>
          <DialogContent className="bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>⚠️ Reset {resetType === "all" ? "Everything" : resetType === "keys" ? "All Keys" : "All Points"}</DialogTitle>
              <DialogDescription>
                {resetType === "keys" && "This will delete all unused keys and reset product stock to 0."}
                {resetType === "points" && "This will reset all user wallet points and purchase counts to 0."}
                {resetType === "all" && "This will delete all unused keys, reset stock to 0, AND reset all user points to 0. This cannot be undone!"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={performReset}>Yes, Reset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Offer Dialog */}
        <Dialog open={offerDialog} onOpenChange={setOfferDialog}>
          <DialogContent className="bg-card/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editOffer ? "Edit Offer" : offerForm.type === "free" ? "Add Free Key" : "Add Offer"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button size="sm" variant={offerForm.type === "offer" ? "default" : "outline"} onClick={() => setOfferForm({ ...offerForm, type: "offer" })}>
                  <Tag className="w-3 h-3 mr-1" /> Offer
                </Button>
                <Button size="sm" variant={offerForm.type === "free" ? "default" : "outline"} onClick={() => setOfferForm({ ...offerForm, type: "free" })}>
                  <Gift className="w-3 h-3 mr-1" /> Free Key
                </Button>
              </div>
              <Input placeholder="Title *" value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} className="bg-background/50" />
              <Input placeholder="Description (optional)" value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} className="bg-background/50" />
              {offerForm.type === "offer" && (
                <Input type="number" placeholder="Price (points)" value={offerForm.price_points} onChange={(e) => setOfferForm({ ...offerForm, price_points: parseInt(e.target.value) || 0 })} className="bg-background/50" />
              )}
              <Input type="number" placeholder="Duration (days)" value={offerForm.duration_days} onChange={(e) => setOfferForm({ ...offerForm, duration_days: parseInt(e.target.value) || 0 })} className="bg-background/50" />
              {offerForm.type === "free" && (
                <Input placeholder="Key Code (optional)" value={offerForm.key_code} onChange={(e) => setOfferForm({ ...offerForm, key_code: e.target.value })} className="bg-background/50 font-mono" />
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="offer-active" checked={offerForm.is_active} onChange={(e) => setOfferForm({ ...offerForm, is_active: e.target.checked })} />
                <label htmlFor="offer-active" className="text-sm">Active (visible to users)</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOfferDialog(false)}>Cancel</Button>
              <Button onClick={saveOffer} disabled={!offerForm.title}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Topup Package Dialog */}
        <Dialog open={pkgDialog} onOpenChange={setPkgDialog}>
          <DialogContent className="bg-card/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editPkg ? "Edit Package" : "Add Package"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Game (optional)</label>
                <select className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm"
                  value={(pkgForm as any).game_id || ""} onChange={(e) => setPkgForm({ ...pkgForm, game_id: e.target.value } as any)}>
                  <option value="">— No specific game —</option>
                  {topupGames.map(g => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}
                </select>
              </div>
              <Input placeholder="Label (e.g. Weekly Lite)" value={pkgForm.label} onChange={(e) => setPkgForm({ ...pkgForm, label: e.target.value })} className="bg-background/50" />
              <Input placeholder="Description (optional)" value={pkgForm.description} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} className="bg-background/50" />
              <Input type="number" placeholder="Price (NPR/USD)" value={pkgForm.price} onChange={(e) => setPkgForm({ ...pkgForm, price: Number(e.target.value) })} className="bg-background/50" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Emoji (e.g. 💎)</label>
                  <Input placeholder="💎" value={(pkgForm as any).emoji || "💎"} onChange={(e) => setPkgForm({ ...pkgForm, emoji: e.target.value } as any)} className="bg-background/50 text-lg" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Diamonds / Amount</label>
                  <Input type="number" placeholder="100" value={(pkgForm as any).diamonds || ""} onChange={(e) => setPkgForm({ ...pkgForm, diamonds: Number(e.target.value) } as any)} className="bg-background/50" />
                </div>
              </div>
              <Input type="number" placeholder="Duration (days)" value={pkgForm.duration_days} onChange={(e) => setPkgForm({ ...pkgForm, duration_days: Number(e.target.value) })} className="bg-background/50" />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Product Image (optional)</label>
                <div className="flex items-center gap-2">
                  {(pkgImageFile ? URL.createObjectURL(pkgImageFile) : editPkg?.image_url) && (
                    <img src={pkgImageFile ? URL.createObjectURL(pkgImageFile) : editPkg?.image_url} alt="pkg" className="w-12 h-12 object-cover rounded-lg" />
                  )}
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("pkg-img-input")?.click()}>
                    <Image className="w-3 h-3 mr-1" /> {pkgImageFile ? pkgImageFile.name.substring(0, 15) + "..." : "Upload Image"}
                  </Button>
                  <input id="pkg-img-input" type="file" accept="image/*" className="hidden" onChange={(e) => setPkgImageFile(e.target.files?.[0] || null)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPkgDialog(false)}>Cancel</Button>
              <Button onClick={saveTopupPackage}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Game Dialog */}
        <Dialog open={gameDialog} onOpenChange={setGameDialog}>
          <DialogContent className="bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>{editGame ? "Edit Game" : "Add Game"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Game Name (e.g. Free Fire)" value={gameForm.name} onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })} className="bg-background/50" />
              <Input placeholder="Emoji (e.g. 🔫)" value={gameForm.emoji} onChange={(e) => setGameForm({ ...gameForm, emoji: e.target.value })} className="bg-background/50 text-lg" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">UID Field Label</label>
                  <Input placeholder="Game UID" value={gameForm.uid_label || "Game UID"} onChange={(e) => setGameForm({ ...gameForm, uid_label: e.target.value })} className="bg-background/50" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">ID Field Label</label>
                  <Input placeholder="Player ID" value={gameForm.id_label || "Player ID"} onChange={(e) => setGameForm({ ...gameForm, id_label: e.target.value })} className="bg-background/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Game Image (optional, replaces emoji)</label>
                <div className="flex items-center gap-2">
                  {(gameImageFile ? URL.createObjectURL(gameImageFile) : editGame?.image_url) && (
                    <img src={gameImageFile ? URL.createObjectURL(gameImageFile) : editGame?.image_url} alt="game" className="w-10 h-10 object-contain rounded-lg" />
                  )}
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("game-img-input")?.click()}>
                    <Upload className="w-3 h-3 mr-1" /> Upload Image
                  </Button>
                  <input id="game-img-input" type="file" accept="image/*" className="hidden" onChange={(e) => setGameImageFile(e.target.files?.[0] || null)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGameDialog(false)}>Cancel</Button>
              <Button onClick={saveTopupGame} disabled={gameUploading}>{gameUploading ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Server Dialog */}
        <Dialog open={serverDialog} onOpenChange={setServerDialog}>
          <DialogContent className="bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>{editServer ? "Edit Server" : "Add Server"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Server Name (e.g. BD Server)" value={serverForm.name} onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })} className="bg-background/50" />
              <Input placeholder="Flag emoji (e.g. 🇧🇩)" value={serverForm.flag} onChange={(e) => setServerForm({ ...serverForm, flag: e.target.value })} className="bg-background/50 text-lg" />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Server Logo (optional, replaces emoji)</label>
                <div className="flex items-center gap-2">
                  {(serverLogoFile ? URL.createObjectURL(serverLogoFile) : editServer?.logo_url) && (
                    <img src={serverLogoFile ? URL.createObjectURL(serverLogoFile) : editServer?.logo_url} alt="logo" className="w-10 h-10 object-contain rounded-lg" />
                  )}
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("server-logo-input")?.click()}>
                    <Upload className="w-3 h-3 mr-1" /> Upload Logo
                  </Button>
                  <input id="server-logo-input" type="file" accept="image/*" className="hidden" onChange={(e) => setServerLogoFile(e.target.files?.[0] || null)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setServerDialog(false)}>Cancel</Button>
              <Button onClick={saveServer} disabled={serverUploading}>{serverUploading ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Topup Admin Dialog */}
        <Dialog open={topupAdminDialog} onOpenChange={setTopupAdminDialog}>
          <DialogContent className="bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Add Topup Admin</DialogTitle>
              <DialogDescription>
                Enter the email of a registered user to give them topup admin access. They can view and approve/reject payment requests only.
              </DialogDescription>
            </DialogHeader>
            <Input placeholder="user@email.com" value={topupAdminEmail} onChange={(e) => setTopupAdminEmail(e.target.value)} className="bg-background/50" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setTopupAdminDialog(false)}>Cancel</Button>
              <Button onClick={addTopupAdmin}>Add Topup Admin</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Proof View Dialog */}
        <Dialog open={!!proofViewUrl || proofViewLoading} onOpenChange={() => { setProofViewUrl(null); setProofViewLoading(false); }}>
          <DialogContent className="bg-card/95 backdrop-blur-xl max-w-xl">
            <DialogHeader>
              <DialogTitle>Payment Proof</DialogTitle>
            </DialogHeader>
            {proofViewLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <span className="ml-3 text-muted-foreground text-sm">Loading image...</span>
              </div>
            ) : proofViewUrl ? (
              <div className="space-y-3">
                <img src={proofViewUrl} alt="Payment proof" className="w-full max-h-96 object-contain rounded-lg border border-border/50" />
                <Button variant="outline" className="w-full" onClick={() => window.open(proofViewUrl, "_blank")}>
                  <ExternalLink className="w-4 h-4 mr-1" /> Open Full Image
                </Button>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Admin;


