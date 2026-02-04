import { tavilySearch } from "@tavily/ai-sdk";

export const tavilySearchTool = tavilySearch({
    searchDepth: "basic",
    includeAnswer: true,
    maxResults: 2,
    topic: "general",
});