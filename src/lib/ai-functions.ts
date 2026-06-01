/**
 * AI Client Functions — calls Supabase Edge Functions
 * Auth: uses Supabase session JWT, checked by each Edge Function.
 */
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = (import.meta.env.VITE_SUPABASE_URL || "") + "/functions/v1";

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Unauthorized: No valid auth token");
  return token;
}

async function callEdge(name: string, body: Record<string, unknown>) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({ error: res.statusText }))) as {
      error?: string;
    };
    throw new Error(json.error || `Error ${res.status}`);
  }
  return res.json();
}

// ─── Exported Functions ────────────────────────────────────────────

export async function suggestSection(input: {
  data: {
    cvId: string;
    section: "summary" | "headline" | "experience" | "education" | "skills";
    targetRole?: string;
    currentContent?: string;
    additionalContext?: string;
    regenerateIndex?: number;
    language?: "id" | "en";
  };
}) {
  return callEdge("ai-suggest", input.data) as Promise<{
    suggestions: Array<{ option: string; explanation: string }>;
  }>;
}

export async function scoreCv(input: {
  data: {
    cvId: string;
    cvData: Record<string, unknown>;
    jobDescription?: string;
    targetRole?: string;
    language?: "id" | "en";
  };
}) {
  return callEdge("ai-score", input.data) as Promise<{
    overallScore: number;
    breakdown: Record<string, number>;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  }>;
}

export type JobMatchResult = {
  matchScore: number;
  verdict: "strong" | "good" | "medium" | "low";
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  cvChanges: Array<{
    section: string;
    currentIssue: string;
    suggestedChange: string;
    impact: string;
  }>;
};

export async function matchCvToJob(input: {
  data: {
    cvId: string;
    jobId?: string;
    jobDescription?: string;
    jobUrl?: string;
    jobTitle?: string;
    companyName?: string;
    language?: "id" | "en";
  };
}) {
  return callEdge("ai-job-match", input.data) as Promise<JobMatchResult>;
}

export type TailorCvResult = {
  tailoredCvData: Record<string, unknown>;
  summary: string;
  targetRole: string;
  companyName: string;
  keywordFocus: string[];
  changes: Array<{
    section: string;
    before: string;
    after: string;
    reason: string;
  }>;
  cautions: string[];
};

export async function tailorCvToJob(input: {
  data: {
    cvId: string;
    jobDescription: string;
    jobTitle?: string;
    companyName?: string;
    language?: "id" | "en";
  };
}) {
  return callEdge("ai-tailor-cv", input.data) as Promise<TailorCvResult>;
}

export async function chatWithAi(input: {
  data: {
    cvId?: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    jsonMode?: boolean;
    mode?: "chat" | "guided";
    language?: "id" | "en";
  };
}) {
  return callEdge("ai-chat", input.data) as Promise<{ reply: string }>;
}

export async function generateCoverLetter(input: {
  data: {
    cvId: string;
    cvData: Record<string, unknown>;
    jobDescription: string;
    companyName?: string;
    positionName?: string;
    language?: "id" | "en";
  };
}) {
  return callEdge("ai-cover-letter", input.data) as Promise<{ coverLetter: string }>;
}

export async function extractKeywords(input: {
  data: {
    jobDescription: string;
    targetRole?: string;
    language?: "id" | "en";
  };
}) {
  return callEdge("ai-keywords", input.data) as Promise<{
    hardSkills: string[];
    softSkills: string[];
    qualifications: string[];
    actionVerbs: string[];
    keywordsSummary: string;
  }>;
}

export type CvReviewResult = {
  success: boolean;
  review: {
    reviewer: { name: string; title: string; experience: string };
    scores: {
      overall: number;
      firstImpression: number;
      format: number;
      content: number;
      achievement: number;
      presentation: number;
    };
    strengths: string[];
    weaknesses: string[];
    suggestions: Array<{
      priority: "high" | "medium" | "low";
      category: string;
      current: string;
      suggested: string;
      impact: string;
    }>;
    industryBenchmark: {
      level: string;
      comparison: string;
      percentile: string;
    };
    hrVerdict: {
      verdict: string;
      reason: string;
      nextSteps: string[];
    };
    quickWins: string[];
  };
  tier: string;
  isHrPersona: boolean;
};

export async function reviewCv(input: {
  data: {
    cvId?: string;
    cvData: Record<string, unknown>;
    targetRole?: string;
    jobDescription?: string;
    language?: "id" | "en";
  };
}) {
  return callEdge("ai-cv-review", input.data) as Promise<CvReviewResult>;
}

export async function reviewCvUpload(input: {
  data: {
    rawText: string;
    targetRole?: string;
    jobDescription?: string;
    language?: "id" | "en";
  };
}) {
  return callEdge("ai-cv-review-upload", input.data) as Promise<CvReviewResult>;
}

export async function polishText(input: {
  data: {
    text: string;
    context?: string;
    language?: "id" | "en";
  };
}) {
  return callEdge("ai-polish", input.data) as Promise<{
    original: string;
    polished: string;
  }>;
}

export async function parseCvUpload(input: {
  data: {
    rawText: string;
    language?: "id" | "en";
  };
}) {
  return callEdge("ai-parse-cv", input.data) as Promise<{
    success: boolean;
    cvData: Record<string, unknown>;
  }>;
}

export async function extractCvTextWithAi(input: {
  data: {
    images: string[];
    fileName: string;
  };
}) {
  return callEdge("ai-extract-text", input.data) as Promise<{
    text: string;
  }>;
}
