"use client";

import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface PlanSlice { name: string; value: number; color: string }
interface SignupPoint { month: string; altas: number }

export default function HQCharts({
  planData,
  signups,
  totalWorkspaces,
}: {
  planData: PlanSlice[];
  signups: SignupPoint[];
  totalWorkspaces: number;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* Dona de planes */}
      <div className="anim-up metric-card lg:col-span-2 rounded-2xl overflow-hidden"
        style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: "0.1s" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Distribución por plan</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">{totalWorkspaces} workspaces</p>
        </div>
        <div className="p-3 flex items-center gap-4">
          <div className="relative" style={{ width: 150, height: 150, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={3} stroke="none" animationDuration={1100}>
                  {planData.map((d) => <Cell key={d.name} fill={d.color} style={{ filter: `drop-shadow(0 0 5px ${d.color}66)` }} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", color: "#F1F5F9" }} formatter={(v, n) => [`${v} ws`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xl font-black text-[#F1F5F9] leading-none">{totalWorkspaces}</p>
              <p className="text-[9px] text-[#64748B] uppercase tracking-widest mt-0.5">total</p>
            </div>
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            {planData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                <span className="text-xs text-[#94A3B8] flex-1 truncate capitalize">{d.name}</span>
                <span className="text-xs font-bold text-[#F1F5F9]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Altas por mes */}
      <div className="anim-up metric-card lg:col-span-3 rounded-2xl overflow-hidden neon-chart"
        style={{ background: "#111118", border: "1px solid rgba(139,92,246,0.2)", animationDelay: "0.16s" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
          <p className="text-sm font-semibold text-[#F1F5F9]">Altas de workspaces</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Últimos 6 meses</p>
        </div>
        <div className="p-3">
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={signups} margin={{ top: 8, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="hqAltas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#111118", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "10px", color: "#F1F5F9" }} formatter={(v) => [v, "Altas"]} />
              <Area type="monotone" dataKey="altas" stroke="#a855f7" strokeWidth={2} fill="url(#hqAltas)" dot={false} activeDot={{ r: 4, fill: "#c084fc" }} animationDuration={1300} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
