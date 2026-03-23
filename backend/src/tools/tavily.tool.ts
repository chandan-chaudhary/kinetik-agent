import {
  TavilyGetResearch,
  //   TavilyCrawl,
  TavilyResearch,
  //   TavilySearch,
} from '@langchain/tavily';
import { MarketStateType } from '@/nodes/trading-node/marketSchema';

export async function tavilyTool(
  state:
    | MarketStateType
    | { userQuery: { ticker: string; type: 'crypto' | 'stock' } },
  nodeData: Record<string, unknown> = {},
): Promise<Partial<MarketStateType>> {
  const { ticker, type } = state.userQuery;

  const tavilyApiKey =
    (nodeData.tavilyApiKey as string | undefined) || process.env.TAVILY_API_KEY;
  const queryTemplate =
    (nodeData.tavilyQueryTemplate as string | undefined) ||
    'Latest article or news about {ticker} {type} price';

  const research = new TavilyResearch({
    tavilyApiKey: tavilyApiKey!,
    model: 'mini',
    citationFormat: 'apa',
  });

  const finalResult = new TavilyGetResearch({
    tavilyApiKey: tavilyApiKey!,
  });

  const input = queryTemplate
    .replaceAll('{ticker}', ticker)
    .replaceAll('{type}', type);

  const report = (await research.invoke({
    input,
  })) as Record<string, unknown>;
  console.log('report', report);

  // Helper function to delay
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Get initial research
  let final = (await finalResult.invoke({
    requestId: report.request_id as string,
    returnDirect: true,
  })) as Record<string, unknown>;

  // Poll until completed or failed
  while (final.status !== 'completed' && final.status !== 'failed') {
    console.log(
      `Status: ${final.status as string}... polling again in 10 seconds`,
    );
    await delay(10000);
    final = (await finalResult.invoke({
      requestId: report.request_id as string,
      // returnDirect: true,
    })) as Record<string, unknown>;
  }

  // Check if failed
  if (final.status === 'failed') {
    throw new Error(
      `Research failed: ${final.error ? JSON.stringify(final.error) : 'Unknown error'}`,
    );
  }

  console.log('Research Complete!');
  console.log('GOT FINAL RESULT IN TAVILY', final);

  // Return as array since news expects z.array()
  return { news: final };
}
// tavilyTool().catch((error) => {
//   console.error('Error invoking TavilyResearch tool:', error);
//   process.exit(1);
// });
