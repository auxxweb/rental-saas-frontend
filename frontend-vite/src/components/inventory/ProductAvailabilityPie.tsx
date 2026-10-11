import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

type Props = {
  active: number
  rented: number
  maintenance: number
  damaged: number
}

const COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  RENTED: '#3b82f6',
  MAINTENANCE: '#eab308',
  DAMAGED: '#ef4444',
}

export default function ProductAvailabilityPie({ active, rented, maintenance, damaged }: Props) {
  const data = [
    { name: 'Active', value: active, key: 'ACTIVE' as const },
    { name: 'Rented', value: rented, key: 'RENTED' as const },
    { name: 'Maintenance', value: maintenance, key: 'MAINTENANCE' as const },
    { name: 'Damaged', value: damaged, key: 'DAMAGED' as const },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return <span className="text-xs text-[var(--text-secondary)]">No serial units</span>
  }

  return (
    <div className="h-36 w-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={48}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.key] ?? '#888'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
