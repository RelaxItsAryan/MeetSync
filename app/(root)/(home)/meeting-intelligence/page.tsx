'use client';

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Key,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Users,
  Clock,
  Copy,
  FileText,
  Smile,
  Compass,
  HelpCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Send,
  Check,
  Calendar,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { useFirebaseUser } from '@/providers/FirebaseAuthProvider';
import { extractCommitments, analyzeAccountability, prepareMeetingBriefing } from '@/actions/ai.actions';

const MeetingIntelligencePage = () => {
  const { toast } = useToast();

  const { user } = useFirebaseUser();

  // State variables
  const [meetings, setMeetings] = useState<any[]>([]);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [activeMeetingTitle, setActiveMeetingTitle] = useState<string>('');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  
  // New meeting inputs
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingParticipants, setNewMeetingParticipants] = useState('');
  
  // Live session inputs
  const [currentSpeaker, setCurrentSpeaker] = useState('Alice');
  const [currentText, setCurrentText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState<any[]>([]);

  // Page output states
  const [transcriptInput, setTranscriptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [accountabilityResult, setAccountabilityResult] = useState<any | null>(null);
  const [prepBriefing, setPrepBriefing] = useState<any | null>(null);
  const [isPrepLoading, setIsPrepLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'decisions' | 'risks' | 'commitments' | 'accountability' | 'briefing' | 'json'>('summary');
  const [copied, setCopied] = useState(false);

  // Subscribe to all meetings from Firestore for left sidebar
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "meetings"),
      where("creatorId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMeetings = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt ? (data.createdAt as any).toDate() : new Date()
        };
      });
      setMeetings(fetchedMeetings);
    }, (error) => {
      console.error("Firestore error loading meetings:", error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Subscribe to the active meeting transcript in real-time
  useEffect(() => {
    if (!activeMeetingId) return;

    const unsubscribe = onSnapshot(doc(db, "meetings", activeMeetingId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const transcriptArr = data.transcript || [];
        setLiveTranscript(transcriptArr);
        setTranscriptInput(transcriptArr.map((t: any) => `${t.speaker}: ${t.text}`).join('\n'));
      }
    }, (error) => {
      console.error("Firestore error listening to active transcript:", error);
    });

    return () => unsubscribe();
  }, [activeMeetingId]);

  // Helper to format Date
  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date instanceof Date ? date : (date.toDate ? date.toDate() : new Date(date));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Copy JSON to clipboard
  const handleCopyJSON = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(JSON.stringify(analysisResult, null, 2));
    setCopied(true);
    toast({
      title: "Copied!",
      description: "JSON representation copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Start meeting
  const handleStartMeeting = async () => {
    if (!user?.uid) {
      toast({
        title: "Unauthorized",
        description: "Please sign in to start a meeting.",
        variant: "destructive"
      });
      return;
    }
    if (!newMeetingTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a meeting title.",
        variant: "destructive"
      });
      return;
    }

    try {
      const participantsArray = newMeetingParticipants
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const docRef = await addDoc(collection(db, "meetings"), {
        title: newMeetingTitle.trim(),
        createdAt: serverTimestamp(),
        meetingDate: serverTimestamp(),
        participants: participantsArray,
        transcript: [],
        status: "active",
        creatorId: user.uid
      });

      setActiveMeetingId(docRef.id);
      setActiveMeetingTitle(newMeetingTitle.trim());
      setLiveTranscript([]);
      setNewMeetingTitle('');
      setNewMeetingParticipants('');
      
      // Reset output states
      setAnalysisResult(null);
      setAccountabilityResult(null);
      setPrepBriefing(null);
      setTranscriptInput('');
      setSelectedMeetingId(null);

      toast({
        title: "Meeting Started",
        description: `"${newMeetingTitle.trim()}" is now active. Transcript collection initialized.`,
      });
    } catch (error: any) {
      console.error("Error starting meeting:", error);
      toast({
        title: "Start Failed",
        description: error.message || "Failed to create meeting in Firestore.",
        variant: "destructive"
      });
    }
  };

  // Append a live transcript line
  const handleAddTranscriptLine = async () => {
    if (!activeMeetingId) return;
    if (!currentSpeaker.trim() || !currentText.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please enter both speaker name and text.",
        variant: "destructive"
      });
      return;
    }

    try {
      const meetingRef = doc(db, "meetings", activeMeetingId);
      const newEntry = {
        speaker: currentSpeaker.trim(),
        text: currentText.trim(),
        timestamp: new Date().toISOString()
      };

      await updateDoc(meetingRef, {
        transcript: arrayUnion(newEntry)
      });

      setCurrentText('');
    } catch (error: any) {
      console.error("Error adding transcript line:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to append transcript entry.",
        variant: "destructive"
      });
    }
  };

  const handleKeyDownText = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTranscriptLine();
    }
  };

  // End meeting & run full agent workflow
  const handleEndMeeting = async () => {
    if (!activeMeetingId) return;

    if (liveTranscript.length === 0) {
      toast({
        title: "Empty Transcript",
        description: "Cannot process a meeting with no transcript entries.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);

    const steps = [
      "Gathering meeting transcript...",
      "Extracting meeting & commitment intelligence (Agent 1 & 2)...",
      "Fetching historical commitments...",
      "Running accountability engine (Agent 3)...",
      "Preparing meeting briefing (Agent 4)...",
      "Saving results to Firestore..."
    ];

    const interval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);

    try {
      const transcriptText = liveTranscript.map(t => `${t.speaker}: ${t.text}`).join('\n');
      const meetingId = activeMeetingId;

      // 1. Process Agent 1 & 2 (extractCommitments)
      setLoadingStep(1);
      const parsedAnalysis = await extractCommitments(transcriptText);

      // 2. Fetch historical commitments from database
      setLoadingStep(2);
      const commitSnap = await getDocs(collection(db, "commitment_intelligence"));
      const pastCommitments: any[] = [];
      commitSnap.forEach(d => {
        const data = d.data();
        if (data.meetingId !== meetingId && Array.isArray(data.commitments)) {
          pastCommitments.push(...data.commitments);
        }
      });

      // 3. Process Agent 3 (analyzeAccountability)
      setLoadingStep(3);
      const accountabilityOutput = await analyzeAccountability(
        parsedAnalysis,
        parsedAnalysis.commitments || [],
        pastCommitments,
        new Date().toISOString().split('T')[0]
      );

      // 4. Process Agent 4 (prepareMeetingBriefing)
      setLoadingStep(4);
      const contactHistory = {
        participants: parsedAnalysis.participants || [],
        past_meetings_count: pastCommitments.length ? Math.round(pastCommitments.length / 3) + 1 : 1,
        last_interaction: new Date().toISOString().split('T')[0],
        channels: ["Slack", "Zoom", "Email"]
      };
      const prepOutput = await prepareMeetingBriefing(
        parsedAnalysis,
        parsedAnalysis.commitments || [],
        accountabilityOutput,
        contactHistory
      );

      // 5. Save everything to Firestore
      setLoadingStep(5);
      
      // Save meeting_intelligence
      await setDoc(doc(db, "meeting_intelligence", meetingId), {
        meetingId,
        meeting_summary: parsedAnalysis.meeting_summary || "",
        key_topics: parsedAnalysis.key_topics || [],
        decisions: parsedAnalysis.decisions || [],
        risks: parsedAnalysis.risks || [],
        blockers: parsedAnalysis.blockers || [],
        questions_raised: parsedAnalysis.questions_raised || [],
        participants: parsedAnalysis.participants || [],
        important_context: parsedAnalysis.important_context || [],
        follow_up_topics: parsedAnalysis.follow_up_topics || [],
        meeting_outcome: parsedAnalysis.meeting_outcome || "",
        sentiment: parsedAnalysis.sentiment || null
      });

      // Save commitment_intelligence
      await setDoc(doc(db, "commitment_intelligence", meetingId), {
        meetingId,
        commitments: parsedAnalysis.commitments || []
      });

      // Save accountability_engine
      await setDoc(doc(db, "accountability_engine", meetingId), {
        meetingId,
        open_commitments: accountabilityOutput.open_commitments || [],
        overdue_commitments: accountabilityOutput.overdue_commitments || [],
        reliability_scores: accountabilityOutput.reliability_scores || [],
        repeated_patterns: accountabilityOutput.repeated_patterns || [],
        escalation_risks: accountabilityOutput.escalation_risks || [],
        accountability_insights: accountabilityOutput.accountability_insights || []
      });

      // Save meeting_preparation
      await setDoc(doc(db, "meeting_preparation", meetingId), {
        meetingId,
        executive_brief: prepOutput.executive_brief || null,
        discussion_priorities: prepOutput.discussion_priorities || [],
        recommended_questions: prepOutput.recommended_questions || [],
        relationship_insights: prepOutput.relationship_insights || [],
        warnings: prepOutput.warnings || [],
        meeting_strategy: prepOutput.meeting_strategy || []
      });

      // Update the meeting document
      await updateDoc(doc(db, "meetings", meetingId), {
        status: "completed",
        participants: parsedAnalysis.participants || []
      });

      // Update local states
      setAnalysisResult(parsedAnalysis);
      setAccountabilityResult(accountabilityOutput);
      setPrepBriefing(prepOutput);
      setSelectedMeetingId(meetingId);
      setActiveMeetingId(null);
      setLiveTranscript([]);

      toast({
        title: "Analysis Successful",
        description: "Meeting processed and intelligence stored successfully in Firestore.",
      });

    } catch (error: any) {
      console.error("Error processing meeting:", error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process meeting intelligence.",
        variant: "destructive"
      });
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  // Select meeting from sidebar
  const handleSelectMeeting = async (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setActiveMeetingId(null);
    setIsLoading(true);

    try {
      // Fetch meeting document to get transcript
      const meetingSnap = await getDoc(doc(db, "meetings", meetingId));
      if (!meetingSnap.exists()) {
        throw new Error("Meeting record not found.");
      }
      const meetingData = meetingSnap.data();
      const transcriptText = (meetingData.transcript || []).map((t: any) => `${t.speaker}: ${t.text}`).join('\n');
      setTranscriptInput(transcriptText);

      // Fetch meeting intelligence
      const intelSnap = await getDoc(doc(db, "meeting_intelligence", meetingId));
      if (intelSnap.exists()) {
        setAnalysisResult(intelSnap.data());
      } else {
        setAnalysisResult(null);
      }

      // Fetch accountability
      const accountabilitySnap = await getDoc(doc(db, "accountability_engine", meetingId));
      if (accountabilitySnap.exists()) {
        setAccountabilityResult(accountabilitySnap.data());
      } else {
        setAccountabilityResult(null);
      }

      // Fetch preparation briefing
      const prepSnap = await getDoc(doc(db, "meeting_preparation", meetingId));
      if (prepSnap.exists()) {
        setPrepBriefing(prepSnap.data());
      } else {
        setPrepBriefing(null);
      }

      toast({
        title: "Meeting Loaded",
        description: `Loaded details for "${meetingData.title}"`,
      });

    } catch (error: any) {
      console.error("Error fetching meeting details:", error);
      toast({
        title: "Load Failed",
        description: error.message || "Failed to load meeting details from Firestore.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePrepBriefing = async () => {
    if (!selectedMeetingId) return;
    setIsPrepLoading(true);
    try {
      const commitments = analysisResult?.commitments || (
        analysisResult?.action_items ? (analysisResult.action_items as any[]).map((item: any) => ({
          owner: item.owner || "Unknown",
          recipient: "Unknown",
          commitment: item.task || item.commitment,
          commitment_type: "Deliverable",
          due_date: null,
          priority: "Medium",
          status: item.status || "pending",
          confidence: item.confidence || "high",
          impact_if_missed: null
        })) : []
      );

      // Fetch historical commitments from other meetings
      const commitSnap = await getDocs(collection(db, "commitment_intelligence"));
      const pastCommitments: any[] = [];
      commitSnap.forEach(d => {
        const data = d.data();
        if (data.meetingId !== selectedMeetingId && Array.isArray(data.commitments)) {
          pastCommitments.push(...data.commitments);
        }
      });

      const contactHistory = {
        participants: analysisResult?.participants || [],
        past_meetings_count: pastCommitments.length ? Math.round(pastCommitments.length / 3) + 1 : 1,
        last_interaction: new Date().toISOString().split('T')[0],
        channels: ["Slack", "Zoom", "Email"]
      };

      const prepOutput = await prepareMeetingBriefing(
        analysisResult,
        commitments,
        accountabilityResult || {},
        contactHistory
      );

      // Save to Firestore
      await setDoc(doc(db, "meeting_preparation", selectedMeetingId), {
        meetingId: selectedMeetingId,
        executive_brief: prepOutput.executive_brief || null,
        discussion_priorities: prepOutput.discussion_priorities || [],
        recommended_questions: prepOutput.recommended_questions || [],
        relationship_insights: prepOutput.relationship_insights || [],
        warnings: prepOutput.warnings || [],
        meeting_strategy: prepOutput.meeting_strategy || []
      });

      setPrepBriefing(prepOutput);
      toast({
        title: "Briefing Generated",
        description: "Meeting preparation briefing is now ready and saved to database.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate meeting briefing.",
        variant: "destructive"
      });
    } finally {
      setIsPrepLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-white w-full h-full pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-1/65 border border-dark-3 rounded-[16px] p-6 glassmorphism2 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-blue-1/20 p-3 rounded-[12px] border border-blue-1/40">
            <Brain className="w-8 h-8 text-blue-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide md:text-3xl bg-gradient-to-r from-white via-sky-2 to-blue-1 bg-clip-text text-transparent">
              Meeting & Commitment Intelligence Agent
            </h1>
            <p className="text-sm text-sky-2/70 mt-1">
              Extract meeting summaries, decisions, action items, risks, blockers, and commitments for downstream workflows.
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Side - Input Panel (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-dark-1/55 border border-dark-3 rounded-[16px] p-6 glassmorphism2 shadow-lg max-h-[85vh] overflow-y-auto">
          
          {/* Active / Start Meeting Control */}
          {activeMeetingId ? (
            <div className="flex flex-col gap-4 bg-dark-2/80 border border-blue-1/40 p-5 rounded-[12px] shadow-lg animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Meeting In Progress
                </h3>
                <span className="text-[10px] text-sky-2/50 font-bold font-mono">
                  ID: {activeMeetingId.slice(0, 8)}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-blue-1 mt-1 truncate">
                {activeMeetingTitle}
              </h2>

              {/* Real-time Transcript Viewer */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-sky-2/50 uppercase tracking-wider">Live Transcript Feed</span>
                <div className="bg-dark-3/50 border border-dark-3 rounded-lg p-3 min-h-[150px] max-h-[200px] overflow-y-auto flex flex-col gap-2.5">
                  {liveTranscript.map((t, index) => (
                    <div key={index} className="text-xs">
                      <strong className="text-blue-1">{t.speaker}:</strong> <span className="text-sky-2">{t.text}</span>
                    </div>
                  ))}
                  {liveTranscript.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-center text-xs text-sky-2/40 italic p-4">
                      No transcript entries yet. Start typing below to add lines.
                    </div>
                  )}
                </div>
              </div>

              {/* Add Transcript Line Form */}
              <div className="flex flex-col gap-3 border-t border-dark-3 pt-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <input
                      type="text"
                      value={currentSpeaker}
                      onChange={(e) => setCurrentSpeaker(e.target.value)}
                      placeholder="Speaker"
                      className="w-full bg-dark-3 border border-dark-3 rounded-[8px] px-3 py-2 text-xs text-white placeholder-sky-2/30 focus:outline-none focus:border-blue-1 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      onKeyDown={handleKeyDownText}
                      placeholder="What is saying..."
                      className="w-full bg-dark-3 border border-dark-3 rounded-[8px] px-3 py-2 text-xs text-white placeholder-sky-2/30 focus:outline-none focus:border-blue-1 transition-all"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddTranscriptLine}
                  className="bg-blue-1 hover:bg-blue-1/90 text-white rounded-[8px] py-2 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Add to Transcript
                </Button>
              </div>

              {/* End Meeting Button */}
              <Button
                onClick={handleEndMeeting}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-[8px] py-2.5 mt-2 text-xs font-extrabold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Clock className="w-4 h-4" /> End Meeting & Process Intelligence
              </Button>
            </div>
          ) : (
            /* Start Meeting Form */
            <div className="flex flex-col gap-4 bg-dark-2/40 border border-dark-3 p-5 rounded-[12px] animate-in fade-in duration-300">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-1" />
                Initialize New Session
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-sky-2/50 uppercase tracking-wider">Meeting Title</label>
                  <input
                    type="text"
                    value={newMeetingTitle}
                    onChange={(e) => setNewMeetingTitle(e.target.value)}
                    placeholder="e.g., Q3 Product Strategy Sync"
                    className="w-full bg-dark-3 border border-dark-3 rounded-[8px] px-3.5 py-2.5 text-xs text-white placeholder-sky-2/30 focus:outline-none focus:border-blue-1 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-sky-2/50 uppercase tracking-wider">Participants</label>
                  <input
                    type="text"
                    value={newMeetingParticipants}
                    onChange={(e) => setNewMeetingParticipants(e.target.value)}
                    placeholder="e.g., Alice, Bob, Charlie (comma separated)"
                    className="w-full bg-dark-3 border border-dark-3 rounded-[8px] px-3.5 py-2.5 text-xs text-white placeholder-sky-2/30 focus:outline-none focus:border-blue-1 transition-all"
                  />
                </div>
                <Button
                  onClick={handleStartMeeting}
                  className="bg-blue-1 hover:bg-blue-1/90 text-white rounded-[8px] py-3 text-xs font-extrabold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Brain className="w-4 h-4" /> Start Meeting
                </Button>
              </div>
            </div>
          )}

          {/* Historical Meetings List / Sidebar */}
          <div className="flex flex-col gap-3 flex-1 min-h-[250px]">
            <span className="text-[10px] font-bold text-sky-2/50 uppercase tracking-wider">Meeting History</span>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-1">
              {meetings.map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => {
                    if (meeting.status === 'active') {
                      setActiveMeetingId(meeting.id);
                      setActiveMeetingTitle(meeting.title);
                      setLiveTranscript(meeting.transcript || []);
                    } else {
                      handleSelectMeeting(meeting.id);
                    }
                  }}
                  className={`flex flex-col p-4 rounded-[12px] text-left transition-all duration-300 border ${
                    selectedMeetingId === meeting.id || activeMeetingId === meeting.id
                      ? 'bg-blue-1/15 border-blue-1 shadow-md'
                      : 'bg-dark-2/60 border-dark-3 hover:border-sky-2/30'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 w-full">
                    <span className="text-[10px] text-sky-2/50 font-bold uppercase tracking-wider">
                      {formatDate(meeting.meetingDate || meeting.createdAt)}
                    </span>
                    {meeting.status === 'active' ? (
                      <span className="text-[9px] font-extrabold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        Active
                      </span>
                    ) : (
                      <span className="text-[9px] font-extrabold text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Processed
                      </span>
                    )}
                  </div>
                  <h4 className={`text-sm font-bold mt-2 truncate w-full ${
                    selectedMeetingId === meeting.id || activeMeetingId === meeting.id
                      ? 'text-white'
                      : 'text-sky-2/80 hover:text-white'
                  }`}>
                    {meeting.title}
                  </h4>
                </button>
              ))}

              {meetings.length === 0 && (
                <div className="text-center text-xs text-sky-2/40 italic py-10">
                  No meetings in database. Start a meeting to compile intelligence.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Output Dashboard (7 columns) */}
        <div className="lg:col-span-7 flex flex-col bg-dark-1/55 border border-dark-3 rounded-[16px] p-6 glassmorphism2 shadow-lg min-h-[500px]">

          {/* Loading State */}
          {isLoading ? (
            <div className="flex-1 flex flex-col justify-center items-center py-20 animate-in fade-in duration-300">
              <div className="relative flex justify-center items-center">
                <div className="absolute animate-ping size-16 rounded-full bg-blue-1/30" />
                <div className="size-12 rounded-full border-4 border-t-blue-1 border-r-blue-1/20 border-b-blue-1/20 border-l-blue-1/20 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mt-8 tracking-wider">Analyzing Transcript</h3>
              <p className="text-xs text-sky-2/70 mt-2 text-center max-w-[280px] min-h-[32px] italic transition-all duration-300">
                {loadingStep === 0 && "Connecting to Meeting Intelligence Gateway..."}
                {loadingStep === 1 && "Analyzing semantic discussion threads..."}
                {loadingStep === 2 && "Identifying decisions, actions & outcome..."}
                {loadingStep === 3 && "Extracting commitments & deadlines..."}
                {loadingStep === 4 && "Detecting blockers and security/financial risks..."}
                {loadingStep === 5 && "Finalizing structured intelligence report..."}
              </p>

              <div className="w-[200px] bg-dark-3 h-1.5 rounded-full overflow-hidden mt-6">
                <div
                  className="bg-blue-1 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((loadingStep + 1) / 6) * 100}%` }}
                />
              </div>
            </div>
          ) : !analysisResult ? (
            /* Empty State */
            <div className="flex-1 flex flex-col justify-center items-center py-20 text-center">
              <div className="bg-dark-3 p-4 rounded-full border border-dark-3/60 mb-6">
                <Brain className="w-10 h-10 text-blue-1 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-sky-1">No Meeting Selected</h3>
              <p className="text-sm text-sky-2/60 mt-2 max-w-[320px]">
                Initialize a new session or select an existing meeting from the history sidebar to view summarized intelligence, commitments, accountability details, and preparation briefings.
              </p>
            </div>
          ) : (
            /* Results Panel */
            (() => {
              const commitments = analysisResult?.commitments || (
                analysisResult?.action_items ? (analysisResult.action_items as any[]).map((item: any) => ({
                  owner: item.owner || "Unknown",
                  recipient: "Unknown",
                  commitment: item.task || item.commitment,
                  commitment_type: "Deliverable",
                  due_date: null,
                  priority: "Medium",
                  status: item.status || "pending",
                  confidence: item.confidence || "high",
                  impact_if_missed: null
                })) : []
              );

              return (
                <div className="flex-1 flex flex-col h-full animate-in fade-in duration-500">
                  {/* Tab Navigation */}
                  <div className="flex border-b border-dark-3 overflow-x-auto gap-2 pb-2">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all border whitespace-nowrap ${activeTab === 'summary'
                        ? 'bg-blue-1 text-white border-blue-1'
                        : 'bg-dark-2/40 border-transparent text-sky-2 hover:text-white'
                        }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Summary & Sentiment
                    </button>
                    <button
                      onClick={() => setActiveTab('decisions')}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all border whitespace-nowrap ${activeTab === 'decisions'
                        ? 'bg-blue-1 text-white border-blue-1'
                        : 'bg-dark-2/40 border-transparent text-sky-2 hover:text-white'
                        }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Decisions & Actions
                    </button>
                    <button
                      onClick={() => setActiveTab('risks')}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all border whitespace-nowrap ${activeTab === 'risks'
                        ? 'bg-blue-1 text-white border-blue-1'
                        : 'bg-dark-2/40 border-transparent text-sky-2 hover:text-white'
                        }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Risks, Blockers & Qs
                    </button>
                    <button
                      onClick={() => setActiveTab('commitments')}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all border whitespace-nowrap ${activeTab === 'commitments'
                        ? 'bg-blue-1 text-white border-blue-1'
                        : 'bg-dark-2/40 border-transparent text-sky-2 hover:text-white'
                        }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Commitments ({commitments.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('accountability')}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all border whitespace-nowrap ${activeTab === 'accountability'
                        ? 'bg-blue-1 text-white border-blue-1'
                        : 'bg-dark-2/40 border-transparent text-sky-2 hover:text-white'
                        }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Accountability Engine
                    </button>
                    <button
                      onClick={() => setActiveTab('briefing')}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all border whitespace-nowrap ${activeTab === 'briefing'
                        ? 'bg-blue-1 text-white border-blue-1'
                        : 'bg-dark-2/40 border-transparent text-sky-2 hover:text-white'
                        }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Prep Briefing
                    </button>
                    <button
                      onClick={() => setActiveTab('json')}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all border whitespace-nowrap ${activeTab === 'json'
                        ? 'bg-blue-1 text-white border-blue-1'
                        : 'bg-dark-2/40 border-transparent text-sky-2 hover:text-white'
                        }`}
                    >
                      <Brain className="w-3.5 h-3.5" />
                      Structured JSON
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="flex-1 mt-6 min-h-0 overflow-y-auto">
                    {/* Summary Tab */}
                    {activeTab === 'summary' && (
                      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                        {/* Executive Summary Card */}
                        <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-1 mb-2">Meeting Summary</h3>
                          <p className="text-sm leading-relaxed text-sky-2 font-normal">
                            {analysisResult.meeting_summary || "No summary was generated."}
                          </p>
                        </div>

                        {/* Sentiment & Outcome Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Sentiment Panel */}
                          <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5 flex flex-col justify-between">
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-1 mb-3">Overall Sentiment</h3>
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full border ${analysisResult.sentiment?.overall_sentiment?.toLowerCase() === 'positive'
                                  ? 'bg-green-500/10 border-green-500/30 text-green-500'
                                  : analysisResult.sentiment?.overall_sentiment?.toLowerCase() === 'neutral'
                                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-2'
                                    : 'bg-orange-1/10 border-orange-1/30 text-orange-1'
                                  }`}>
                                  <Smile className="w-6 h-6" />
                                </div>
                                <div>
                                  <span className="text-lg font-bold block">{analysisResult.sentiment?.overall_sentiment || "Neutral"}</span>
                                  <span className="text-[10px] text-sky-2/65">Tone Analysis</span>
                                </div>
                              </div>
                            </div>
                            {analysisResult.sentiment?.reason && (
                              <p className="text-xs text-sky-2/75 leading-relaxed mt-3 border-t border-dark-3 pt-3">
                                {analysisResult.sentiment.reason}
                              </p>
                            )}
                          </div>

                          {/* Meeting Outcome Panel */}
                          <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5 flex flex-col justify-between">
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-1 mb-3">Meeting Outcome</h3>
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full border bg-purple-500/10 border-purple-500/30 text-purple-400">
                                  <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                  <span className="text-lg font-bold block">{analysisResult.meeting_outcome?.status || "Completed"}</span>
                                  <span className="text-[10px] text-sky-2/65">Outcome Status</span>
                                </div>
                              </div>
                            </div>
                            {analysisResult.meeting_outcome?.reason && (
                              <p className="text-xs text-sky-2/75 leading-relaxed mt-3 border-t border-dark-3 pt-3">
                                {analysisResult.meeting_outcome.reason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Participants Panel */}
                        <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-1 mb-3">Participants</h3>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.participants && analysisResult.participants.length > 0 ? (
                              (analysisResult.participants as any[]).map((person: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1.5 bg-dark-3 border border-dark-4 rounded-full px-3 py-1 text-xs text-sky-2"
                                >
                                  <Users className="w-3.5 h-3.5 text-sky-2/60" />
                                  <span className="font-medium">{person}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-sky-2/50 italic">No participants listed.</span>
                            )}
                          </div>
                        </div>

                        {/* Key Topics Panel */}
                        <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-1 mb-3">Key Topics</h3>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.key_topics && analysisResult.key_topics.length > 0 ? (
                              (analysisResult.key_topics as any[]).map((topic: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs font-semibold bg-blue-1/10 border border-blue-1/30 text-sky-1 px-3 py-1 rounded-[6px]"
                                >
                                  {topic}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-sky-2/50 italic">No key topics categorized.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Decisions & Actions Tab */}
                    {activeTab === 'decisions' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        {/* Decisions Agreed */}
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2 border-b border-dark-3 pb-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Decisions</h3>
                          </div>
                          {analysisResult.decisions && analysisResult.decisions.length > 0 ? (
                            <div className="flex flex-col gap-3">
                              {(analysisResult.decisions as any[]).map((item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-dark-2/80 border border-dark-3 rounded-[10px] p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-green-500/35 transition-all duration-300"
                                >
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                                  <p className="text-xs font-medium text-sky-2 leading-relaxed">
                                    {item.decision}
                                  </p>
                                  {item.confidence && (
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-[9px] text-sky-2/50 font-semibold">CONFIDENCE</span>
                                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${item.confidence?.toLowerCase() === 'high'
                                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                        : 'bg-yellow-1/10 border-yellow-1/30 text-yellow-1'
                                        }`}>
                                        {item.confidence}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-sky-2/50 italic bg-dark-2/40 rounded-[10px] p-4 border border-dark-3 text-center">
                              No decisions recorded.
                            </div>
                          )}
                        </div>

                        {/* Action Items */}
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2 border-b border-dark-3 pb-2 mb-2">
                            <Sparkles className="w-4 h-4 text-blue-1" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Action Items</h3>
                          </div>
                          {analysisResult.action_items && analysisResult.action_items.length > 0 ? (
                            <div className="flex flex-col gap-3">
                              {(analysisResult.action_items as any[]).map((item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-dark-2/80 border border-dark-3 rounded-[10px] p-4 flex flex-col gap-2 relative overflow-hidden hover:border-blue-1/35 transition-all duration-300"
                                >
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-1" />
                                  <p className="text-xs font-semibold text-sky-2 leading-relaxed">
                                    {item.task}
                                  </p>
                                  <div className="flex flex-wrap justify-between items-center gap-2 mt-2 pt-2 border-t border-dark-3/40">
                                    <div className="flex items-center gap-1.5">
                                      <div className="size-5 rounded-full bg-blue-1/20 border border-blue-1/30 flex items-center justify-center text-[9px] font-bold text-blue-1 uppercase">
                                        {item.owner ? item.owner.slice(0, 2) : "UN"}
                                      </div>
                                      <span className="text-[10px] text-sky-2/80 font-semibold">{item.owner || "Unknown"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px]">
                                      <span className="px-1.5 py-0.5 rounded-full bg-dark-3 text-sky-2/65 font-medium border border-dark-3 uppercase">
                                        {item.status || "pending"}
                                      </span>
                                      {item.confidence && (
                                        <span className={`px-1.5 py-0.5 rounded-full font-bold border uppercase ${item.confidence?.toLowerCase() === 'high'
                                          ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                          : 'bg-yellow-1/10 border-yellow-1/20 text-yellow-1'
                                          }`}>
                                          {item.confidence}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-sky-2/50 italic bg-dark-2/40 rounded-[10px] p-4 border border-dark-3 text-center">
                              No action items listed.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Risks, Blockers & Qs Tab */}
                    {activeTab === 'risks' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                        {/* Risks */}
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2 border-b border-dark-3 pb-2 mb-2">
                            <ShieldAlert className="w-4 h-4 text-orange-1" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Risks</h3>
                          </div>
                          {analysisResult.risks && analysisResult.risks.length > 0 ? (
                            <div className="flex flex-col gap-3">
                              {(analysisResult.risks as any[]).map((item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-dark-2/80 border border-dark-3 rounded-[10px] p-4 flex flex-col gap-2 relative overflow-hidden hover:border-orange-1/35 transition-all duration-300"
                                >
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.severity?.toLowerCase() === 'high'
                                    ? 'bg-red-500'
                                    : 'bg-orange-1'
                                    }`} />
                                  <p className="text-xs font-medium text-sky-2 leading-relaxed">
                                    {item.risk}
                                  </p>
                                  {item.severity && (
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-[9px] text-sky-2/50 font-semibold">SEVERITY</span>
                                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${item.severity?.toLowerCase() === 'high'
                                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                        : 'bg-orange-1/10 border-orange-1/30 text-orange-1'
                                        }`}>
                                        {item.severity}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-sky-2/50 italic bg-dark-2/40 rounded-[10px] p-4 border border-dark-3 text-center">
                              No risks identified.
                            </div>
                          )}
                        </div>

                        {/* Blockers */}
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2 border-b border-dark-3 pb-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Blockers</h3>
                          </div>
                          {analysisResult.blockers && analysisResult.blockers.length > 0 ? (
                            <div className="flex flex-col gap-3">
                              {(analysisResult.blockers as any[]).map((item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-dark-2/80 border border-dark-3 rounded-[10px] p-4 flex flex-col gap-2 relative overflow-hidden hover:border-red-500/35 transition-all duration-300"
                                >
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                                  <p className="text-xs font-semibold text-sky-2 leading-relaxed">
                                    {item.blocker}
                                  </p>
                                  {item.severity && (
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-[9px] text-sky-2/50 font-semibold">SEVERITY</span>
                                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border bg-red-500/10 border-red-500/30 text-red-400`}>
                                        {item.severity}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-sky-2/50 italic bg-dark-2/40 rounded-[10px] p-4 border border-dark-3 text-center">
                              No active blockers.
                            </div>
                          )}
                        </div>

                        {/* Questions Raised */}
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2 border-b border-dark-3 pb-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-blue-1" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Questions Raised</h3>
                          </div>
                          {analysisResult.questions_raised && analysisResult.questions_raised.length > 0 ? (
                            <div className="flex flex-col gap-3">
                              {(analysisResult.questions_raised as string[]).map((q: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-dark-2/80 border border-dark-3 rounded-[10px] p-4 flex gap-3 items-start hover:border-blue-1/35 transition-all duration-300"
                                >
                                  <div className="p-1 rounded-lg bg-blue-1/10 text-blue-1 mt-0.5">
                                    <HelpCircle className="w-4 h-4" />
                                  </div>
                                  <p className="text-xs font-semibold text-sky-2 leading-relaxed">
                                    {q}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-sky-2/50 italic bg-dark-2/40 rounded-[10px] p-4 border border-dark-3 text-center">
                              No questions captured.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Commitments Tab */}
                    {activeTab === 'commitments' && (
                      <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                        {commitments.length > 0 ? (
                          <div className="flex flex-col gap-4">
                            {commitments.map((c: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5 flex flex-col gap-3 relative overflow-hidden hover:border-blue-1/30 transition-all duration-300"
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-1" />

                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-white leading-relaxed">
                                      {c.commitment}
                                    </p>
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${c.priority?.toLowerCase() === 'high'
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                    : c.priority?.toLowerCase() === 'medium'
                                      ? 'bg-yellow-1/10 border-yellow-1/30 text-yellow-1'
                                      : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                    }`}>
                                    {c.priority || 'Medium'} Priority
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-dark-3/40 text-xs text-sky-2">
                                  <div>
                                    <span className="block text-[10px] text-sky-2/50 font-bold uppercase">Owner</span>
                                    <span className="font-semibold text-sky-2">{c.owner}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-sky-2/50 font-bold uppercase">Recipient</span>
                                    <span className="font-semibold text-sky-2">{c.recipient || 'Unknown'}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-sky-2/50 font-bold uppercase">Type</span>
                                    <span className="font-semibold text-sky-2">{c.commitment_type || 'Deliverable'}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-sky-2/50 font-bold uppercase">Due Date</span>
                                    <span className="font-semibold text-sky-2">{c.due_date || 'None'}</span>
                                  </div>
                                </div>

                                {(c.impact_if_missed || c.confidence || c.condition) && (
                                  <div className="flex flex-wrap gap-4 pt-2 border-t border-dark-3/25 text-[11px] text-sky-2/70">
                                    {c.impact_if_missed && (
                                      <div>
                                        <span className="font-semibold text-orange-1/90">Impact if missed: </span>
                                        <span>{c.impact_if_missed}</span>
                                      </div>
                                    )}
                                    {c.condition && (
                                      <div>
                                        <span className="font-semibold text-blue-1/90">Condition: </span>
                                        <span>{c.condition}</span>
                                      </div>
                                    )}
                                    {c.confidence && (
                                      <div className="ml-auto flex items-center gap-1">
                                        <span className="text-sky-2/50">Confidence:</span>
                                        <span className={`font-bold uppercase ${c.confidence?.toLowerCase() === 'high'
                                          ? 'text-green-400'
                                          : c.confidence?.toLowerCase() === 'medium'
                                            ? 'text-yellow-1'
                                            : 'text-red-400'
                                          }`}>{c.confidence}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-sky-2/50 italic bg-dark-2/40 rounded-[10px] p-4 border border-dark-3 text-center">
                            No commitments extracted.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Accountability Engine Tab */}
                    {activeTab === 'accountability' && (
                      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                        {!accountabilityResult ? (
                          <div className="text-center py-10 bg-dark-2/40 rounded-[12px] border border-dark-3">
                            <Lock className="w-8 h-8 text-sky-2/50 mx-auto mb-3 animate-bounce" />
                            <h4 className="text-sm font-semibold text-white">No Accountability Analysis Available</h4>
                            <p className="text-xs text-sky-2/65 mt-1 max-w-[300px] mx-auto">
                              Run the Intelligence Engine on a custom transcript or load a standard scenario to generate accountability matrix insights.
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6">
                            {/* Insights Panel */}
                            <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-1 mb-3 flex items-center gap-2">
                                <Brain className="w-4 h-4 text-blue-1" />
                                Accountability Insights
                              </h3>
                              <ul className="flex flex-col gap-2">
                                {accountabilityResult.accountability_insights?.map((insight: string, idx: number) => (
                                  <li key={idx} className="text-xs text-sky-2 flex items-start gap-2 leading-relaxed">
                                    <span className="text-blue-1 mt-1">•</span>
                                    <span>{insight}</span>
                                  </li>
                                ))}
                                {(!accountabilityResult.accountability_insights || accountabilityResult.accountability_insights.length === 0) && (
                                  <li className="text-xs text-sky-2/50 italic">No accountability insights generated.</li>
                                )}
                              </ul>
                            </div>

                            {/* Escalation Risks & Repeated Patterns */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Escalation Risks */}
                              <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
                                  <ShieldAlert className="w-4 h-4 text-red-400" />
                                  Escalation Risks
                                </h3>
                                <div className="flex flex-col gap-3">
                                  {accountabilityResult.escalation_risks?.map((risk: any, idx: number) => (
                                    <div key={idx} className="p-3.5 rounded-lg bg-red-500/5 border border-red-500/20 flex flex-col gap-1.5">
                                      <div className="flex justify-between items-center">
                                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${risk.severity?.toLowerCase() === 'high'
                                          ? 'bg-red-500/20 border-red-500/40 text-red-400'
                                          : 'bg-yellow-1/20 border-yellow-1/40 text-yellow-1'
                                          }`}>
                                          {risk.severity || 'Medium'} Severity
                                        </span>
                                        <span className="text-[10px] text-sky-2/50">Caused by: <strong className="text-sky-2">{risk.caused_by}</strong></span>
                                      </div>
                                      <p className="text-xs text-sky-2 font-medium leading-relaxed">{risk.risk}</p>
                                    </div>
                                  ))}
                                  {(!accountabilityResult.escalation_risks || accountabilityResult.escalation_risks.length === 0) && (
                                    <div className="text-xs text-sky-2/50 italic bg-dark-3/30 p-3 rounded-lg border border-dark-3/60 text-center">
                                      No escalation risks identified.
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Repeated Patterns */}
                              <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-1 mb-3 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-yellow-1" />
                                  Repeated Patterns
                                </h3>
                                <div className="flex flex-col gap-3">
                                  {accountabilityResult.repeated_patterns?.map((pattern: any, idx: number) => (
                                    <div key={idx} className="p-3.5 rounded-lg bg-yellow-1/5 border border-yellow-1/25 flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <p className="text-xs text-sky-2 font-medium leading-relaxed">{pattern.pattern}</p>
                                        <span className="text-[10px] text-sky-2/50 mt-1 block">Owner: <strong className="text-sky-2">{pattern.owner}</strong></span>
                                      </div>
                                      <span className="text-xs font-extrabold bg-yellow-1/10 text-yellow-1 px-2.5 py-1 rounded-md border border-yellow-1/30 whitespace-nowrap">
                                        {pattern.occurrences} Promises
                                      </span>
                                    </div>
                                  ))}
                                  {(!accountabilityResult.repeated_patterns || accountabilityResult.repeated_patterns.length === 0) && (
                                    <div className="text-xs text-sky-2/50 italic bg-dark-3/30 p-3 rounded-lg border border-dark-3/60 text-center">
                                      No repeated promise patterns detected.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Reliability Matrix */}
                            <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-1 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-1" />
                                Participant Reliability Matrix
                              </h3>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-dark-3/70 text-sky-2/50 uppercase tracking-wider text-[10px] font-bold">
                                      <th className="pb-3 pr-4">Participant</th>
                                      <th className="pb-3 px-4 text-center">Total</th>
                                      <th className="pb-3 px-4 text-center">Completed</th>
                                      <th className="pb-3 px-4 text-center">Overdue</th>
                                      <th className="pb-3 px-4 text-center">Active</th>
                                      <th className="pb-3 pl-4 text-right">Reliability Score</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-dark-3/30">
                                    {accountabilityResult.reliability_scores?.map((score: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-dark-3/15 transition-colors">
                                        <td className="py-3.5 pr-4 font-semibold text-white flex items-center gap-2">
                                          <div className="size-6 rounded-full bg-blue-1/15 border border-blue-1/30 flex items-center justify-center text-[10px] font-bold text-blue-1 font-mono">
                                            {score.person?.slice(0, 2).toUpperCase()}
                                          </div>
                                          <span>{score.person}</span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center text-sky-2 font-medium">{score.total_commitments}</td>
                                        <td className="py-3.5 px-4 text-center text-green-400 font-medium">{score.completed}</td>
                                        <td className="py-3.5 px-4 text-center text-red-400 font-medium">{score.overdue}</td>
                                        <td className="py-3.5 px-4 text-center text-blue-400 font-medium">{score.active}</td>
                                        <td className="py-3.5 pl-4 text-right font-bold">
                                          <div className="flex items-center justify-end gap-2.5">
                                            <div className="w-16 bg-dark-3 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                              <div
                                                className={`h-full rounded-full ${score.reliability_score >= 80
                                                  ? 'bg-green-500'
                                                  : score.reliability_score >= 50
                                                    ? 'bg-yellow-1'
                                                    : 'bg-red-500'
                                                  }`}
                                                style={{ width: `${score.reliability_score}%` }}
                                              />
                                            </div>
                                            <span className={`${score.reliability_score >= 80
                                              ? 'text-green-400'
                                              : score.reliability_score >= 50
                                                ? 'text-yellow-1'
                                                : 'text-red-400'
                                              }`}>
                                              {score.reliability_score}%
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                    {(!accountabilityResult.reliability_scores || accountabilityResult.reliability_scores.length === 0) && (
                                      <tr>
                                        <td colSpan={6} className="py-4 text-center text-sky-2/50 italic">No score matrices compiled.</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Overdue Commitments List */}
                            <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                Overdue Commitments List
                              </h3>
                              <div className="flex flex-col gap-3">
                                {accountabilityResult.overdue_commitments?.map((c: any, idx: number) => (
                                  <div key={idx} className="p-4 rounded-lg bg-dark-3/40 border border-dark-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                    <div className="flex-1">
                                      <p className="text-xs text-white font-semibold leading-relaxed">{c.commitment}</p>
                                      <div className="flex items-center gap-4 mt-2 text-[10px] text-sky-2/50 font-medium">
                                        <span>Owner: <strong className="text-sky-2">{c.owner}</strong></span>
                                        <span>Due Date: <strong className="text-sky-2">{c.due_date}</strong></span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-extrabold uppercase whitespace-nowrap">
                                        {c.days_overdue} Days Overdue
                                      </span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-extrabold uppercase whitespace-nowrap ${c.severity?.toLowerCase() === 'high'
                                        ? 'bg-red-500/25 border-red-500/50 text-red-300'
                                        : 'bg-yellow-1/10 border-yellow-1/30 text-yellow-1'
                                        }`}>
                                        {c.severity || 'Medium'} Severity
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {(!accountabilityResult.overdue_commitments || accountabilityResult.overdue_commitments.length === 0) && (
                                  <div className="text-xs text-sky-2/50 italic text-center py-2 bg-dark-3/20 border border-dark-3 rounded-lg">
                                    No overdue commitments. Great job!
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Prep Briefing Tab */}
                    {activeTab === 'briefing' && (
                      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                        {!prepBriefing ? (
                          <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-8 text-center flex flex-col items-center justify-center gap-4">
                            <Compass className="w-12 h-12 text-blue-1 animate-pulse" />
                            <div>
                              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Generate Meeting Preparation Briefing</h3>
                              <p className="text-xs text-sky-2/65 mt-1 max-w-[400px] mx-auto">
                                Transform meeting intelligence, commitments, accountability matrices, and contact history into an actionable preparation brief.
                              </p>
                            </div>
                            <Button
                              onClick={handleGeneratePrepBriefing}
                              disabled={isPrepLoading}
                              className="bg-blue-1 hover:bg-blue-1/90 text-white rounded-[8px] px-6 py-2.5 text-xs font-bold tracking-wide transition-all shadow-lg hover:shadow-blue-1/25"
                            >
                              {isPrepLoading ? "Generating Briefing..." : "Generate Briefing"}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6">
                            {/* Executive Brief */}
                            <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-1 mb-3">Executive Brief</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-3.5 rounded-lg bg-dark-3/50 border border-dark-3/60">
                                  <span className="text-[10px] text-sky-2/50 font-bold uppercase tracking-wider block mb-1">Relationship Summary</span>
                                  <p className="text-xs text-sky-2 leading-relaxed">{prepBriefing.executive_brief?.relationship_summary || "N/A"}</p>
                                </div>
                                <div className="p-3.5 rounded-lg bg-dark-3/50 border border-dark-3/60">
                                  <span className="text-[10px] text-sky-2/50 font-bold uppercase tracking-wider block mb-1">Project Status</span>
                                  <p className="text-xs text-sky-2 leading-relaxed">{prepBriefing.executive_brief?.project_status || "N/A"}</p>
                                </div>
                                <div className="p-3.5 rounded-lg bg-dark-3/50 border border-dark-3/60">
                                  <span className="text-[10px] text-sky-2/50 font-bold uppercase tracking-wider block mb-1">Important Context</span>
                                  <p className="text-xs text-sky-2 leading-relaxed">{prepBriefing.executive_brief?.important_context || "N/A"}</p>
                                </div>
                              </div>
                            </div>

                            {/* Warnings & Strategy */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Warnings */}
                              <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-1.5">
                                  <ShieldAlert className="w-4 h-4" />
                                  Warnings & Escalation Risks
                                </h3>
                                <div className="flex flex-col gap-2">
                                  {prepBriefing.warnings?.map((warning: string, idx: number) => (
                                    <div key={idx} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
                                      <span className="font-extrabold text-red-400 select-none">•</span>
                                      <span>{warning}</span>
                                    </div>
                                  ))}
                                  {(!prepBriefing.warnings || prepBriefing.warnings.length === 0) && (
                                    <p className="text-xs text-sky-2/50 italic">No risks or warnings detected.</p>
                                  )}
                                </div>
                              </div>

                              {/* Meeting Strategy */}
                              <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-3 flex items-center gap-1.5">
                                  <TrendingUp className="w-4 h-4" />
                                  Actionable Strategy
                                </h3>
                                <div className="flex flex-col gap-2">
                                  {prepBriefing.meeting_strategy?.map((strategy: string, idx: number) => (
                                    <div key={idx} className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-xs text-green-300 flex items-start gap-2">
                                      <span className="font-extrabold text-green-400 select-none">✓</span>
                                      <span>{strategy}</span>
                                    </div>
                                  ))}
                                  {(!prepBriefing.meeting_strategy || prepBriefing.meeting_strategy.length === 0) && (
                                    <p className="text-xs text-sky-2/50 italic">No strategies compiled.</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Open Commitments */}
                            <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-1 mb-3">Open Commitments Matrix</h3>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-dark-3/70 text-sky-2/50 uppercase tracking-wider text-[10px] font-bold">
                                      <th className="pb-2 pr-4">Owner</th>
                                      <th className="pb-2 px-4">Commitment</th>
                                      <th className="pb-2 px-4">Status</th>
                                      <th className="pb-2 pl-4 text-right">Due Date</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-dark-3/30">
                                    {prepBriefing.open_commitments?.map((c: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-dark-3/15 transition-colors">
                                        <td className="py-2.5 pr-4 font-semibold text-white">{c.owner || "Unknown"}</td>
                                        <td className="py-2.5 px-4 text-sky-2 font-normal">{c.commitment}</td>
                                        <td className="py-2.5 px-4">
                                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-1/10 border border-blue-1/30 text-blue-1 font-extrabold uppercase">
                                            {c.status || "Open"}
                                          </span>
                                        </td>
                                        <td className="py-2.5 pl-4 text-right font-medium text-sky-2">{c.due_date || "No date set"}</td>
                                      </tr>
                                    ))}
                                    {(!prepBriefing.open_commitments || prepBriefing.open_commitments.length === 0) && (
                                      <tr>
                                        <td colSpan={4} className="py-4 text-center text-sky-2/50 italic">No open commitments detected.</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Priorities and Questions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Discussion Priorities */}
                              <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-1 mb-3">Discussion Priorities</h3>
                                <div className="flex flex-col gap-2">
                                  {prepBriefing.discussion_priorities?.map((priority: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-3/40 border border-dark-3/60 font-medium text-white">
                                      <span className="text-xs font-bold bg-blue-1/15 text-blue-1 border border-blue-1/30 px-2 py-0.5 rounded">
                                        #{idx + 1}
                                      </span>
                                      <span className="text-xs">{priority}</span>
                                    </div>
                                  ))}
                                  {(!prepBriefing.discussion_priorities || prepBriefing.discussion_priorities.length === 0) && (
                                    <p className="text-xs text-sky-2/50 italic">No priorities extracted.</p>
                                  )}
                                </div>
                              </div>

                              {/* Recommended Questions */}
                              <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-1 mb-3 flex items-center gap-1.5">
                                  <HelpCircle className="w-4 h-4 text-sky-1" />
                                  Recommended Questions
                                </h3>
                                <div className="flex flex-col gap-2">
                                  {prepBriefing.recommended_questions?.map((question: string, idx: number) => (
                                    <div key={idx} className="p-3 rounded-lg bg-dark-3/40 border border-dark-3/60 text-xs text-sky-2 flex items-start gap-2.5">
                                      <span className="font-bold text-blue-1 select-none">Q:</span>
                                      <span>{question}</span>
                                    </div>
                                  ))}
                                  {(!prepBriefing.recommended_questions || prepBriefing.recommended_questions.length === 0) && (
                                    <p className="text-xs text-sky-2/50 italic">No recommended questions.</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Relationship Insights */}
                            <div className="bg-dark-2/80 border border-dark-3 rounded-[12px] p-5">
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-1 mb-3">Relationship & Behavioral Insights</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {prepBriefing.relationship_insights?.map((insight: string, idx: number) => (
                                  <div key={idx} className="p-3 rounded-lg bg-dark-3/40 border border-dark-3/60 text-xs text-sky-2 flex items-start gap-2.5">
                                    <span className="text-blue-1 select-none">ℹ</span>
                                    <span>{insight}</span>
                                  </div>
                                ))}
                                {(!prepBriefing.relationship_insights || prepBriefing.relationship_insights.length === 0) && (
                                  <p className="text-xs text-sky-2/50 italic col-span-2">No specific behavioral insights determined.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Structured JSON Tab */}
                    {activeTab === 'json' && (
                      <div className="flex flex-col gap-4 h-full min-h-[350px] animate-in fade-in duration-300">
                        <div className="flex justify-between items-center border-b border-dark-3 pb-3">
                          <div>
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Valid JSON Output Schema</h3>
                            <p className="text-[10px] text-sky-2/60 mt-0.5">Ready for ingestion by Commitment & Relationship Intelligence Agents.</p>
                          </div>
                          <Button
                            onClick={handleCopyJSON}
                            className="bg-dark-3 hover:bg-dark-4 text-sky-1 border border-dark-3/60 rounded-[8px] px-3 py-1.5 text-xs flex items-center gap-1.5"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? "Copied" : "Copy Schema"}
                          </Button>
                        </div>

                        <div className="flex-1 bg-dark-2 border border-dark-3 rounded-[12px] p-4 font-mono text-xs overflow-auto text-sky-2/90 leading-relaxed max-h-[400px]">
                          <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}

        </div>

      </div>
    </div>
  );
};

export default MeetingIntelligencePage;
