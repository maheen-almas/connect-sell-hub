import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { authHelpers, UserProfile } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Plus, MessageSquare } from "lucide-react";
import CreateRoomDialog from "@/components/CreateRoomDialog";
import SalesChart from "@/components/SalesChart";
import RoomsList from "@/components/RoomsList";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userProfile = await authHelpers.getUserProfile();
      if (!userProfile || userProfile.role !== "admin") {
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
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">ID: {profile?.id}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Welcome, Admin</h2>
            <p className="text-muted-foreground mt-1">Manage rooms and track sales performance</p>
          </div>
          <Button onClick={() => setShowCreateRoom(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Room
          </Button>
        </div>

        <SalesChart />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Communication Rooms
            </CardTitle>
            <CardDescription>Click on a room to start chatting</CardDescription>
          </CardHeader>
          <CardContent>
            <RoomsList role="admin" />
          </CardContent>
        </Card>
      </main>

      <CreateRoomDialog
        open={showCreateRoom}
        onOpenChange={setShowCreateRoom}
        adminId={profile?.id || ""}
      />
    </div>
  );
};

export default AdminDashboard;
