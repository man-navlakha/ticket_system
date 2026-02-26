import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured." }, { status: 500 });
        }

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
        }

        const body = await req.json();
        const { messages } = body;

        // 1. Fetch User's Data / Context
        const userTickets = await prisma.ticket.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, title: true, status: true, priority: true }
        });

        const userDevices = await prisma.inventoryItem.findMany({
            where: { userId: user.id },
            select: { pid: true, brand: true, model: true, type: true, status: true, condition: true, serialNumber: true }
        });

        // 2. Fetch Knowledge Base Articles
        const kbArticles = await prisma.knowledgeBaseArticle.findMany({
            where: { published: true },
            select: { title: true, summary: true, content: true },
            take: 10 // Limiting to top 10 for context window optimization
        });

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);

        // Define System Prompt with Data Context
        const systemInstruction = `You are an intelligent IT Support Assistant. 
Name of the user you are talking to: ${user.username}
Email: ${user.email}

User's Assigned Devices (Inventory):
${userDevices.length > 0 ? JSON.stringify(userDevices, null, 2) : "No devices assigned to this user."}

User's Recent Tickets:
${userTickets.length > 0 ? JSON.stringify(userTickets, null, 2) : "No previous tickets."}

Knowledge Base Articles (Use these to answer questions!):
${kbArticles.length > 0 ? JSON.stringify(kbArticles, null, 2) : "No KB articles available."}

Sitemap / Available Navigation Links:
- Dashboard (Home): \`/dashboard\`
- View Tickets: \`/dashboard/tickets\`
- Create Ticket: \`/dashboard/create\`
- Inventory: \`/dashboard/inventory\`
- Knowledge Base: \`/dashboard/knowledge-base\`
- Proposals: \`/dashboard/proposals\`
- System Reports: \`/dashboard/system-reports\`
- User Settings/Profile: \`/dashboard/profile\`
- Team Directory: \`/dashboard/team\`

Your goals:
1. Provide troubleshooting steps and answer questions by strictly using the "Knowledge Base Articles" provided above if applicable. If the answer is in the KB, summarize it nicely using markdown format.
2. If the user refers to their past issues or wants to see their tickets using \`/my_tickets\`, use the Recent Tickets data above to give context-aware answers formatted perfectly as a Markdown table.
3. If the user asks where to find something or needs to navigate, provide the correct link from the Sitemap above.
4. If the user asks for their devices using \`/my_devices\`, use the Assigned Devices data above. ALWAYS format it as a distinct Markdown table with proper newlines between rows, like so:
| Type | Brand | Model | PID | Status | Condition |
|---|---|---|---|---|---|
| LAPTOP | Apple | MacBook Pro | EP-001 | ACTIVE | EXCELLENT |

5. If the user reports a problem (like a broken laptop, etc.), first kindly ask them to create a ticket on \`/dashboard/create\`, or offer saying "I can also create a ticket for you right now, just say yes!".
6. If they explicitly ask YOU to create a ticket, use the 'createTicket' tool to generate one. Make sure you have their issue title and description before calling it.`;

        // Define Tools (Function Calling)
        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "createTicket",
                        description: "Use this to create a new support ticket in the database. Ensure you have a clear title and description from the user before calling this.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                title: { type: "STRING", description: "Short summary of the issue." },
                                description: { type: "STRING", description: "Detailed description of the problem." },
                                priority: { type: "STRING", description: "Priority: LOW, MEDIUM, or HIGH" }
                            },
                            required: ["title", "description", "priority"]
                        }
                    }
                ]
            }
        ];

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction,
            tools
        });

        // Format History
        const formattedMessages = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // Generate content
        const result = await model.generateContent({ contents: formattedMessages });
        const response = await result.response;

        // Handle Function Call if Gemini decides to create a ticket
        const functionCalls = response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];

            if (call.name === "createTicket") {
                const { title, description, priority } = call.args;

                // Save to Database
                const newTicket = await prisma.ticket.create({
                    data: {
                        title,
                        description,
                        priority: priority || "MEDIUM",
                        status: "OPEN",
                        userId: user.id
                    }
                });

                // Add the model's function call to history
                formattedMessages.push(response.candidates[0].content);

                // Add the function execution result back
                formattedMessages.push({
                    role: "function",
                    parts: [{
                        functionResponse: {
                            name: "createTicket",
                            response: { success: true, message: "Ticket created successfully.", ticketId: newTicket.id }
                        }
                    }]
                });

                // Get final text response from Gemini
                const secondResult = await model.generateContent({ contents: formattedMessages });
                return NextResponse.json({ reply: secondResult.response.text() });
            }
        }

        // Normal text response
        const text = response.text();
        return NextResponse.json({ reply: text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "Internal server error connecting to AI service." },
            { status: 500 }
        );
    }
}
