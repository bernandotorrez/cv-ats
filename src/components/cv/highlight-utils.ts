/**
 * Highlight Utilities for CV Review & Scoring
 * Matches AI suggestions to CV data and returns highlight positions
 */

export interface HighlightRegion {
  section: string; // e.g., "summary", "experience-0", "skills"
  field: string; // e.g., "description", "name"
  text: string; // the text to highlight
  suggestionIndex: number; // index in suggestions array
  priority: "high" | "medium" | "low";
  suggested?: string; // replacement text
  impact?: string;
  category?: string;
}

/**
 * Find text in CV data that matches the "current" field from AI suggestions
 */
export function findHighlightRegions(
  cvData: Record<string, unknown>,
  suggestions: Array<{
    priority: "high" | "medium" | "low";
    category: string;
    current: string;
    suggested: string;
    impact: string;
  }>,
): HighlightRegion[] {
  const regions: HighlightRegion[] = [];

  suggestions.forEach((suggestion, index) => {
    const currentText = suggestion.current.toLowerCase().trim();
    if (!currentText || currentText.length < 5) return; // Skip too short matches

    // Search in personal summary
    const personal = cvData.personal as Record<string, unknown> | undefined;
    if (personal?.summary && typeof personal.summary === "string") {
      if (personal.summary.toLowerCase().includes(currentText)) {
        regions.push({
          section: "personal",
          field: "summary",
          text: suggestion.current,
          suggestionIndex: index,
          priority: suggestion.priority,
          suggested: suggestion.suggested,
          impact: suggestion.impact,
          category: suggestion.category,
        });
      }
    }

    // Search in personal headline
    if (personal?.headline && typeof personal.headline === "string") {
      if (personal.headline.toLowerCase().includes(currentText)) {
        regions.push({
          section: "personal",
          field: "headline",
          text: suggestion.current,
          suggestionIndex: index,
          priority: suggestion.priority,
          suggested: suggestion.suggested,
          impact: suggestion.impact,
          category: suggestion.category,
        });
      }
    }

    // Search in experiences
    const experiences = cvData.experiences as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(experiences)) {
      experiences.forEach((exp, expIndex) => {
        const desc = exp.description as string | undefined;
        if (desc && desc.toLowerCase().includes(currentText)) {
          regions.push({
            section: `experience-${expIndex}`,
            field: "description",
            text: suggestion.current,
            suggestionIndex: index,
            priority: suggestion.priority,
            suggested: suggestion.suggested,
            impact: suggestion.impact,
            category: suggestion.category,
          });
        }
        const position = exp.position as string | undefined;
        if (position && position.toLowerCase().includes(currentText)) {
          regions.push({
            section: `experience-${expIndex}`,
            field: "position",
            text: suggestion.current,
            suggestionIndex: index,
            priority: suggestion.priority,
            suggested: suggestion.suggested,
            impact: suggestion.impact,
            category: suggestion.category,
          });
        }
      });
    }

    // Search in educations
    const educations = cvData.educations as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(educations)) {
      educations.forEach((edu, eduIndex) => {
        const desc = edu.description as string | undefined;
        if (desc && desc.toLowerCase().includes(currentText)) {
          regions.push({
            section: `education-${eduIndex}`,
            field: "description",
            text: suggestion.current,
            suggestionIndex: index,
            priority: suggestion.priority,
            suggested: suggestion.suggested,
            impact: suggestion.impact,
            category: suggestion.category,
          });
        }
      });
    }

    // Search in skills
    const skills = cvData.skills as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(skills)) {
      skills.forEach((skill) => {
        const name = skill.name as string | undefined;
        if (name && name.toLowerCase().includes(currentText)) {
          regions.push({
            section: "skills",
            field: "name",
            text: suggestion.current,
            suggestionIndex: index,
            priority: suggestion.priority,
            suggested: suggestion.suggested,
            impact: suggestion.impact,
            category: suggestion.category,
          });
        }
      });
    }
  });

  return regions;
}

/**
 * Get highlight color based on priority
 */
export function getHighlightColor(priority: "high" | "medium" | "low"): string {
  switch (priority) {
    case "high":
      return "bg-red-200/60 border-red-400/50"; // Red-ish highlight for high priority
    case "medium":
      return "bg-yellow-200/60 border-yellow-400/50"; // Yellow highlight for medium
    case "low":
      return "bg-green-200/60 border-green-400/50"; // Green highlight for low
  }
}

/**
 * Get highlight background for inline text
 */
export function getInlineHighlightBg(priority: "high" | "medium" | "low"): string {
  switch (priority) {
    case "high":
      return "rgba(254, 202, 202, 0.5)"; // red-200 with opacity
    case "medium":
      return "rgba(254, 240, 138, 0.5)"; // yellow-200 with opacity
    case "low":
      return "rgba(187, 247, 208, 0.5)"; // green-200 with opacity
  }
}

/**
 * Wrap matching text with highlight mark
 */
export function highlightTextInString(
  text: string,
  matchText: string,
  priority: "high" | "medium" | "low",
): string {
  if (!matchText || !text) return text;
  
  const bg = getInlineHighlightBg(priority);
  const escaped = matchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  
  return text.replace(
    regex,
    `<mark style="background:${bg};padding:1px 2px;border-radius:2px;border-bottom:2px solid ${priority === "high" ? "#ef4444" : priority === "medium" ? "#eab308" : "#22c55e"}">$1</mark>`,
  );
}
