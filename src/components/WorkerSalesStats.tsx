import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, FileText } from "lucide-react";

interface WorkerSalesStatsProps {
  workerId: string;
}

const WorkerSalesStats = ({ workerId }: WorkerSalesStatsProps) => {
  const [stats, setStats] = useState({ totalSales: 0, fileCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [workerId]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("sales_amount")
        .eq("sender_id", workerId)
        .eq("message_type", "file");

      if (error) throw error;

      const totalSales = (data || []).reduce(
        (sum, msg) => sum + (Number(msg.sales_amount) || 0),
        0
      );

      setStats({
        totalSales,
        fileCount: data?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">${stats.totalSales.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">Your total sales contributions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Files Uploaded</CardTitle>
          <FileText className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.fileCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Total files shared</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkerSalesStats;
