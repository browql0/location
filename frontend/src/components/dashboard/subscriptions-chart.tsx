import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { subscriptionData } from "./dashboard-mock-data";

const colors = ["#0ea5e9", "#10b981", "#6366f1", "#f59e0b"];

export function SubscriptionsChart() {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_160px] sm:items-center">
      <div className="h-72">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie data={subscriptionData} dataKey="value" innerRadius={58} outerRadius={92} paddingAngle={3}>
              {subscriptionData.map((entry, index) => (
                <Cell fill={colors[index % colors.length]} key={entry.name} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                color: "hsl(var(--foreground))"
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3">
        {subscriptionData.map((item, index) => (
          <div className="flex items-center justify-between gap-3 text-sm" key={item.name}>
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
