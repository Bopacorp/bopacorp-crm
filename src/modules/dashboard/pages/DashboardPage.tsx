export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
          <p className="mt-2 text-3xl font-bold">$0</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium text-muted-foreground">Tasks</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow">
        <h2 className="text-lg font-medium">Welcome to Bopacorp CRM</h2>
        <p className="mt-2 text-muted-foreground">
          This is your dashboard. Start building your CRM modules here.
        </p>
      </div>
    </div>
  );
}
