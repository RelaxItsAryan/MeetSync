'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { MessageSquare, Send, User, Bot, Loader2, Sparkles, CheckCircle, ListTodo, AlertTriangle, Quote, Info } from 'lucide-react';

interface AnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: any;
  title: string;
  recordingId: string;
}

const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
  const styles: Record<string, string> = {
    positive: 'bg-green-500/20 text-green-400 border-green-500/30',
    neutral: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    negative: 'bg-red-500/20 text-red-400 border-red-500/30',
    mixed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border', styles[sentiment?.toLowerCase()] || styles.neutral)}>
      {sentiment || 'Neutral'}
    </span>
  );
};

export const AnalysisPanel = ({ isOpen, onClose, analysis, title, recordingId }: AnalysisPanelProps) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!analysis) return null;

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    try {
      const response = await fetch('/api/chat-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recording_id: recordingId,
          message: userMessage,
          history: messages,
        }),
      });

      const data = await response.json();
      if (data.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Sorry, I encountered an error answering your question.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl bg-[#1C1F2E] border-l-white/5 text-white overflow-hidden flex flex-col p-0 shadow-2xl">
        <SheetHeader className="p-8 border-b border-white/5 shrink-0 bg-[#1C1F2E]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-1/20 p-2 rounded-lg border border-blue-1/30">
              <Sparkles className="w-5 h-5 text-blue-1" />
            </div>
            <SheetTitle className="text-2xl font-bold text-white tracking-tight leading-none italic font-serif">
              Meeting Intelligence
            </SheetTitle>
          </div>
          <SheetDescription className="text-zinc-400 text-sm font-medium">
            Recording: {title}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar space-y-12">
          <div className="space-y-12">
            {/* Header / Top Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <SentimentBadge sentiment={analysis.sentiment} />
                  <div className="h-4 w-px bg-white/10" />
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-bold text-zinc-500 uppercase tracking-tighter">Meeting Score</span>
                     <span className="text-xl font-extrabold text-blue-1">{analysis.overall_score || 0}/10</span>
                  </div>
               </div>
               <div className="text-[10px] font-bold text-zinc-500 bg-white/5 px-2.5 py-1 rounded uppercase tracking-widest border border-white/5">
                  Stage: {analysis.deal_stage?.replace(/_/g, ' ') || 'N/A'}
               </div>
            </div>

            {/* Summary */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-blue-1 uppercase tracking-[0.2em] flex items-center gap-2 opacity-80 font-serif italic">
                <Info className="w-3.5 h-3.5" /> Executive Summary
              </h3>
              <p className="text-lg leading-relaxed text-zinc-200 font-light italic bg-white/5 p-6 rounded-2xl border border-white/5">
                "{analysis.summary}"
              </p>
            </section>

            {/* Next Steps */}
            <section className="space-y-5">
              <h3 className="text-xs font-bold text-blue-1 uppercase tracking-[0.2em] flex items-center gap-2 opacity-80 font-serif italic">
                <ListTodo className="w-3.5 h-3.5" /> Action Items
              </h3>
              <ul className="space-y-4">
                {analysis.next_steps?.map((step: string, idx: number) => (
                  <li key={idx} className="flex gap-4 items-start group">
                    <span className="flex-none w-6 h-6 rounded-lg bg-blue-1/10 border border-blue-1/20 text-blue-1 text-[11px] flex items-center justify-center font-bold mt-0.5 group-hover:bg-blue-1 group-hover:text-white transition-all">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-zinc-300 py-1 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Promises Made */}
            <section className="space-y-5">
              <h3 className="text-xs font-bold text-blue-1 uppercase tracking-[0.2em] flex items-center gap-2 opacity-80 font-serif italic">
                <CheckCircle className="w-3.5 h-3.5" /> Promises & Commitments
              </h3>
              <div className="grid gap-4">
                {analysis.promises_made?.map((promise: any, idx: number) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-3 hover:border-blue-1/30 transition-all">
                    <p className="text-sm text-zinc-200 leading-relaxed font-medium">{promise.promise}</p>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-blue-1/80 uppercase tracking-widest">OWNER: {promise.by}</span>
                      {promise.deadline && (
                        <span className="text-zinc-500 bg-white/5 px-2 py-1 rounded border border-white/10">DEADLINE: {promise.deadline}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Risk Flags */}
            {analysis.risk_flags && analysis.risk_flags.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-[0.2em] flex items-center gap-2 font-serif italic">
                  <AlertTriangle className="w-3.5 h-3.5" /> High Risk Flags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.risk_flags.map((flag: string, idx: number) => (
                    <span key={idx} className="bg-red-500/10 text-red-400 text-[10px] px-3 py-1.5 rounded-lg border border-red-500/20 font-bold uppercase tracking-wider">
                      {flag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Key Quotes */}
            <section className="space-y-5">
              <h3 className="text-xs font-bold text-blue-1 uppercase tracking-[0.2em] flex items-center gap-2 opacity-80 font-serif italic">
                <Quote className="w-3.5 h-3.5" /> Key Moments
              </h3>
              <div className="space-y-5">
                {analysis.key_quotes?.map((quote: string, idx: number) => (
                  <div key={idx} className="relative pl-8 py-1">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-1/20 rounded-full" />
                    <p className="text-sm italic text-zinc-400 leading-relaxed">"{quote}"</p>
                  </div>
                ))}
              </div>
            </section>

             {/* Chat Interface Section */}
             <section className="space-y-6 pt-12 mt-12 border-t border-white/5">
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-bold text-blue-1 uppercase tracking-[0.2em] flex items-center gap-2 font-serif italic">
                    <MessageSquare className="w-4 h-4" /> Chat with Intelligence
                  </h3>
                  <p className="text-[11px] text-zinc-500 leading-none">Ask any question based on the recording's full transcript</p>
                </div>

                <div className="bg-dark-1/40 rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-[400px]">
                  {/* Messages Area */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[450px] custom-scrollbar">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="bg-blue-1/10 p-4 rounded-full mb-4">
                          <Bot className="w-8 h-8 text-blue-1/40" />
                        </div>
                        <p className="text-sm text-zinc-500 italic max-w-[200px]">
                          How can I help you understand this meeting better?
                        </p>
                      </div>
                    )}
                    {messages.map((msg: { role: string; content: string }, idx: number) => (
                      <div key={idx} className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                        <div className={cn("flex-none w-8 h-8 rounded-full flex items-center justify-center", 
                          msg.role === 'user' ? "bg-blue-1" : "bg-dark-3")}>
                          {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-blue-1" />}
                        </div>
                        <div className={cn("p-3 rounded-2xl text-sm leading-relaxed", 
                          msg.role === 'user' ? "bg-blue-1/10 text-white rounded-tr-none border border-blue-1/20" : "bg-dark-2 text-zinc-300 rounded-tl-none border border-white/5")}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isSending && (
                      <div className="flex gap-3">
                        <div className="flex-none w-8 h-8 rounded-full bg-dark-3 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-blue-1" />
                        </div>
                        <div className="bg-dark-2 p-3 rounded-2xl rounded-tl-none border border-white/5">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-1" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-dark-2/50 border-t border-white/5">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask about the meeting..."
                        className="flex-1 bg-dark-3 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-1/50 transition-all placeholder:text-zinc-600"
                        disabled={isSending}
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={isSending || !input.trim()}
                        className="bg-blue-1 hover:bg-blue-1/90 disabled:opacity-50 disabled:hover:bg-blue-1 text-white p-2.5 rounded-xl transition-all shadow-lg"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
             </section>

            {/* Topics Discussed */}
            <section className="space-y-4 pt-10 border-t border-white/5 pb-10">
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] leading-none mb-4">Agenda & Topics</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.topics_discussed?.map((topic: string, idx: number) => (
                  <span key={idx} className="bg-white/5 text-zinc-500 text-[10px] px-2.5 py-1 rounded-md border border-white/5 font-medium transition-all hover:bg-white/10 hover:text-zinc-300 cursor-default">
                    {topic}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
