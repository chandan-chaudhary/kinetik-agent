import {
  TavilyGetResearch,
  //   TavilyCrawl,
  TavilyResearch,
  //   TavilySearch,
} from '@langchain/tavily';
import { MarketStateType } from '@/nodes/trading-node/marketSchema';
const research = new TavilyResearch({
  tavilyApiKey: process.env.TAVILY_API_KEY!,
  model: 'mini',
  citationFormat: 'apa',
});

const finalResult = new TavilyGetResearch({
  tavilyApiKey: process.env.TAVILY_API_KEY!,
});

export async function tavilyTool(
  state:
    | MarketStateType
    | { userQuery: { ticker: 'BTC/USD'; type: 'crypto' | 'stocks' } },
): Promise<Partial<MarketStateType>> {
  const { ticker, type } = state.userQuery;

  const report = (await research.invoke({
    input: `Latest article or news about ${ticker} ${type} price`,
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
