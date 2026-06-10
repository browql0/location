import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { revenueData } from "./dashboard-mock-data";

export function RevenueChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={revenueData} margin={{ left: 0, right: 8, top: 12 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis axisLine={false} dataKey="month" tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
          <YAxis axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={42} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              color: "hsl(var(--foreground))"
            }}
            formatter={(value) => [`${Number(value).toLocaleString("fr-MA")} MAD`, "Revenus"]}
          />
          <Area dataKey="revenue" fill="url(#revenueFill)" stroke="hsl(var(--primary))" strokeWidth={2} type="monotone" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
