import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authHelpers } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  senderId: string;
}

const FileUploadDialog = ({ open, onOpenChange, roomId, senderId }: FileUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [salesAmount, setSalesAmount] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isWorker, setIsWorker] = useState(false);

  useState(async () => {
    const profile = await authHelpers.getUserProfile();
    setIsWorker(profile?.role === "worker");
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${senderId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: messageError } = await supabase.from("messages").insert({
        room_id: roomId,
        sender_id: senderId,
        message_type: "file",
        file_name: file.name,
        file_path: filePath,
        file_mimetype: file.type,
        sales_amount: salesAmount ? parseFloat(salesAmount) : null,
      });

      if (messageError) throw messageError;

      toast.success("File uploaded successfully!");
      setFile(null);
      setSalesAmount("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>Upload a file to share in this room</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          {isWorker && (
            <div className="space-y-2">
              <Label htmlFor="sales">Sales Amount (Optional)</Label>
              <Input
                id="sales"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={salesAmount}
                onChange={(e) => setSalesAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the sales amount if this file is a sales report
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !file}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;
