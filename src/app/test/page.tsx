"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api/client";

export default function TestPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Record<string, unknown>>("/info")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-4">Cargando...</div>;

  return (
    <pre className="p-4 bg-gray-100 rounded">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
