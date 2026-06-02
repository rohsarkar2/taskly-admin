export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and organization settings
        </p>
      </div>

      <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Settings Page</h2>
          <p className="text-muted-foreground">
            This page will display settings for your account and organization
          </p>
        </div>
      </div>
    </div>
  );
}
