import { tavilySearch } from "@tavily/ai-sdk";

export const tavilySearchTool = tavilySearch({
    searchDepth: "basic",
    maxResults: 2,
    topic: "general",
});