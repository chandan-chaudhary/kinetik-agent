"use client";

import { useState } from "react";

export default function TestDbPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testRegister = async () => {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          name: "Test User",
          password: "test123",
          profilePicture: "https://i.pravatar.cc/300",
        }),
      });

      const data = await response.json();
      setResult(JSON.stringify({ status: response.status, data }, null, 2));
    } catch (error) {
      setResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "chandan@gmail.com",
          password: "test123",
        }),
      });

      const data = await response.json();
      setResult(JSON.stringify({ status: response.status, data }, null, 2));
    } catch (error) {
      setResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Check the server terminal logs for Database connected
              successfully message
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={testRegister}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Testing..." : "Test Register"}
            </button>

            <button
              onClick={testLogin}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? "Testing..." : "Test Login"}
            </button>
          </div>

          {result && (
            <div className="mt-6">
              <h2 className="font-semibold mb-2">Result:</h2>
              <pre className="bg-gray-50 p-4 rounded border overflow-auto text-sm">
                {result}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click Test Register to create a new user</li>
            <li>Check the terminal where `npm run dev` is running</li>
            <li>
              You should see Database connected successfully log message
            </li>
            <li>The result will appear below showing the API response</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
