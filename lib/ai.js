import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Analyze ticket description using AI to suggest priority and category
 * @param {string} title - Ticket title
 * @param {string} description - Ticket description
 * @returns {Promise<{priority: string, category: string, tags: string[]}>}
 */
export async function triageTicket(title, description) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY not set, skipping AI triage');
        return { priority: null, category: null, tags: [] };
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `You are a technical support triage assistant. Analyze this support ticket and provide:
1. Priority level (LOW, MEDIUM, or HIGH)
2. Category (Hardware, Software, Network, Access & Security, or Other)
3. Up to 3 relevant tags from this list: urgent, battery, screen, keyboard, mouse, wifi, slow-performance, driver-issue, virus-malware, printer, email, vpn, computer, laptop, power-issue, boot-issue, system-crash

Ticket Title: ${title}
Ticket Description: ${description}

Respond ONLY with valid JSON in this exact format:
{
  "priority": "MEDIUM",
  "category": "Hardware",
  "tags": ["battery", "urgent"]
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('AI response did not contain valid JSON:', text);
            return { priority: null, category: null, tags: [] };
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            priority: parsed.priority || null,
            category: parsed.category || null,
            tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        };
    } catch (error) {
        console.error('AI triage failed:', error);
        return { priority: null, category: null, tags: [] };
    }
}

/**
 * Find similar resolved tickets based on description
 * @param {string} description - Ticket description to match
 * @param {number} limit - Number of similar tickets to return
 * @param {string|null} excludeTicketId - ID of the ticket to exclude from results
 * @returns {Promise<Array>}
 */
export async function findSimilarTickets(description, limit = 5, excludeTicketId = null) {
    const { prisma } = await import('./prisma');

    // Simple keyword-based matching for now
    // In production, you'd use embeddings or full-text search
    const keywords = description
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3) // Filter out short words
        .slice(0, 10); // Limit to first 10 keywords

    if (keywords.length === 0) {
        return [];
    }

    try {
        // Find resolved tickets with similar keywords
        const tickets = await prisma.ticket.findMany({
            where: {
                status: 'RESOLVED',
                ...(excludeTicketId ? { id: { not: excludeTicketId } } : {}),
                OR: keywords.map(keyword => ({
                    OR: [
                        { title: { contains: keyword, mode: 'insensitive' } },
                        { description: { contains: keyword, mode: 'insensitive' } },
                    ],
                })),
            },
            include: {
                category: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
                comments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: {
                resolvedAt: 'desc',
            },
            take: limit,
        });

        return tickets;
    } catch (error) {
        console.error('Failed to find similar tickets:', error);
        return [];
    }
}

/**
 * Convert a resolved ticket to a knowledge base article using AI
 * @param {Object} ticket - Ticket object with comments
 * @returns {Promise<{title: string, content: string, summary: string}>}
 */
export async function convertTicketToArticle(ticket) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const commentsText = ticket.comments
            .map(c => `- ${c.content}`)
            .join('\n');

        const prompt = `You are a technical documentation expert. Convert this resolved support ticket into a clean, professional knowledge base article. Remove any personal information (names, emails, specific device IDs). Focus on the problem and solution.

Original Ticket:
Title: ${ticket.title}
Description: ${ticket.description}
${ticket.productName ? `Product: ${ticket.productName}` : ''}
${ticket.componentName ? `Component: ${ticket.componentName}` : ''}

Comments/Resolution:
${commentsText}

Create a knowledge base article with:
1. A clear, concise title (without personal details)
2. A brief summary (1-2 sentences)
3. Detailed content in markdown format with:
   - **Problem**: What was the issue?
   - **Solution**: How was it resolved?
   - **Prevention**: How to avoid this in the future (if applicable)

Respond ONLY with valid JSON in this exact format:
{
  "title": "Article Title",
  "summary": "Brief summary of the issue and solution",
  "content": "# Problem\\n\\nDescription...\\n\\n# Solution\\n\\nSteps...\\n\\n# Prevention\\n\\nTips..."
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI response did not contain valid JSON');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            title: parsed.title || ticket.title,
            summary: parsed.summary || '',
            content: parsed.content || '',
        };
    } catch (error) {
        console.error('Failed to convert ticket to article:', error);
        throw error;
    }
}
