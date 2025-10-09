import { getToken } from './auth'
import type { Customer } from "../types/customer";

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error: ${res.status} ${text}`)
  }

  return res.json() as Promise<T>
}

export async function getCustomerById(customerId: string): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${customerId}`);
}