import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { authHelpers } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import { toast } from "sonner";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [roomId]);

  const checkAccess = async () => {
    try {
      const profile = await authHelpers.getUserProfile();
      if (!profile) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(profile.id);

      const { data: roomData, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error || !roomData) {
        toast.error("Room not found");
        navigate(profile.role === "admin" ? "/admin" : "/worker");
        return;
      }

      if (roomData.admin_id !== profile.id && roomData.worker_id !== profile.id) {
        toast.error("Access denied");
        navigate(profile.role === "admin" ? "/admin" : "/worker");
        return;
      }

      setRoom(roomData);
    } catch (error) {
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    const profile = await authHelpers.getUserProfile();
    navigate(profile?.role === "admin" ? "/admin" : "/worker");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{room?.name}</h1>
            <p className="text-sm text-muted-foreground">Room ID: {room?.id}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4">
        <ChatInterface roomId={roomId!} currentUserId={currentUserId} />
      </main>
    </div>
  );
};

export default Room;
