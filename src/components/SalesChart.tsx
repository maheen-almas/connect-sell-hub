import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign } from "lucide-react";

const SalesChart = () => {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      const { data, error } = await supabase.rpc("get_worker_sales_stats");

      if (error) throw error;

      const chartData = (data || []).map((worker: any) => ({
        email: worker.worker_email.split("@")[0],
        sales: Number(worker.total_sales),
        files: Number(worker.file_count),
      }));

      setSalesData(chartData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p>Loading sales data...</p>
        </CardContent>
      </Card>
    );
  }

  const totalSales = salesData.reduce((sum, worker) => sum + worker.sales, 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success" />
            Total Sales
          </CardTitle>
          <CardDescription>Aggregated sales across all workers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-success">${totalSales.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground mt-2">
            From {salesData.length} worker{salesData.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Worker Performance
          </CardTitle>
          <CardDescription>Sales and file uploads by worker</CardDescription>
        </CardHeader>
        <CardContent>
          {salesData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No sales data available yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="email" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="hsl(var(--success))" name="Sales ($)" />
                <Bar dataKey="files" fill="hsl(var(--primary))" name="Files" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesChart;
