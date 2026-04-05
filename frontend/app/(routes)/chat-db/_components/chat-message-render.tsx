"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useMemo } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ChartData {
  type: "bar" | "line" | "pie";
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  title?: string;
}

// ── Colour palette (matches Kinetik brand) ───────────────────────────────────

const CHART_COLORS = [
  "hsl(var(--primary))",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
];

// ── Detect chart intent from message text ────────────────────────────────────

function detectChartData(content: string): ChartData | null {
  const lower = content.toLowerCase();

  // Look for code blocks containing JSON array data
  const jsonBlockMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1]) as Record<string, unknown>[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return inferChartFromData(parsed, lower);
      }
    } catch {
      // not valid JSON, skip
    }
  }

  // Look for markdown tables and convert to chart when numeric values present
  const tableMatch = content.match(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/);
  if (tableMatch) {
    const headers = tableMatch[1]
      .split("|")
      .map((h) => h.trim())
      .filter(Boolean);
    const rows = tableMatch[2]
      .trim()
      .split("\n")
      .map((row) =>
        row
          .split("|")
          .map((c) => c.trim())
          .filter(Boolean),
      );

    const data = rows.map((row) => {
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        const val = row[i] ?? "";
        const num = parseFloat(val.replace(/[,$%]/g, ""));
        obj[h] = isNaN(num) ? val : num;
      });
      return obj;
    });

    if (data.length > 0) {
      return inferChartFromData(data, lower);
    }
  }

  return null;
}

function detectLongFormat(data: Record<string, unknown>[]): {
  xKey: string;
  categoryKey: string;
  valueKey: string;
} | null {
  if (data.length < 2) return null;
  const keys = Object.keys(data[0]);
  if (keys.length !== 3) return null;

  const numericKey = keys.find((k) => typeof data[0][k] === "number");
  const stringKeys = keys.filter((k) => typeof data[0][k] === "string");
  if (!numericKey || stringKeys.length !== 2) return null;

  const uniqueCounts = stringKeys.map((k) => ({
    key: k,
    count: new Set(data.map((r) => r[k])).size,
  }));
  uniqueCounts.sort((a, b) => a.count - b.count);
  const xKey = uniqueCounts[0].key;
  const categoryKey = uniqueCounts[1].key;

  const xValues = data.map((r) => r[xKey]);
  const hasDuplicateX = xValues.length !== new Set(xValues).size;
  if (!hasDuplicateX) return null;

  return { xKey, categoryKey, valueKey: numericKey };
}

function pivotLongToWide(
  data: Record<string, unknown>[],
  xKey: string,
  categoryKey: string,
  valueKey: string,
): Record<string, unknown>[] {
  const map = new Map<string, Record<string, unknown>>();
  for (const row of data) {
    const x = String(row[xKey]);
    if (!map.has(x)) map.set(x, { [xKey]: x });
    const entry = map.get(x)!;
    entry[String(row[categoryKey])] = row[valueKey];
  }
  return Array.from(map.values());
}

function inferChartFromData(
  data: Record<string, unknown>[],
  hint: string,
): ChartData | null {
  let processedData = data;

  const longFormat = detectLongFormat(data);
  if (longFormat) {
    processedData = pivotLongToWide(
      data,
      longFormat.xKey,
      longFormat.categoryKey,
      longFormat.valueKey,
    );
  }

  const keys = Object.keys(processedData[0]);
  const xKey = keys[0];
  const yKeys = keys
    .slice(1)
    .filter((k) => typeof processedData[0][k] === "number") as string[];

  if (yKeys.length === 0) return null;

  let type: ChartData["type"] = "bar";
  if (
    processedData.length >= 6 &&
    (hint.includes("trend") ||
      hint.includes("over time") ||
      hint.includes("per year") ||
      hint.includes("yearly") ||
      hint.includes("growth"))
  ) {
    type = "line";
  } else if (
    hint.includes("distribution") ||
    hint.includes("share") ||
    hint.includes("percentage")
  ) {
    type = "pie";
  }

  return { type, data: processedData, xKey, yKeys };
}

// ── Chart renderer ────────────────────────────────────────────────────────────

function ChartBlock({ chart }: { chart: ChartData }) {
  const { type, data, xKey, yKeys } = chart;

  if (type === "pie" && yKeys.length === 1) {
    const pieData = data.map((d) => ({
      name: String(d[xKey]),
      value: Number(d[yKeys[0]]),
    }));
    return (
      <div className="my-4 rounded-xl border bg-card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {pieData.map((_, i) => (
                <Cell
                  key={i}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "line") {
    return (
      <div className="my-4 rounded-xl border bg-card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.3) || 10]}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend />
            {yKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Default: bar
  return (
    <div className="my-4 rounded-xl border p-4" style={{ background: "#ffffff" }}>
      <ResponsiveContainer width="100%" height={280} style={{ background: "transparent" }}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }} style={{ background: "transparent" }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.3) || 10]}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 12,
              color: "#0f172a",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.08)",
            }}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Legend />
          {yKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
              activeBar={{ fill: CHART_COLORS[i % CHART_COLORS.length], opacity: 0.8 }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Markdown components (table, code, etc.) ───────────────────────────────────

const markdownComponents = {
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-muted/60 text-left">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="divide-y divide-border">{children}</tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2 font-semibold text-foreground">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-3 py-2 text-foreground/90">{children}</td>
  ),
  code: ({
    inline,
    children,
  }: {
    inline?: boolean;
    children?: React.ReactNode;
  }) =>
    inline ? (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
        {children}
      </code>
    ) : (
      <pre className="my-3 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
        <code>{children}</code>
      </pre>
    ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-2 mt-3 text-lg font-bold">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-2 mt-3 text-base font-bold">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-1 mt-2 text-sm font-bold">{children}</h3>
  ),
};

// ── Main export ───────────────────────────────────────────────────────────────

interface ChatMessageRendererProps {
  content: string;
}

export function ChatMessageRenderer({ content }: ChatMessageRendererProps) {
  const chart = useMemo(() => detectChartData(content), [content]);

  // Strip the JSON/table block from text when we're rendering it as a chart
  const textContent = useMemo(() => {
    if (!chart) return content;
    // Remove the raw JSON block so it doesn't also render as code
    return content.replace(/```(?:json)?\s*\[[\s\S]*?\]\s*```/, "").trim();
  }, [content, chart]);

  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {textContent}
      </ReactMarkdown>
      {chart && <ChartBlock chart={chart} />}
    </div>
  );
}