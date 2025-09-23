'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch } from '../../../lib/api/client'
import type { Customer } from '../../../lib/types/customer'

export default function CustomerPage() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    apiFetch<Customer>(`/customers/${id}`)
      .then(setCustomer)
      .catch(err =>
        setError(err instanceof Error ? err.message : 'Unknown error')
      )
  }, [id])

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  if (!customer) return <div className="p-4">Cargando cliente...</div>

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">
        Cliente: {customer.first_name} {customer.last_name} (ID:{' '}
        {customer.customer_id})
      </h2>

      <h3 className="text-lg font-semibold">Productos:</h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {customer.products.map(p => (
          <li
            key={p.product_id}
            className="border rounded-lg p-3 shadow bg-white dark:bg-gray-800"
          >
            <img
              src={p.image_url}
              alt={p.name}
              className="w-full h-32 object-contain mb-2"
            />
            <p className="font-medium">{p.name}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
