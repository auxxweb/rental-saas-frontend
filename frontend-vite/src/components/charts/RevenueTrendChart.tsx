import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useAppLocale } from '@/lib/useAppLocale'

export type RevenuePoint = {
  label: string
  revenue: number
}

export default function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  const { formatMoney } = useAppLocale()
  return (
    <div className="h-64 w-full min-w-0 min-h-[240px] overflow-x-auto">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={{ stroke: 'var(--border)' }}
            width={48}
          />
          <Tooltip
            cursor={{ fill: 'rgba(200,245,66,0.12)', stroke: 'var(--accent)', strokeWidth: 1 }}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--accent)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-md)',
              color: 'var(--text-primary)',
            }}
            labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
            itemStyle={{ color: 'var(--accent)', fontWeight: 600 }}
            formatter={(value: unknown) => [formatMoney(Number(value)), 'Revenue']}
          />
          <Bar
            dataKey="revenue"
            fill="var(--accent)"
            radius={[10, 10, 10, 10]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
