'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, RotateCcw, Maximize2, X, CheckCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
};

export default function ChatbotClient({ user }) {
    const getInitialMessage = () => ({
        role: 'assistant',
        content: `👋 Hi! I'm ${user?.username || 'Man'}'s assistant. Ask me anything about ${user?.username || 'Man'}`,
        timestamp: getCurrentTime()
    });

    const [messages, setMessages] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('chatbot_messages');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.length > 0) return parsed;
            }
        }
        return [getInitialMessage()];
    });

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCommands, setShowCommands] = useState(false);
    const messagesEndRef = useRef(null);
    const router = useRouter();

    // Inline Form State
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [inventory, setInventory] = useState([]);
    const [issueType, setIssueType] = useState('inventory');
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedComponent, setSelectedComponent] = useState('');
    const [customProduct, setCustomProduct] = useState('');
    const [ticketTitle, setTicketTitle] = useState('');
    const [ticketDescription, setTicketDescription] = useState('');
    const [ticketPriority, setTicketPriority] = useState('MEDIUM');
    const [ticketHistory, setTicketHistory] = useState([]);

    useEffect(() => {
        // Fetch inventory precisely once for the inline form
        const fetchInventory = async () => {
            try {
                const res = await fetch('/api/inventory');
                if (res.ok) {
                    const data = await res.json();
                    setInventory(data);
                    if (data.length > 0) {
                        setSelectedItem(data[0]);
                    } else {
                        setIssueType('personal');
                    }
                }
            } catch (err) {
                console.error('Failed to fetch inventory:', err);
            }
        };
        fetchInventory();
        const fetchTickets = async () => {
            try {
                const res = await fetch('/api/tickets');
                if (res.ok) {
                    const data = await res.json();
                    setTicketHistory(data);
                }
            } catch (err) {
                console.error('Failed to fetch tickets:', err);
            }
        };
        fetchTickets();
    }, []);

    const handleInlineSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        const formData = new FormData(e.currentTarget);
        let attachmentUrls = [];
        const files = formData.getAll('attachment').filter(f => f.size > 0);

        if (files.length > 0) {
            try {
                const uploadPromises = files.map(async (file) => {
                    const uploadData = new FormData();
                    uploadData.append('file', file);
                    const uploadRes = await fetch('/api/upload', {
                        method: 'POST',
                        body: uploadData,
                    });
                    if (!uploadRes.ok) throw new Error('Upload failed');
                    const uploadJson = await uploadRes.json();
                    return uploadJson.url;
                });
                attachmentUrls = await Promise.all(uploadPromises);
            } catch (err) {
                setFormError('Attachment upload failed. Please try again.');
                setFormLoading(false);
                return;
            }
        }

        const data = {
            title: ticketTitle,
            description: ticketDescription,
            priority: ticketPriority,
            isPersonalIssue: issueType === 'personal' || issueType === 'email',
            inventoryItemId: issueType === 'inventory' ? selectedItem?.id : null,
            productName: issueType === 'inventory' ? `${selectedItem?.brand} ${selectedItem?.model} (${selectedItem?.pid})` : (issueType === 'email' ? 'Email Service' : customProduct),
            componentName: issueType === 'inventory' ? selectedComponent : null,
            attachmentUrls,
        };

        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to create ticket');

            // Success: Add a system message confirming form submittal
            setMessages(prev => prev.filter(m => m.content !== "[CREATE_TICKET_FORM_PLACEHOLDER]").concat({
                role: 'assistant',
                content: `✅ **Ticket Created Successfully!**\n\n**Title:** ${data.title}\nYour request has been logged and our team will be looking into it shortly!`,
                timestamp: getCurrentTime()
            }));

            // Reset Form State
            setTicketTitle('');
            setTicketDescription('');

            router.refresh();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const COMMANDS = [
        { name: '/create_ticket', description: 'Quickly generate a new support ticket', icon: '🎫' },
        { name: '/my_devices', description: 'List all hardware assigned to you', icon: '💻' },
        { name: '/my_tickets', description: 'View your recent open/closed tickets', icon: '📋' },
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        if (val.startsWith('/')) {
            setShowCommands(true);
        } else {
            setShowCommands(false);
        }
    };

    const handleCommandClick = (cmd) => {
        if (cmd.name === '/my_devices' || cmd.name === '/my_tickets') {
            // These can run immediately
            setInput(cmd.name);
            setShowCommands(false);
            const fakeEvent = { preventDefault: () => { } };
            // Need to set timeout so state updates first
            setTimeout(() => {
                const submitBtn = document.getElementById('chat-submit-btn');
                if (submitBtn) submitBtn.click();
            }, 50);
        } else {
            setInput(cmd.name + ' ');
            setShowCommands(false);
            document.getElementById('chat-input-field')?.focus();
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('chatbot_messages', JSON.stringify(messages));
        }
        scrollToBottom();
    }, [messages]);

    const handleClearChat = () => {
        setMessages([getInitialMessage()]);
        localStorage.removeItem('chatbot_messages');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        const newMessages = [...messages, { role: 'user', content: userMessage, timestamp: getCurrentTime() }];
        setMessages(newMessages);
        setIsLoading(true);

        const preDefinedAnswers = [
            {
                keywords: ['hi', 'hello', 'hey', 'greetings', 'hi there'],
                answer: "Hi there! How can I help you today?"
            },
            {
                keywords: ['how are you', 'how are you doing', 'how are you?'],
                answer: "I'm doing great, thanks for asking! I'm here to help you with your IT issues. How can I assist you today?"
            },
            {
                keywords: ['how to create ticket', 'how do i raise a ticket?', 'raise a ticket', 'create a ticket'],
                answer: "You can easily create a new ticket by navigating to the **[Create Ticket](/dashboard/create)** page. Alternatively, you can just tell me the details of your issue right here and I will create it for you!"
            },
            {
                keywords: ['who are you', 'what are you', "what's your name"],
                answer: "I am the AI Support Assistant. I can help answer questions from our Knowledge Base, guide you through the app, or create IT support tickets for you."
            },
            {
                keywords: ['/create_ticket'],
                answer: "[CREATE_TICKET_FORM_PLACEHOLDER]"
            },
            {
                keywords: ['/my_devices'],
                answer: "[MY_DEVICES_PLACEHOLDER]"
            },
            {
                keywords: ['/my_tickets'],
                answer: "[MY_TICKETS_PLACEHOLDER]"
            }
        ];

        const lowerInput = userMessage.toLowerCase().trim();
        const matched = preDefinedAnswers.find(pa => pa.keywords.some(k => lowerInput === k || lowerInput === k + '?'));

        if (matched) {
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'assistant', content: matched.answer, timestamp: getCurrentTime() }]);
                setIsLoading(false);
            }, 600); // Simulate short typing delay for realism
            return;
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: getCurrentTime() }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I encountered an error while trying to process your request. Please try again or contact support if the issue persists.",
                isError: true,
                timestamp: getCurrentTime()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col rounded-xl bg-background font-sans">
            <div className="flex-1 flex flex-col max-w-5xl mx-auto  w-full border-x border-border bg-card shadow-sm relative">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-card border-b border-border sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Bot className="w-6 h-6 text-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2 text-foreground leading-tight">
                                AI Assistant
                            </h1>
                            <p className="text-sm text-muted-foreground">Built by Man Navlakha</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2 sm:mt-0">
                        <button onClick={handleClearChat} title="Refresh Chat" className="p-2 hover:bg-muted rounded-full transition-colors">
                            <RotateCcw className="w-5 h-5" />
                        </button>

                        <Link href="/dashboard/help" title="Close" className="p-2 hover:bg-muted rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 flex flex-col custom-scrollbar">
                    <div className="space-y-6 flex-1 flex flex-col">
                        {messages.map((message, index) => {
                            const isUser = message.role === 'user';
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    key={index}
                                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`max-w-[85%] md:max-w-[70%] rounded-[24px] px-5 py-3.5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] ${isUser
                                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                                        : message.isError
                                            ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-sm'
                                            : 'bg-muted border border-border text-foreground rounded-bl-sm'
                                        }`}>
                                        <div className={`prose prose-base max-w-none ${isUser ? 'prose-invert text-primary-foreground' : 'dark:prose-invert text-foreground'} leading-relaxed`}>
                                            {message.content === "[MY_DEVICES_PLACEHOLDER]" ? (
                                                <div className="flex flex-col gap-4 min-w-[300px] w-full max-w-[600px] bg-background text-foreground p-5 rounded-2xl shadow-sm border border-border">
                                                    <div className="flex items-center gap-3 border-b border-border pb-3">
                                                        <span className="text-2xl">💻</span>
                                                        <div>
                                                            <h4 className="font-bold m-0 text-base">My Assigned Hardware</h4>
                                                            <p className="text-xs text-muted-foreground m-0 leading-tight">Devices and equipment currently assigned to you.</p>
                                                        </div>
                                                    </div>
                                                    {inventory.length > 0 ? (
                                                        <div className="w-full overflow-x-auto custom-scrollbar mt-2">
                                                            <table className="w-full text-sm text-left border-collapse">
                                                                <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-muted/50">
                                                                    <tr>
                                                                        <th className="px-4 py-3 font-bold border-b border-border rounded-tl-xl whitespace-nowrap">Type</th>
                                                                        <th className="px-4 py-3 font-bold border-b border-border whitespace-nowrap">Brand</th>
                                                                        <th className="px-4 py-3 font-bold border-b border-border whitespace-nowrap">Model</th>
                                                                        <th className="px-4 py-3 font-bold border-b border-border whitespace-nowrap">PID</th>
                                                                        <th className="px-4 py-3 font-bold border-b border-border whitespace-nowrap">Status</th>
                                                                        <th className="px-4 py-3 font-bold border-b border-border rounded-tr-xl whitespace-nowrap">Condition</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {inventory.map((item, i) => (
                                                                        <tr key={item.id || i} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                                                                            <td className="px-4 py-3 align-middle font-medium">{item.type}</td>
                                                                            <td className="px-4 py-3 align-middle">{item.brand}</td>
                                                                            <td className="px-4 py-3 align-middle">{item.model}</td>
                                                                            <td className="px-4 py-3 align-middle font-mono text-xs text-muted-foreground">{item.pid}</td>
                                                                            <td className="px-4 py-3 align-middle">
                                                                                <span className={`px-2 py-1 text-[9px] uppercase font-bold tracking-widest rounded-full ${item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                                        item.status === 'IN_STORAGE' ? 'bg-blue-500/10 text-blue-500' :
                                                                                            item.status === 'MAINTENANCE' ? 'bg-amber-500/10 text-amber-500' :
                                                                                                'bg-muted text-muted-foreground'
                                                                                    }`}>
                                                                                    {item.status}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-3 align-middle text-xs">{item.condition}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="py-6 text-center text-sm text-muted-foreground italic bg-muted/20 rounded-xl">
                                                            No devices currently assigned to you.
                                                        </div>
                                                    )}
                                                    <Link href="/dashboard/inventory" className="text-primary hover:text-primary/80 transition-colors text-xs font-bold text-center mt-2 block w-full bg-primary/10 py-2.5 rounded-xl uppercase tracking-widest no-underline">
                                                        View Full Inventory
                                                    </Link>
                                                </div>
                                            ) : message.content === "[MY_TICKETS_PLACEHOLDER]" ? (
                                                <div className="flex flex-col gap-4 min-w-[300px] w-full max-w-[500px] bg-background text-foreground p-5 rounded-2xl shadow-sm border border-border">
                                                    <div className="flex items-center gap-3 border-b border-border pb-3">
                                                        <span className="text-2xl">📋</span>
                                                        <div>
                                                            <h4 className="font-bold m-0 text-base">My Support Tickets</h4>
                                                            <p className="text-xs text-muted-foreground m-0 leading-tight">Your most recent technical requests.</p>
                                                        </div>
                                                    </div>
                                                    {ticketHistory.length > 0 ? (
                                                        <div className="space-y-3 mt-2">
                                                            {ticketHistory.slice(0, 5).map((ticket, i) => (
                                                                <Link href={`/dashboard/tickets/${ticket.id}`} key={ticket.id || i} className="block p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors group no-underline">
                                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                                        <h5 className="font-bold text-sm leading-tight text-foreground group-hover:text-primary transition-colors m-0">{ticket.title}</h5>
                                                                        <span className={`shrink-0 px-2 py-1 text-[9px] uppercase font-bold tracking-widest rounded-full leading-none mt-1 ${ticket.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                                ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500' :
                                                                                    ticket.status === 'RESOLVED' ? 'bg-purple-500/10 text-purple-500' :
                                                                                        'bg-muted text-muted-foreground'
                                                                            }`}>
                                                                            {ticket.status}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium m-0">
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${ticket.priority === 'HIGH' ? 'bg-destructive/10 text-destructive' :
                                                                                ticket.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-foreground'
                                                                            }`}>
                                                                            {ticket.priority}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="py-6 text-center text-sm text-muted-foreground italic bg-muted/20 rounded-xl">
                                                            You don't have any recent tickets.
                                                        </div>
                                                    )}
                                                    <Link href="/dashboard/tickets" className="text-primary hover:text-primary/80 transition-colors text-xs font-bold text-center mt-2 block w-full bg-primary/10 py-2.5 rounded-xl uppercase tracking-widest no-underline">
                                                        View All Tickets
                                                    </Link>
                                                </div>
                                            ) : message.content === "[CREATE_TICKET_FORM_PLACEHOLDER]" ? (
                                                <div className="flex flex-col gap-4 min-w-[300px] w-full max-w-[500px] bg-background text-foreground p-5 rounded-2xl shadow-sm border border-border">
                                                    <div className="flex items-center gap-3 border-b border-border pb-3">
                                                        <span className="text-2xl">🎫</span>
                                                        <div>
                                                            <h4 className="font-bold m-0 text-base">New Support Ticket</h4>
                                                            <p className="text-xs text-muted-foreground m-0 leading-tight">Fill out the details below to submit a request.</p>
                                                        </div>
                                                    </div>

                                                    <form onSubmit={handleInlineSubmit} className="space-y-4 pt-1">
                                                        {formError && (
                                                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">
                                                                {formError}
                                                            </div>
                                                        )}

                                                        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
                                                            <button type="button" onClick={() => setIssueType('inventory')} className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${issueType === 'inventory' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Hardware</button>
                                                            <button type="button" onClick={() => setIssueType('email')} className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${issueType === 'email' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Software</button>
                                                            <button type="button" onClick={() => setIssueType('personal')} className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${issueType === 'personal' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Other</button>
                                                        </div>

                                                        {issueType === 'inventory' && inventory.length > 0 && (
                                                            <select
                                                                className="w-full bg-input/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                                                value={selectedItem?.id || ''}
                                                                onChange={(e) => setSelectedItem(inventory.find(i => i.id === e.target.value))}
                                                            >
                                                                {inventory.map(item => (
                                                                    <option key={item.id} value={item.id}>{item.brand} {item.model} — {item.pid}</option>
                                                                ))}
                                                            </select>
                                                        )}

                                                        {issueType === 'personal' && (
                                                            <input
                                                                type="text" required placeholder="Asset or Service Description"
                                                                value={customProduct} onChange={(e) => setCustomProduct(e.target.value)}
                                                                className="w-full bg-input/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                                            />
                                                        )}

                                                        <input
                                                            type="text" required placeholder="Brief Summary"
                                                            value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)}
                                                            className="w-full bg-input/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                                        />

                                                        <textarea
                                                            required rows={3} placeholder="Describe the issue in detail..."
                                                            value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)}
                                                            className="w-full bg-input/50 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50 resize-none custom-scrollbar"
                                                        />

                                                        <div className="flex gap-3">
                                                            <select
                                                                value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)}
                                                                className="flex-1 bg-input/50 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50"
                                                            >
                                                                <option value="LOW">LOW PRIORITY</option>
                                                                <option value="MEDIUM">MEDIUM PRIORITY</option>
                                                                <option value="HIGH">HIGH PRIORITY</option>
                                                            </select>

                                                            <div className="flex-1 relative">
                                                                <input
                                                                    type="file" name="attachment" multiple
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                />
                                                                <div className="w-full h-full border border-border bg-input/50 rounded-xl flex items-center justify-center text-xs text-muted-foreground hover:bg-muted font-medium transition-colors">
                                                                    📎 Attach File(s)
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="submit"
                                                            disabled={formLoading || !ticketTitle || !ticketDescription}
                                                            className="w-full h-10 mt-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                            {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                                            {formLoading ? 'Submitting...' : 'Submit Ticket'}
                                                        </button>
                                                    </form>
                                                </div>
                                            ) : (
                                                <ReactMarkdown
                                                    components={{
                                                        table: ({ node, ...props }) => <div className="w-full overflow-x-auto my-4"><table className="w-full text-sm text-left border-collapse" {...props} /></div>,
                                                        thead: ({ node, ...props }) => <thead className="text-xs uppercase bg-black/5 dark:bg-white/5" {...props} />,
                                                        th: ({ node, ...props }) => <th className="px-4 py-3 border border-border/50 font-semibold" {...props} />,
                                                        td: ({ node, ...props }) => <td className="px-4 py-3 border border-border/50" {...props} />,
                                                        a: ({ node, ...props }) => <a {...props} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-4 transition-colors font-medium break-all" target={props.href?.startsWith('/') ? "_self" : "_blank"} rel="noreferrer" />,
                                                        code: ({ node, inline, ...props }) => inline ? <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[13px]" {...props} /> : <pre className="bg-black/5 dark:bg-white/5 p-4 rounded-xl overflow-x-auto text-sm my-4 custom-scrollbar"><code {...props} /></pre>
                                                    }}
                                                >
                                                    {message.content}
                                                </ReactMarkdown>
                                            )}
                                        </div>
                                    </div>
                                    {/* Timestamp */}
                                    <div className={`text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5 ${isUser ? 'pr-2' : 'pl-2'}`}>
                                        {message.timestamp || getCurrentTime()}
                                        {isUser && <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                    </div>

                                    {/* Quick Questions below first message */}
                                    {!isUser && index === 0 && messages.length === 1 && !isLoading && (
                                        <div className="flex flex-col items-start gap-2.5 mt-5 pl-2">
                                            {['How to set new product into my inventory?', 'How to view tickets', 'How to create a ticket'].map((q, i) => (
                                                <motion.button
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 + 0.3 }}
                                                    key={i}
                                                    onClick={() => setInput(q)}
                                                    className="bg-card border border-border text-foreground px-4 py-2.5 rounded-full text-[13px] md:text-sm hover:bg-muted transition-colors shadow-sm"
                                                >
                                                    {q}
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-start"
                            >
                                <div className="bg-muted border border-border text-muted-foreground px-5 py-3.5 rounded-[24px] rounded-bl-sm shadow-sm text-sm font-medium tracking-wide">
                                    Typing...
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>

                {/* Input Area */}
                <div className="px-4 md:px-8 pb-6 pt-2 bg-transparent z-10 w-full mb-2 relative">

                    {/* Slash Commands Dropdown */}
                    {showCommands && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-full left-4 md:left-8 right-4 md:right-8 mb-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-20"
                        >
                            <div className="p-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Available Commands</p>
                                {COMMANDS.filter(c => c.name.startsWith(input)).map((cmd, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleCommandClick(cmd)}
                                        className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg transition-colors group"
                                    >
                                        <span className="text-xl">{cmd.icon}</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{cmd.name}</span>
                                            <span className="text-xs text-muted-foreground">{cmd.description}</span>
                                        </div>
                                    </button>
                                ))}
                                {COMMANDS.filter(c => c.name.startsWith(input)).length === 0 && (
                                    <div className="text-xs text-muted-foreground px-3 py-2 italic">No commands match...</div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="relative w-full">
                        <input
                            id="chat-input-field"
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Type '/' for commands..."
                            disabled={isLoading}
                            autoComplete="off"
                            className="w-full bg-input/20 border border-border rounded-full py-4 pl-6 pr-14 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-border shadow-sm transition-all disabled:opacity-50"
                        />
                        <button
                            id="chat-submit-btn"
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-primary hover:opacity-90 text-primary-foreground rounded-full transition-opacity disabled:opacity-50"
                        >
                            <Send className="w-5 h-5 ml-1 mt-0.5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
