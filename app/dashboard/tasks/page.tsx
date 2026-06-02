export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and track all your tasks
        </p>
      </div>

      <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Tasks Page</h2>
          <p className="text-muted-foreground">
            This page will display all tasks for your organization
          </p>
        </div>
      </div>
    </div>
  );
}
