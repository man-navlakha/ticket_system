import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query } = await request.json();

        if (!query || query.trim().length < 3) {
            return NextResponse.json({
                error: 'Please provide a more detailed description of your issue'
            }, { status: 400 });
        }

        // Fetch all published knowledge base articles
        const articles = await prisma.knowledgeBaseArticle.findMany({
            where: { published: true },
            include: {
                category: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
            orderBy: [
                { views: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        if (articles.length === 0) {
            return NextResponse.json({
                articles: [],
                aiMessage: "No knowledge base articles are available yet."
            });
        }

        // Prepare article summaries for AI analysis
        const articleSummaries = articles.map((article, index) => ({
            index,
            id: article.id,
            title: article.title,
            summary: article.summary || '',
            category: article.category?.name || 'Uncategorized',
            tags: article.tags.map(t => t.tag.name).join(', '),
            // Include first 500 chars of content for better matching
            contentPreview: article.content?.substring(0, 500) || ''
        }));

        // Use Gemini to analyze the query and rank articles
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are a strict IT support assistant. A user is searching for help with a specific problem. Your task is to find ONLY articles that DIRECTLY relate to their issue. Do NOT include articles that are vaguely related or about different topics.

USER'S SEARCH QUERY:
"${query}"

AVAILABLE KNOWLEDGE BASE ARTICLES:
${JSON.stringify(articleSummaries, null, 2)}

STRICT MATCHING RULES:
1. ONLY include articles that directly address the user's specific issue
2. The article must be about the SAME topic/software/hardware mentioned in the query
3. DO NOT include articles about different problems, even if they share a category
4. If the user asks about "Outlook", only return Outlook-related articles
5. If the user asks about "WiFi", only return network/WiFi-related articles
6. If NO articles are truly relevant, return an EMPTY array - this is better than showing irrelevant results

EXAMPLES OF WHAT NOT TO DO:
- User searches "outlook not working" → DO NOT show "Black Screen" or "Hardware" articles
- User searches "printer issue" → DO NOT show "Email Configuration" articles
- User searches "laptop battery" → DO NOT show "Network" or "Software" articles

Return a JSON response with:
- "matchedArticles": Array of article indices that DIRECTLY match the query. Can be empty if nothing matches. Maximum 3 articles.
- "aiSummary": Brief explanation. If no matches found, say "No articles found for [topic]. Try browsing by category or create a support ticket."
- "confidence": "high" (exact match), "medium" (related), "none" (no relevant articles)

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks. Be STRICT - it's better to return fewer or no results than irrelevant ones.

Example for no matches:
{"matchedArticles": [], "aiSummary": "No articles found for Outlook issues. Try browsing the Software category or create a support ticket.", "confidence": "none"}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // Parse AI response
        let aiResponse;
        try {
            // Clean up potential markdown formatting
            let cleanedResponse = responseText;
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.slice(7);
            }
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.slice(3);
            }
            if (cleanedResponse.endsWith('```')) {
                cleanedResponse = cleanedResponse.slice(0, -3);
            }
            aiResponse = JSON.parse(cleanedResponse.trim());
        } catch (parseError) {
            console.error('Failed to parse AI response:', responseText);
            // Fallback to keyword matching
            aiResponse = {
                matchedArticles: [],
                aiSummary: "I couldn't analyze your query. Showing all articles instead.",
                confidence: "low"
            };
        }

        // Get the matched articles in order
        const matchedIndices = aiResponse.matchedArticles || [];
        const rankedArticles = matchedIndices
            .filter(idx => idx >= 0 && idx < articles.length)
            .map(idx => {
                const article = articles[idx];
                return {
                    id: article.id,
                    title: article.title,
                    summary: article.summary,
                    category: article.category,
                    tags: article.tags.map(at => at.tag),
                    views: article.views,
                    upvotes: article.upvotes,
                    published: article.published,
                    createdBy: article.createdBy,
                    createdAt: article.createdAt,
                };
            });

        // If no matches from AI, do strict keyword fallback
        if (rankedArticles.length === 0) {
            // Extract meaningful keywords (ignore common words)
            const stopWords = ['the', 'a', 'an', 'is', 'not', 'working', 'issue', 'problem', 'help', 'with', 'my', 'i', 'have', 'having', 'cant', "can't", 'cannot', 'error', 'fix', 'how', 'to', 'do', 'does', 'doesnt', "doesn't", 'won\'t', 'wont'];
            const queryWords = query.toLowerCase()
                .split(/\s+/)
                .filter(word => word.length > 2 && !stopWords.includes(word));

            if (queryWords.length === 0) {
                return NextResponse.json({
                    articles: [],
                    aiMessage: `No articles found matching "${query}". Try browsing by category or create a support ticket.`,
                    confidence: 'none',
                    searchType: 'no-match'
                });
            }

            // Find articles that contain at least one keyword in title or tags
            const keywordMatches = articles
                .filter(article => {
                    const titleLower = article.title.toLowerCase();
                    const tagsLower = article.tags.map(t => t.tag.name.toLowerCase());

                    // Check if any query word appears in title or tags
                    return queryWords.some(word =>
                        titleLower.includes(word) ||
                        tagsLower.some(tag => tag.includes(word))
                    );
                })
                .slice(0, 3)
                .map(article => ({
                    id: article.id,
                    title: article.title,
                    summary: article.summary,
                    category: article.category,
                    tags: article.tags.map(at => at.tag),
                    views: article.views,
                    upvotes: article.upvotes,
                    published: article.published,
                    createdBy: article.createdBy,
                    createdAt: article.createdAt,
                }));

            return NextResponse.json({
                articles: keywordMatches,
                aiMessage: keywordMatches.length > 0
                    ? `Found ${keywordMatches.length} article${keywordMatches.length > 1 ? 's' : ''} related to your search.`
                    : `No articles found for "${query}". Try browsing by category or create a support ticket.`,
                confidence: keywordMatches.length > 0 ? 'low' : 'none',
                searchType: 'keyword-fallback'
            });
        }

        return NextResponse.json({
            articles: rankedArticles,
            aiMessage: aiResponse.aiSummary,
            confidence: aiResponse.confidence,
            searchType: 'ai-powered'
        });

    } catch (error) {
        console.error('AI KB search error:', error);
        return NextResponse.json(
            { error: 'Failed to search knowledge base' },
            { status: 500 }
        );
    }
}
