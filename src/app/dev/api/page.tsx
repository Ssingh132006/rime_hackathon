import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Terminal } from 'lucide-react'
import { contracts } from '@/contracts'
import { isContract, isRegistryNode, type Contract } from '@/contracts/_kit'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'API Contracts & Mock Registry' }

type Row = { feature: string; name: string; contract: Contract }

function collect(node: Record<string, unknown>, feature = ''): Row[] {
  return Object.entries(node).flatMap(([key, value]) => {
    if (isContract(value)) return [{ feature, name: key, contract: value }]
    if (isRegistryNode(value)) return collect(value, feature ? `${feature}.${key}` : key)
    return []
  })
}

function schemaOf(schema: z.ZodTypeAny, io: 'input' | 'output') {
  try {
    return JSON.stringify(z.toJSONSchema(schema, { io }), null, 2)
  } catch (e) {
    return `// ${(e as Error).message}`
  }
}

export default async function DevApiPage() {
  const rows = collect(contracts as unknown as Record<string, unknown>)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
  const wsBase = process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000'

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground font-sans">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/dashboard">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span>HTTP: {apiBase}</span>
            <span>·</span>
            <span>WS: {wsBase}</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            API Contracts &amp; Registry
          </h1>
          <p className="text-xs text-muted-foreground">
            Generated from <code className="rounded bg-muted px-1.5 py-0.5 font-mono">src/contracts/index.ts</code>. {rows.length} endpoints defined contract-first with typed Zod validation and realistic mock fallbacks.
          </p>
        </div>

        {/* Mock Controls Info Box */}
        <div className="rounded-lg border border-border bg-card p-4 text-xs font-mono text-muted-foreground space-y-2">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5" />
            <span>Developer &amp; Testing Flags</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Force mock mode via query parameter: <code className="bg-muted px-1 rounded text-foreground">?__mock=1</code>
            </li>
            <li>
              Force live mode via query parameter: <code className="bg-muted px-1 rounded text-foreground">?__mock=0</code>
            </li>
            <li>
              Global mock fallback env: <code className="bg-muted px-1 rounded text-foreground">NEXT_PUBLIC_USE_MOCKS=true</code>
            </li>
          </ul>
        </div>

        {/* Endpoints Table */}
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[800px] border-collapse text-left text-xs">
            <thead className="border-b border-border bg-muted/50 font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Path</th>
                <th className="px-4 py-3 font-semibold">Contract</th>
                <th className="px-4 py-3 font-semibold">Auth</th>
                <th className="px-4 py-3 font-semibold">Schemas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const c = row.contract
                return (
                  <tr key={`${c.method} ${c.path}`} className="align-top hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono">
                      <span className="inline-block rounded border border-border bg-muted px-2 py-0.5 font-bold">
                        {c.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <div className="font-semibold text-foreground">{c.path}</div>
                      {c.summary ? (
                        <div className="mt-1 text-[11px] text-muted-foreground font-sans">
                          {c.summary}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {row.feature}.{row.name}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] uppercase">
                        {c.auth}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-mono text-muted-foreground hover:text-foreground">
                          Inspect Schemas
                        </summary>
                        <div className="mt-2 grid gap-2 grid-cols-1 md:grid-cols-2">
                          <div>
                            <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">
                              Input Schema
                            </div>
                            <pre className="max-h-60 overflow-auto rounded border border-border bg-background p-2.5 font-mono text-[11px] leading-relaxed">
                              {schemaOf(c.input, 'input')}
                            </pre>
                          </div>
                          <div>
                            <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">
                              Output Schema
                            </div>
                            <pre className="max-h-60 overflow-auto rounded border border-border bg-background p-2.5 font-mono text-[11px] leading-relaxed">
                              {schemaOf(c.output, 'output')}
                            </pre>
                          </div>
                        </div>
                      </details>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
