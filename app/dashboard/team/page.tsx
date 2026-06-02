export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your team members and their roles
        </p>
      </div>

      <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Team Page</h2>
          <p className="text-muted-foreground">
            This page will display all team members in your organization
          </p>
        </div>
      </div>
    </div>
  );
}
