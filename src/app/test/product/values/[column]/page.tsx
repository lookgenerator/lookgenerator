'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch } from '../../../../lib/api/client'
import type { DistinctValues } from '../../../../lib/types/product'

export default function ProductValuesPage() {
  const { column } = useParams<{ column: string }>()
  const [data, setData] = useState<DistinctValues | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!column) return
    apiFetch<DistinctValues>(`/products/values/${column}`)
      .then(setData)
      .catch(err =>
        setError(err instanceof Error ? err.message : 'Unknown error')
      )
  }, [column])

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  if (!data) return <div className="p-4">Cargando valores...</div>

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        Columna: <span className="text-green-600">{data.column}</span>
      </h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {data.values.map((v, i) => (
          <li
            key={i}
            className="border rounded p-2 text-center bg-white dark:bg-gray-800 shadow"
          >
            {v}
          </li>
        ))}
      </ul>
    </div>
  )
}
