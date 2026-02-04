import { tavilySearch } from "@tavily/ai-sdk";

export const tavilySearchTool = tavilySearch({
    searchDepth: "advanced",
    includeAnswer: true,
    maxResults: 5,
    topic: "general",
});