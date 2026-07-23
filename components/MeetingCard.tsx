"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { useFirebaseUser } from "@/providers/FirebaseAuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Sparkles, Loader2 } from "lucide-react";
import { AnalysisPanel } from "./AnalysisPanel";

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
  const { user } = useFirebaseUser();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  useEffect(() => {
    if (isPreviousMeeting && id && user) {
      const fetchAnalysis = async () => {
        try {
          const docRef = doc(db, "meeting_analyses", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAnalysis({
              ...data.analysis,
              transcript: data.transcript
            });
          }
        } catch (err) {
          console.error("Error fetching analysis:", err);
        }
      };
      fetchAnalysis();
    }
  }, [id, isPreviousMeeting, user]);

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (analysis) {
      setIsAnalysisOpen(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: link,
          recording_id: id,
          meeting_title: title,
          meeting_date: date,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("API Error Response:", text);
        throw new Error(`Server returned ${response.status}: ${text.slice(0, 100)}...`);
      }

      const data = await response.json();
      if (data.success) {
        // Save to Firestore from the client where user is authenticated
        try {
          await setDoc(doc(db, "meeting_analyses", id), {
            analysis: data.analysis,
            transcript: data.transcript,
            video_url: link,
            meeting_title: title,
            userId: user?.uid,
            analyzed_at: serverTimestamp(),
          });
        } catch (firestoreErr) {
          console.error("Client-side Firestore save failed:", firestoreErr);
        }

        setAnalysis({
          ...data.analysis,
          transcript: data.transcript
        });
        setIsAnalysisOpen(true);
        toast({ title: "Analysis Complete", description: "Meeting memory synced to Hindsight." });
      } else {
        throw new Error(data.error);
      }

    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
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

        {isPreviousMeeting && (
          <div className="flex gap-2 w-full justify-between items-center">
             <div className="flex gap-2 items-center">
                <Button onClick={handleClick} className="rounded bg-blue-1 px-6">
                    <Image src="/icons/play.svg" alt="play" width={20} height={20} />
                    &nbsp; Play
                </Button>
                
                <Button 
                    onClick={handleAnalyze} 
                    disabled={isAnalyzing}
                    className={cn(
                        "rounded px-6 border border-blue-1/20 transition-all",
                        analysis ? "bg-blue-1/10 text-blue-1 hover:bg-blue-1/20" : "bg-dark-3 text-white hover:bg-dark-4"
                    )}
                >
                    {isAnalyzing ? (
                        <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                        <Sparkles className={cn("size-4 mr-2", analysis ? "text-blue-1" : "text-zinc-500")} />
                    )}
                    {analysis ? "View Insights" : "Analyze"}
                </Button>
             </div>

             <div className="flex gap-2">
                <Button
                    onClick={() => {
                        navigator.clipboard.writeText(link);
                        toast({ title: "Link Copied" });
                    }}
                    className="bg-dark-4 px-4"
                >
                    <Image src="/icons/copy.svg" alt="copy" width={20} height={20} />
                </Button>

                {onDelete && (
                    <Button onClick={onDelete} className="bg-red-500 hover:bg-red-600 px-3">
                        <Image src="/icons/delete.svg" alt="delete" width={20} height={20} />
                    </Button>
                )}
             </div>
          </div>
        )}
      </article>

      <AnalysisPanel 
        isOpen={isAnalysisOpen} 
        onClose={() => setIsAnalysisOpen(false)} 
        analysis={analysis} 
        title={title} 
        recordingId={id} 
      />
    </section>
  );
};

export default MeetingCard;
