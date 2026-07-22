import { HindsightClient } from "@vectorize-io/hindsight-client";

const apiKey = process.env.HINDSIGHT_API_KEY || "";
const pipelineId = process.env.HINDSIGHT_PIPELINE_ID || "";

const client = new HindsightClient({
  baseUrl: process.env.HINDSIGHT_BASE_URL || "https://api.vectorize.io/hindsight",
  apiKey,
});

export const retainMeetingMemory = async (data: {
  userId: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  analysis: any;
}) => {
  try {
    const { userId, meetingId, meetingTitle, meetingDate, analysis } = data;

    // 1. Format the rich narrative content
    const content = `Meeting: ${meetingTitle} on ${meetingDate}.
Summary: ${analysis.summary || "No summary"}.
Sentiment: ${analysis.sentiment || "Neutral"}.
Promises made: ${(analysis.promises_made || []).map((p: any) => typeof p === 'string' ? p : p.promise).join(", ") || "None"}.
Next steps: ${(analysis.next_steps || []).join(", ") || "None"}.
Risk flags: ${(analysis.risk_flags || []).join(", ") || "None"}.
Topics: ${(analysis.topics_discussed || []).join(", ") || "None"}.
Emotional cues: ${(analysis.emotional_cues || []).join(", ") || "None"}.
Key quotes: ${(analysis.key_quotes || []).join(", ") || "None"}.`;

    // 2. Metadata for Hindsight
    const metadata: Record<string, string> = {
      userId: String(userId || ""),
      meetingId: String(meetingId || ""),
      meetingDate: String(meetingDate || ""),
      sentiment: String(analysis.sentiment || "Neutral"),
      dealStage: String(analysis.deal_stage || "not_applicable"),
      hasPromises: String((analysis.promises_made || []).length > 0),
      hasRisks: String((analysis.risk_flags || []).length > 0),
    };

    // 3. Ingest into Hindsight
    console.log(`[HINDSIGHT] Retaining memory for meeting: ${meetingId}`);
    await client.retain(pipelineId, content, {
      documentId: meetingId,
      metadata,
    });

    console.log(`[HINDSIGHT] Successfully retained memory for meeting: ${meetingId}`);
  } catch (error) {
    console.error("[HINDSIGHT] Error in retainMeetingMemory:", error);
  }
};

export const recallMeetingMemory = async (query: string, userId: string) => {
  try {
    console.log(`[HINDSIGHT] Recalling memory for user ${userId}: ${query}`);
    
    // Prefixing query as requested: "[userId]: [query]"
    const response = await client.recall(pipelineId, `[${userId}]: ${query}`);

    return response.results || [];
  } catch (error) {
    console.error("[HINDSIGHT] Error in recallMeetingMemory:", error);
    return [];
  }
};
