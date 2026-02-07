import { MessagesValue, StateSchema } from '@langchain/langgraph';
import z from 'zod';

export const marketSchema = new StateSchema({
  messages: MessagesValue,
  userQuery: z.object({
    ticker: z.string(),
    type: z.enum(['crypto', 'stocks']),
  }),
  marketLiveData: z.record(z.string(), z.any()).optional(),
  newsSentiment: z.array(z.record(z.string(), z.any())).optional(),
  technicalIndicators: z.any().optional(),
  // Error information
  error: z.string().optional().nullable(),
});
// Type for graph result that might be interrupted
export type GraphResult<T = any> = T & {
  __interrupt__?: Array<{
    value: Record<string, any>;
    resumable: boolean;
    ns?: string[];
    when?: 'during' | 'before';
  }>;
};
export type MarketStateType = typeof marketSchema.State;
