'use client'

import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

export type DonutSlice = {
  name: string
  value: number
  color: string
}

export default function ShopStatusDonut({ data }: { data: DonutSlice[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={4}
            stroke="var(--surface)"
          >
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--accent)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-md)',
              color: 'var(--text-primary)',
            }}
            labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
            itemStyle={{ fontWeight: 600 }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value) => (
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{String(value)}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

