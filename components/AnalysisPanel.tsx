"use client";

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { 
  BadgeCheck, 
  Target, 
  Users, 
  AlertTriangle, 
  Quote, 
  TrendingUp, 
  BrainCircuit,
  Calendar,
  Send,
  User,
  Bot,
  MessageSquare,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface AnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: any;
  title: string;
  recordingId: string;
}

export const AnalysisPanel = ({
  isOpen,
  onClose,
  analysis,
  title,
  recordingId,
}: AnalysisPanelProps) => {
  const [activeTab, setActiveTab] = useState<"analysis" | "chat">("analysis");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (!analysis) return null;

  const sentimentColors: any = {
    positive: "bg-green-500/10 text-green-500 border-green-500/20",
    negative: "bg-red-500/10 text-red-500 border-red-500/20",
    neutral: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    mixed: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat-recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recording_id: recordingId,
          message: userMessage,
          history: messages,
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[540px] bg-dark-2 border-white/5 text-white flex flex-col p-0">
        <SheetHeader className="p-8 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-1/10">
               <BrainCircuit className="size-6 text-blue-1" />
            </div>
            <div className="flex flex-col text-left">
                <SheetTitle className="text-2xl font-bold text-white leading-tight">{title}</SheetTitle>
                <SheetDescription className="text-zinc-500">AI Intelligence Analysis</SheetDescription>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-4 border-b border-white/5 mt-6">
            <button 
                onClick={() => setActiveTab("analysis")}
                className={cn(
                    "pb-3 text-sm font-semibold transition-all border-b-2",
                    activeTab === "analysis" ? "text-blue-1 border-blue-1" : "text-zinc-500 border-transparent hover:text-zinc-300"
                )}
            >
                Analysis
            </button>
            <button 
                onClick={() => setActiveTab("chat")}
                className={cn(
                    "pb-3 text-sm font-semibold transition-all border-b-2",
                    activeTab === "chat" ? "text-blue-1 border-blue-1" : "text-zinc-500 border-transparent hover:text-zinc-300"
                )}
            >
                Ask Questions
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {activeTab === "analysis" ? (
                <div className="flex flex-col gap-8 pb-10">
                  <div className="flex gap-2 items-center">
                    {analysis.sentiment && (
                        <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                            sentimentColors[analysis.sentiment] || sentimentColors.neutral
                        )}>
                            {analysis.sentiment} Sentiment
                        </span>
                    )}
                    {analysis.deal_stage && analysis.deal_stage !== 'not_applicable' && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 bg-white/5 text-zinc-400">
                            {analysis.deal_stage.replace('_', ' ')}
                        </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Target className="size-4" /> Summary
                    </h3>
                    <p className="text-zinc-200 leading-relaxed italic border-l-2 border-blue-1/30 pl-4 py-1 text-sm">
                        {analysis.summary}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="size-4 text-orange-1" /> Commitments & Dates
                        </h3>
                        <div className="flex flex-col gap-3">
                            {analysis.promises_made?.map((p: any, i: number) => (
                                <div key={i} className="text-sm border border-white/5 bg-white/5 p-4 rounded-xl flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-orange-1">{p.by}</span>
                                        {p.deadline && p.deadline !== 'not specified' && (
                                            <span className="text-[10px] bg-orange-1/10 text-orange-1 px-2 py-0.5 rounded border border-orange-1/20 flex items-center gap-1 uppercase font-bold">
                                                <Clock className="size-3" /> {p.deadline}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-zinc-300">{p.promise}</p>
                                </div>
                            ))}
                        </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <BadgeCheck className="size-4 text-green-500" /> Action Items
                        </h3>
                        <ul className="flex flex-col gap-2">
                            {analysis.next_steps?.map((step: string, i: number) => (
                                <li key={i} className="text-sm text-zinc-300 bg-white/5 p-3 rounded-lg border border-white/5">
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>
                  </div>

                  {/* Topics & Participants */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="size-4" /> Topics
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {analysis.topics_discussed?.map((topic: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-dark-3 text-zinc-400 text-[10px] rounded border border-white/10 uppercase font-semibold">
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Users className="size-4" /> Participants
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {analysis.participants?.map((p: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-dark-3 text-zinc-400 text-[10px] rounded border border-white/10 uppercase font-semibold">
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                  </div>

                  {analysis.risk_flags?.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-red-500/70 uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle className="size-4" /> Risk Flags
                        </h3>
                        <div className="flex flex-col gap-2">
                            {analysis.risk_flags.map((risk: string, i: number) => (
                                <div key={i} className="text-xs text-red-400 bg-red-500/5 p-2 rounded border border-red-500/10">
                                    {risk}
                                </div>
                            ))}
                        </div>
                      </div>
                  )}

                  {analysis.key_quotes?.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Quote className="size-4" /> Key Quotes
                        </h3>
                        <div className="flex flex-col gap-3">
                            {analysis.key_quotes.map((quote: string, i: number) => (
                                <p key={i} className="text-sm text-zinc-400 italic font-medium leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                                    "{quote}"
                                </p>
                            ))}
                        </div>
                      </div>
                  )}
                </div>
            ) : (
                <div className="flex flex-col h-full gap-4">
                  <div className="rounded-lg bg-blue-1/5 p-4 border border-blue-1/10 mb-2">
                    <p className="text-xs text-blue-1/80 font-medium">
                        Ask about specific topics, speaker statements, or details not covered in the summary.
                    </p>
                  </div>
                  
                  <div 
                    ref={scrollRef}
                    className="flex-1 flex flex-col gap-4 overflow-y-auto pb-4 custom-scrollbar"
                  >
                    {messages.length === 0 && (
                         <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4 mt-20">
                            <MessageSquare className="size-12" />
                            <p className="text-sm font-medium">No messages yet</p>
                         </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={cn(
                            "flex gap-3 max-w-[85%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}>
                            <div className={cn(
                                "p-2 rounded-lg size-10 flex-shrink-0 flex items-center justify-center",
                                msg.role === 'user' ? "bg-blue-1" : "bg-dark-3 border border-white/5"
                            )}>
                                {msg.role === 'user' ? <User className="size-5" /> : <Bot className="size-5 text-blue-1" />}
                            </div>
                            <div className={cn(
                                "p-4 rounded-2xl text-sm leading-relaxed",
                                msg.role === 'user' ? "bg-blue-1 text-white rounded-tr-none" : "bg-dark-3 text-zinc-200 border border-white/5 rounded-tl-none"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-3 mr-auto">
                            <div className="bg-dark-3 border border-white/5 p-2 rounded-lg size-10 flex items-center justify-center">
                                <Bot className="size-5 text-blue-1" />
                            </div>
                            <div className="bg-dark-3 border border-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1">
                                <div className="size-1.5 bg-blue-1/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="size-1.5 bg-blue-1/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="size-1.5 bg-blue-1/50 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-auto bg-dark-2 sticky bottom-0 flex gap-2">
                    <Input 
                        placeholder="Ask a question..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="bg-dark-3 border-none focus-visible:ring-1 focus-visible:ring-blue-1"
                    />
                    <Button 
                        size="icon" 
                        onClick={handleSendMessage}
                        disabled={isTyping || !chatInput.trim()}
                        className="bg-blue-1 hover:bg-blue-600"
                    >
                        <Send className="size-4" />
                    </Button>
                  </div>
                </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
