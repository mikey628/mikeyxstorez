import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading, isAdmin, profile } = useAuth();
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const [requireApproval, setRequireApproval] = useState<boolean | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["maintenance_mode", "require_approval"])
      .then(({ data }) => {
        let mMode = false;
        let reqApproval = true;
        (data || []).forEach((s: any) => {
          if (s.key === "maintenance_mode") mMode = s.value === "true";
          if (s.key === "require_approval") reqApproval = s.value !== "false";
        });
        setMaintenance(mMode);
        setRequireApproval(reqApproval);
      });
  }, []);

  if (loading || maintenance === null || requireApproval === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // If maintenance mode is on and user is NOT admin, show maintenance page
  if (maintenance && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">🔧</div>
          <h1 className="text-2xl font-bold text-foreground">Under Maintenance</h1>
          <p className="text-muted-foreground max-w-md">
            We're currently performing maintenance. Please check back soon!
          </p>
        </div>
      </div>
    );
  }

  // If approval is required and user is NOT approved and NOT admin
  if (requireApproval && profile && !profile.is_approved && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">⏳</div>
          <h1 className="text-2xl font-bold text-foreground">Pending Approval</h1>
          <p className="text-muted-foreground max-w-md">
            Your account is pending admin approval. Please wait or contact the admin.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
