import { ClipboardList, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
  const stats = [
    {
      name: "Total Tasks",
      value: "248",
      change: "+12%",
      changeType: "increase",
      icon: ClipboardList,
      color: "text-blue-500",
    },
    {
      name: "Completed",
      value: "189",
      change: "+8%",
      changeType: "increase",
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      name: "In Progress",
      value: "42",
      change: "+5%",
      changeType: "increase",
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      name: "Overdue",
      value: "17",
      change: "-3%",
      changeType: "decrease",
      icon: AlertCircle,
      color: "text-red-500",
    },
  ];

  const recentTasks = [
    {
      id: 1,
      title: "Update user authentication flow",
      status: "In Progress",
      priority: "High",
      assignee: "John Doe",
      dueDate: "2026-06-05",
    },
    {
      id: 2,
      title: "Design new dashboard layout",
      status: "Completed",
      priority: "Medium",
      assignee: "Jane Smith",
      dueDate: "2026-06-03",
    },
    {
      id: 3,
      title: "Fix responsive issues on mobile",
      status: "In Progress",
      priority: "High",
      assignee: "Mike Johnson",
      dueDate: "2026-06-04",
    },
    {
      id: 4,
      title: "Write API documentation",
      status: "To Do",
      priority: "Low",
      assignee: "Sarah Williams",
      dueDate: "2026-06-10",
    },
    {
      id: 5,
      title: "Optimize database queries",
      status: "In Progress",
      priority: "Medium",
      assignee: "Alex Brown",
      dueDate: "2026-06-06",
    },
  ];

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "High":
        return "destructive" as const;
      case "Medium":
        return "secondary" as const;
      case "Low":
        return "outline" as const;
      default:
        return "ghost" as const;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Completed":
        return "default" as const;
      case "In Progress":
        return "secondary" as const;
      case "To Do":
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back! Here&apos;s an overview of your tasks.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {/* <p
                  className={`text-xs ${
                    stat.changeType === "increase"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stat.change} from last month
                </p> */}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Tasks</CardTitle>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Task</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Priority</TableHead>
                <TableHead className="font-bold">Assignee</TableHead>
                <TableHead className="font-bold text-right">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(task.status)}
                      className="text-xs"
                    >
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getPriorityVariant(task.priority)}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{task.assignee}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-[#2d5a4c] text-white border-[#2d5a4c]">
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/80 mb-4">
              Quickly add a new task to your workflow
            </p>
            <Button variant="secondary" size="sm">
              + New Task
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-[#2d5a4c]/80 text-white border-[#2d5a4c]">
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/80 mb-4">
              Export your team&apos;s progress and analytics
            </p>
            <Button variant="secondary" size="sm">
              Export Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
