"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { day: "1", sales: 45000 },
  { day: "2", sales: 52000 },
  { day: "3", sales: 48000 },
  { day: "4", sales: 61000 },
  { day: "5", sales: 55000 },
  { day: "6", sales: 67000 },
  { day: "7", sales: 72000 },
  { day: "8", sales: 68000 },
  { day: "9", sales: 75000 },
  { day: "10", sales: 71000 },
  { day: "11", sales: 78000 },
  { day: "12", sales: 82000 },
  { day: "13", sales: 79000 },
  { day: "14", sales: 85000 },
  { day: "15", sales: 88000 },
  { day: "16", sales: 84000 },
  { day: "17", sales: 80234 },
  { day: "18", sales: 86000 },
  { day: "19", sales: 89000 },
  { day: "20", sales: 92000 },
]

export default function SalesChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="day" stroke="var(--muted-foreground)" />
        <YAxis stroke="var(--muted-foreground)" />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: `1px solid var(--border)`,
            borderRadius: "8px",
          }}
          formatter={(value) => `₱${value.toLocaleString()}`}
        />
        <Line type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={true} />
      </LineChart>
    </ResponsiveContainer>
  )
}
