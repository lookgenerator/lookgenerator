"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api/client";

type ApiResponse = Record<string, unknown>;

export default function SystemTestPage() {
  const [health, setHealth] = useState<ApiResponse | null >(null);
  const [dbHealth, setDbHealth] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const healthData = await apiFetch<ApiResponse>("/health");
        setHealth(healthData);

        const dbData = await apiFetch<ApiResponse>("/db/health");
        setDbHealth(dbData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unknown error");
        }
      }
    }
    fetchData();
  }, []);

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!health || !dbHealth) return <div className="p-4">Cargando...</div>;

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="font-bold text-lg mb-2">System Health</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
          {JSON.stringify(health, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="font-bold text-lg mb-2">Database Health</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
          {JSON.stringify(dbHealth, null, 2)}
        </pre>
      </div>
    </div>
  );
}
