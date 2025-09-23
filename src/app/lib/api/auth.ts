const API_URL = process.env.NEXT_PUBLIC_API_URL!
const API_USER = process.env.NEXT_PUBLIC_API_USER!
const API_PASSWORD = process.env.NEXT_PUBLIC_API_PASSWORD!

let token: string | undefined

export async function getToken(): Promise<string> {
  if (token) return token // aquí TS ya sabe que es string

  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      username: API_USER,
      password: API_PASSWORD,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to fetch token: ${res.status} ${text}`)
  }

  const data = await res.json()
  token = data.access_token as string

  if (!token) throw new Error('No token returned from API')

  return token
}
