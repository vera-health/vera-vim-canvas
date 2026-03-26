export type ThinkingStep = {
  text: string;
  status: "pending" | "active" | "completed";
  reasoning: string;
};

export type ThinkingState = {
  steps: ThinkingStep[];
  searchReasoning: string;
  sourceCount: number;
  searchProgressByCategory: Record<string, number>;
  searchDone: boolean;
  isThinking: boolean;
  startedAt: number | null;
  completedAt: number | null;
};
