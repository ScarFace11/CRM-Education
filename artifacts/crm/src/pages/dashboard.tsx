import { useGetDashboardSummary, useGetMe } from "@workspace/api-client-react";
import { Users, KanbanSquare, DollarSign, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

export default function Dashboard() {
  // Call useGetMe once to JIT-provision the user/org if not already done
  useGetMe();
  
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl w-full" />
      </div>
    );
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  const stats = [
    {
      title: "Total Families",
      value: summary?.totalContacts || 0,
      icon: Users,
      description: "Active contacts in your rolodex",
    },
    {
      title: "Open Enrollments",
      value: summary?.openDeals || 0,
      icon: KanbanSquare,
      description: "Families currently in pipeline",
    },
    {
      title: "Pipeline Value",
      value: formatter.format(summary?.totalPipelineValue || 0),
      icon: DollarSign,
      description: "Total potential tuition",
    },
    {
      title: "Enrolled This Month",
      value: summary?.dealsWonThisMonth || 0,
      icon: CheckCircle2,
      description: "Successfully closed deals",
    },
    {
      title: "Tasks Due Today",
      value: summary?.tasksDueToday || 0,
      icon: Clock,
      description: "Actions requiring attention",
    },
    {
      title: "Overdue Tasks",
      value: summary?.tasksOverdue || 0,
      icon: AlertCircle,
      description: "Tasks that need immediate follow-up",
      alert: (summary?.tasksOverdue || 0) > 0,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-semibold text-foreground tracking-tight mb-2">Overview</h1>
        <p className="text-muted-foreground">Here's what's happening at your school today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className={`border border-border shadow-sm hover-elevate transition-all ${stat.alert ? 'border-destructive/50 bg-destructive/5' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.alert ? 'text-destructive' : 'text-primary opacity-80'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-semibold tracking-tight ${stat.alert ? 'text-destructive' : 'text-foreground'}`}>
                {stat.value}
              </div>
              <p className={`text-xs mt-1 ${stat.alert ? 'text-destructive/80' : 'text-muted-foreground'}`}>
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-serif font-semibold mb-4 text-foreground">Pipeline Breakdown</h2>
        {summary?.dealsByStage && summary.dealsByStage.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summary.dealsByStage.map((stage) => (
              <Card key={stage.stageId} className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">{stage.stageName}</div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-semibold">{stage.count} <span className="text-sm font-normal text-muted-foreground ml-1">families</span></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">{formatter.format(stage.value)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border border-dashed bg-secondary/30">
            <CardContent className="p-8 text-center text-muted-foreground">
              <KanbanSquare className="mx-auto h-8 w-8 opacity-20 mb-3" />
              <p>No pipeline data yet. Start tracking enrollments to see your breakdown.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
