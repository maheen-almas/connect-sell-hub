import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Users, MessageSquare, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground">Sales Tracker</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time role-based communication and sales tracking platform for teams
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="mt-4">
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-Time Chat</h3>
            <p className="text-muted-foreground">
              Instant messaging between admins and workers with file sharing capabilities
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Sales Tracking</h3>
            <p className="text-muted-foreground">
              Track and visualize sales performance with detailed analytics and charts
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Role Management</h3>
            <p className="text-muted-foreground">
              Separate dashboards for admins and workers with role-specific features
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
