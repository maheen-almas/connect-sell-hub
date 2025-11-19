import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string;
}

const CreateRoomDialog = ({ open, onOpenChange, adminId }: CreateRoomDialogProps) => {
  const [workerId, setWorkerId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Verify worker exists
      const { data: worker, error: workerError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("user_id", workerId)
        .eq("role", "worker")
        .single();

      if (workerError || !worker) {
        toast.error("Worker ID not found or user is not a worker");
        setIsCreating(false);
        return;
      }

      // Create room with unique name
      const roomName = `admin_${adminId.slice(0, 8)}_worker_${workerId.slice(0, 8)}`;

      const { error: roomError } = await supabase.from("rooms").insert({
        name: roomName,
        admin_id: adminId,
        worker_id: workerId,
      });

      if (roomError) {
        if (roomError.code === "23505") {
          toast.error("Room already exists with this worker");
        } else {
          throw roomError;
        }
        setIsCreating(false);
        return;
      }

      toast.success("Room created successfully!");
      setWorkerId("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>Enter the worker ID to create a communication room</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workerId">Worker ID</Label>
            <Input
              id="workerId"
              placeholder="Enter worker's user ID"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Workers can find their ID on their dashboard
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;
