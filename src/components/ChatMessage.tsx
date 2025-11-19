import { File, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: any;
  isOwn: boolean;
}

const ChatMessage = ({ message, isOwn }: ChatMessageProps) => {
  const handleDownload = async () => {
    if (!message.file_path) return;

    try {
      const { data, error } = await supabase.storage
        .from("chat-files")
        .download(message.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = message.file_name || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("File downloaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to download file");
    }
  };

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg p-3",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {message.message_type === "text" ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4" />
              <span className="font-medium text-sm">{message.file_name}</span>
            </div>
            {message.sales_amount && (
              <div className="text-sm font-semibold bg-success/20 text-success-foreground px-2 py-1 rounded">
                Sales: ${Number(message.sales_amount).toFixed(2)}
              </div>
            )}
            <Button
              variant={isOwn ? "secondary" : "default"}
              size="sm"
              onClick={handleDownload}
              className="w-full"
            >
              <Download className="h-3 w-3 mr-2" />
              Download
            </Button>
          </div>
        )}
        <p className="text-xs mt-2 opacity-70">
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
