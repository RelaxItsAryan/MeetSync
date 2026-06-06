"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { avatarImages } from "@/constants";
import { useToast } from "./ui/use-toast";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { AnalysisPanel } from "./AnalysisPanel";
import { Sparkles } from "lucide-react";

interface MeetingCardProps {
  id: string;
  type: string;
  title: string;
  date: string;
  icon: string;
  isPreviousMeeting?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
  onDelete?: () => void;
}

const MeetingCard = ({
  id,
  type,
  icon,
  title,
  date,
  isPreviousMeeting,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
  onDelete,
}: MeetingCardProps) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  useEffect(() => {
    const checkAnalysis = async () => {
      if (type !== 'recordings' || !id) return;
      try {
        const docRef = doc(db, 'meeting_analyses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAnalysis(docSnap.data().analysis);
          setHasAnalysis(true);
        }
      } catch (error) {
        console.error("Error checking analysis:", error);
      }
    };

    checkAnalysis();
  }, [id, type]);

  const handleAnalyze = async () => {
    if (hasAnalysis) {
      setIsAnalysisOpen(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_url: link,
          recording_id: id,
          meeting_title: title,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
        setHasAnalysis(true);
        setIsAnalysisOpen(true);
        toast({ title: "Analysis Complete" });
      } else {
        toast({ title: data.error || "Analysis failed", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: error.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="flex min-h-[258px] w-full flex-col justify-between rounded-2xl card-gradient px-7 py-8 xl:max-w-[568px] border border-white/5 shadow-xl transition-all hover:shadow-2xl">
      <article className="flex flex-col gap-5">
        <Image src={icon} alt="upcoming" width={28} height={28} />
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
            <p className="text-base font-medium text-zinc-400">{date}</p>
          </div>
        </div>
      </article>
      <article className={cn("flex justify-center relative", {})}>
        {!isPreviousMeeting && (
          <div className="flex gap-2 w-full justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={handleClick} className="rounded bg-blue-1 px-6">
                {buttonIcon1 && (
                  <Image src={buttonIcon1} alt="feature" width={20} height={20} />
                )}
                &nbsp; {buttonText}
              </Button>

              {type === 'recordings' && (
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="rounded bg-dark-4 px-6 border border-white/10 hover:bg-dark-3 transition-all"
                >
                  {isAnalyzing ? (
                    "Analyzing..."
                  ) : (
                    <>
                      <Sparkles className="size-4 mr-2 text-blue-1" />
                      {hasAnalysis ? "View Analysis" : "Analyze"}
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  toast({
                    title: "Link Copied",
                  });
                }}
                className="bg-dark-4 px-6"
              >
                <Image
                  src="/icons/copy.svg"
                  alt="feature"
                  width={20}
                  height={20}
                />
                &nbsp; Copy Link
              </Button>

              {onDelete && (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }} 
                  className="bg-red-500 hover:bg-red-600 px-3"
                >
                  <Image src="/icons/delete.svg" alt="delete" width={20} height={20} />
                </Button>
              )}
            </div>
          </div>
        )}
      </article>

      {analysis && (
        <AnalysisPanel
          isOpen={isAnalysisOpen}
          onClose={() => setIsAnalysisOpen(false)}
          analysis={analysis}
          title={title}
          recordingId={id}
        />
      )}
    </section>
  );
};

export default MeetingCard;
