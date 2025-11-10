"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DiagnosticResult {
  configured: boolean;
  backendUrl?: string;
  backendReachable?: boolean;
  backendStatus?: number;
  message?: string;
  error?: string;
}

export default function DiagnosticsPage() {
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoginResult, setTestLoginResult] = useState<string>("");

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/test-backend");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        configured: false,
        error: err instanceof Error ? err.message : "Failed to run diagnostics",
      });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setTestLoginResult("Testing...");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "mash.mushroom.automation@gmail.com",
          password: "PP@Namias99",
        }),
      });
      const data = await res.json();
      setTestLoginResult(
        JSON.stringify({ status: res.status, ...data }, null, 2)
      );
    } catch (err) {
      setTestLoginResult(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🔍 Backend Login Diagnostics</h1>
          <p className="text-muted-foreground mt-2">
            Verify backend connectivity and test login configuration
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            ✅ Backend Configuration Status
          </h2>

          {loading && <p className="text-muted-foreground">Running tests...</p>}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Environment Variable:</strong>
                  <p
                    className={
                      result.configured ? "text-green-600" : "text-red-600"
                    }
                  >
                    {result.configured ? "✓ Configured" : "✗ Not Configured"}
                  </p>
                </div>

                {result.backendUrl && (
                  <div>
                    <strong>Backend URL:</strong>
                    <p className="text-sm font-mono break-all">
                      {result.backendUrl}
                    </p>
                  </div>
                )}

                {result.backendReachable !== undefined && (
                  <div>
                    <strong>Backend Reachable:</strong>
                    <p
                      className={
                        result.backendReachable
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {result.backendReachable ? "✓ Yes" : "✗ No"}
                    </p>
                  </div>
                )}

                {result.backendStatus && (
                  <div>
                    <strong>Backend Response:</strong>
                    <p className="text-sm">HTTP {result.backendStatus}</p>
                  </div>
                )}
              </div>

              {result.message && (
                <div
                  className={`p-4 rounded ${
                    result.backendReachable
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-yellow-50 text-yellow-800 border border-yellow-200"
                  }`}
                >
                  <strong>Status:</strong> {result.message}
                </div>
              )}

              {result.error && (
                <div className="p-4 bg-red-50 text-red-800 rounded border border-red-200">
                  <strong>Error:</strong> {result.error}
                </div>
              )}

              <Button onClick={runDiagnostics} variant="outline">
                🔄 Re-run Diagnostics
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🔐 Test Login Flow</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Test the complete login flow with production credentials
          </p>

          <Button onClick={testLogin} className="mb-4">
            Test Login (Production Credentials)
          </Button>

          {testLoginResult && (
            <div className="mt-4">
              <strong className="text-sm">Response:</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96 border">
                {testLoginResult}
              </pre>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">
            📋 Vercel Deployment Checklist
          </h2>
          <ol className="space-y-3 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>
                Go to{" "}
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Vercel Dashboard
                </a>{" "}
                → Your Project → <strong>Settings</strong> →{" "}
                <strong>Environment Variables</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>
                Click <strong>&quot;Add New&quot;</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <div>
                <strong>Name:</strong>{" "}
                <code className="bg-blue-100 px-2 py-1 rounded">
                  NEXT_PUBLIC_API_URL
                </code>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <div>
                <strong>Value:</strong>{" "}
                <code className="bg-blue-100 px-2 py-1 rounded">
                  https://mash-backend-api-production.up.railway.app
                </code>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">5.</span>
              <span>
                Select: <strong>Production</strong> (and Preview if needed)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">6.</span>
              <span>
                Click <strong>&quot;Save&quot;</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">7.</span>
              <span>
                <strong>Redeploy</strong> your application (Vercel will prompt
                you)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">8.</span>
              <span>
                Visit{" "}
                <code className="bg-blue-100 px-2 py-1 rounded">
                  https://mash-admin-dashboard-ashy.vercel.app/diagnostics
                </code>{" "}
                after deployment
              </span>
            </li>
          </ol>
        </Card>

        <Card className="p-6 bg-green-50 border-green-200">
          <h2 className="text-xl font-semibold mb-4 text-green-900">
            ✨ Current Configuration
          </h2>
          <div className="space-y-2 text-sm text-green-800">
            <div>
              <strong>Backend API:</strong>{" "}
              <code className="bg-green-100 px-2 py-1 rounded">
                https://mash-backend-api-production.up.railway.app
              </code>
            </div>
            <div>
              <strong>Login Endpoint:</strong>{" "}
              <code className="bg-green-100 px-2 py-1 rounded">
                POST /api/v1/auth/login
              </code>
            </div>
            <div>
              <strong>Authentication:</strong>{" "}
              <span>HttpOnly Cookies (authToken + refreshToken)</span>
            </div>
            <div>
              <strong>Test Credentials:</strong>{" "}
              <code className="bg-green-100 px-2 py-1 rounded">
                mash.mushroom.automation@gmail.com
              </code>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🚀 Quick Links</h2>
          <div className="space-y-2">
            <a
              href="https://mash-admin-dashboard-ashy.vercel.app/login"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              → Login Page (Production)
            </a>
            <a
              href="https://mash-backend-api-production.up.railway.app"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              → Backend API (Railway)
            </a>
            <a
              href="/api/test-backend"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:underline"
            >
              → Test Backend API (JSON)
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
