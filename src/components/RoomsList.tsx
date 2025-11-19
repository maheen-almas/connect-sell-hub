import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { authHelpers } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface RoomsListProps {
  role: "admin" | "worker";
}

const RoomsList = ({ role }: RoomsListProps) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const profile = await authHelpers.getUserProfile();
      if (!profile) return;

      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .or(`admin_id.eq.${profile.id},worker_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading rooms...</div>;
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {role === "admin" ? "No rooms created yet. Create one to get started!" : "No rooms assigned yet. Wait for admin to create a room."}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{room.name}</h3>
              <p className="text-sm text-muted-foreground">
                Created {new Date(room.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button onClick={() => navigate(`/room/${room.id}`)}>Open Chat</Button>
        </div>
      ))}
    </div>
  );
};

export default RoomsList;
