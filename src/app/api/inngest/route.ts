import { serve } from 'inngest/next';
import { inngest } from '@/lib/services/evaluation/inngest-client';
import { evaluateSubmission } from '@/lib/services/evaluation/evaluate-submission';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [evaluateSubmission],
});
