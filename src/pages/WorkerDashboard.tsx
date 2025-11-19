import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authHelpers, UserProfile } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, MessageSquare, TrendingUp } from "lucide-react";
import RoomsList from "@/components/RoomsList";
import WorkerSalesStats from "@/components/WorkerSalesStats";
import CopyableId from "@/components/CopyableId";

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userProfile = await authHelpers.getUserProfile();
      if (!userProfile || userProfile.role !== "worker") {
        navigate("/auth");
        return;
      }
      setProfile(userProfile);
    } catch (error) {
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authHelpers.signOut();
    navigate("/auth");
    toast.success("Signed out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Worker Dashboard</h1>
            <div className="mt-2 max-w-md">
              <CopyableId id={profile?.id || ""} label="Your Worker ID (Share this with admin)" />
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Welcome, Worker</h2>
          <p className="text-muted-foreground mt-1">View your assigned rooms and track your sales</p>
        </div>

        <WorkerSalesStats workerId={profile?.id || ""} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              My Rooms
            </CardTitle>
            <CardDescription>Click on a room to start chatting with admin</CardDescription>
          </CardHeader>
          <CardContent>
            <RoomsList role="worker" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WorkerDashboard;
