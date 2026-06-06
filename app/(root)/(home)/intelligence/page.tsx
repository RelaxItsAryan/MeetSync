"use client";

import { useState } from "react";
import { useFirebaseUser } from "@/providers/FirebaseAuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Brain, Calendar, ArrowUpRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const IntelligencePage = () => {
  const { user } = useFirebaseUser();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !user?.uid) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch("/api/intelligence/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, userId: user.uid }),
      });
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold lg:text-4xl text-white tracking-tight flex items-center gap-3">
            <Brain className="size-8 text-blue-1" />
            Intelligence
        </h1>
        <p className="text-base font-medium text-zinc-400">Ask anything about your past meetings.</p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-5">
        <div className="flex gap-3 items-center">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-500" />
                <Input
                    placeholder="e.g. What promises did I make last week? What did we discuss about pricing?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-12 h-14 border-none bg-dark-3 focus-visible:ring-1 focus-visible:ring-blue-1 text-lg"
                />
            </div>
            <Button 
                type="submit" 
                disabled={isLoading || !query.trim()}
                className="h-14 px-8 bg-blue-1 hover:bg-blue-600 transition-all text-lg font-semibold"
            >
                {isLoading ? "Searching..." : "Ask"}
            </Button>
        </div>
      </form>

      <div className="flex flex-col gap-6">
        {isLoading && (
            <p className="text-zinc-500 animate-pulse flex items-center gap-2">
                <MessageSquare className="size-4" />
                Searching your meeting memory...
            </p>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
            <p className="text-zinc-500">No memories found for that query.</p>
        )}

        {!isLoading && results.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {results.map((result: any, index: number) => (
                    <div 
                        key={index} 
                        className="flex flex-col justify-between rounded-2xl card-gradient px-7 py-8 border border-white/5 shadow-xl transition-all hover:shadow-2xl hover:border-white/10"
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-xl font-bold text-white">
                                        {result.metadata?.meetingTitle || "Untitled Meeting"}
                                    </h3>
                                    <p className="text-sm text-zinc-500 flex items-center gap-2">
                                        <Calendar className="size-3" />
                                        {result.metadata?.meetingDate ? new Date(result.metadata.meetingDate).toLocaleDateString() : "Unknown Date"}
                                    </p>
                                </div>
                                {result.metadata?.sentiment && (
                                    <span className={cn(
                                        "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                        {
                                            "bg-green-500/10 text-green-500": result.metadata.sentiment === 'positive',
                                            "bg-red-500/10 text-red-500": result.metadata.sentiment === 'negative',
                                            "bg-blue-500/10 text-blue-500": result.metadata.sentiment === 'neutral',
                                            "bg-yellow-500/10 text-yellow-500": result.metadata.sentiment === 'mixed',
                                        }
                                    )}>
                                        {result.metadata.sentiment}
                                    </span>
                                )}
                            </div>
                            
                            <p className="text-zinc-300 line-clamp-4 text-sm italic leading-relaxed">
                                "...{result.content.length > 200 ? result.content.substring(0, 200) + "..." : result.content}..."
                            </p>
                            
                            {result.metadata?.meetingId && (
                                <Link 
                                    href={`/recordings`} 
                                    className="flex items-center gap-2 text-blue-1 text-sm font-semibold hover:underline mt-2"
                                >
                                    View Recording
                                    <ArrowUpRight className="size-3" />
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <footer className="mt-auto pt-10 border-t border-white/5">
        <p className="text-zinc-600 text-xs text-center">
            Powered by <a href="https://github.com/vectorize-io/hindsight" target="_blank" className="text-zinc-400 hover:text-blue-1 transition-colors">Hindsight</a> agent memory
        </p>
      </footer>
    </section>
  );
};

export default IntelligencePage;
