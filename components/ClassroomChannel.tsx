'use client';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc,
} from 'firebase/firestore';
import { useFirebaseUser } from '@/providers/FirebaseAuthProvider';
import {
  Send, Video, Copy, Users, Hash,
  Crown, School, Check, ArrowLeft,
} from 'lucide-react';
import { useToast } from './ui/use-toast';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  text: string;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  userId: string;
  userName: string;
  userPhoto?: string;
  createdAt: any;
}

interface Member {
  id: string;
  name: string;
  photoURL?: string;
  isHost: boolean;
}

interface ClassroomInfo {
  name: string;
  hostId: string;
  code: string;
}

const AVATAR_COLORS = [
  'bg-purple-600', 'bg-blue-600', 'bg-green-600',
  'bg-orange-500', 'bg-pink-600', 'bg-teal-600', 'bg-red-600', 'bg-indigo-600',
];

function getAvatarColor(uid: string) {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || '?';
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(ts: any) {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(ts: any) {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function Avatar({ name, photo, uid, size = 8 }: { name: string; photo?: string; uid: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full object-cover`;
  if (photo) return <img src={photo} alt={name} className={cls} />;
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${getAvatarColor(uid)}`}>
      {getInitials(name)}
    </div>
  );
}

export default function ClassroomChannel({
  classroomId,
  onStartMeeting,
}: {
  classroomId: string;
  onStartMeeting: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [classroom, setClassroom] = useState<ClassroomInfo | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(true);
  const { user } = useFirebaseUser();
  const { toast } = useToast();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Join: add self to members subcollection
  useEffect(() => {
    if (!user || !classroomId) return;
    const join = async () => {
      try {
        const classSnap = await getDoc(doc(db, 'classrooms', classroomId));
        const isHost = classSnap.data()?.hostId === user.uid;
        await setDoc(doc(db, 'classrooms', classroomId, 'members', user.uid), {
          name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          photoURL: user.photoURL || '',
          isHost,
          joinedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) { console.error('Join error:', e); }
    };
    join();
  }, [user, classroomId]);

  // Listen: classroom info
  useEffect(() => {
    if (!classroomId) return;
    return onSnapshot(doc(db, 'classrooms', classroomId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setClassroom({ name: d.name, hostId: d.hostId, code: d.code });
      }
    });
  }, [classroomId]);

  // Listen: members
  useEffect(() => {
    if (!classroomId) return;
    return onSnapshot(
      query(collection(db, 'classrooms', classroomId, 'members'), orderBy('joinedAt', 'asc')),
      (snap) => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Member)))
    );
  }, [classroomId]);

  // Listen: messages
  useEffect(() => {
    if (!classroomId) return;
    return onSnapshot(
      query(collection(db, 'classrooms', classroomId, 'messages'), orderBy('createdAt', 'asc')),
      (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)))
    );
  }, [classroomId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    const text = newMessage;
    setNewMessage('');
    try {
      await addDoc(collection(db, 'classrooms', classroomId, 'messages'), {
        text,
        type: 'text',
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
      });
    } catch {
      toast({ title: 'Failed to send message', variant: 'destructive' });
      setNewMessage(text);
    }
  };



  const copyCode = () => {
    navigator.clipboard.writeText(classroomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    toast({ title: '✓ Class code copied to clipboard!' });
  };

  // Group messages by date for separators
  let lastDateLabel = '';

  return (
    <div className="flex h-screen w-full bg-[#0d0e14] text-white overflow-hidden font-sans">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-64 bg-[#13151f] flex flex-col border-r border-white/5 shrink-0">

        {/* Back + Logo */}
        <div className="p-4 border-b border-white/5">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm mb-4"
          >
            <ArrowLeft size={14} /> Back
          </button>

          {/* Classroom Avatar + Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-lg shadow-violet-900/40">
              <School size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm text-white leading-tight truncate">
                {classroom?.name || classroomId}
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Smart Classroom</p>
            </div>
          </div>

          {/* Code pill */}
          <button
            onClick={copyCode}
            className="mt-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2.5 transition-colors group"
          >
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Class Code</p>
              <span className="font-mono font-bold text-violet-400 tracking-[0.2em] text-base">
                {classroomId}
              </span>
            </div>
            {copiedCode
              ? <Check size={15} className="text-green-400 shrink-0" />
              : <Copy size={15} className="text-gray-600 group-hover:text-gray-300 shrink-0 transition-colors" />}
          </button>
        </div>

        {/* Start Meeting CTA */}
        <div className="px-4 py-3">
          <button
            onClick={onStartMeeting}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl py-3 font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-emerald-500/30 active:scale-[0.97]"
          >
            <Video size={17} />
            Start Meeting
          </button>
        </div>

        {/* Channel */}
        <div className="px-3 mb-1">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-2 mb-1.5">Channels</p>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-violet-600/15 border border-violet-500/20 text-violet-300">
            <Hash size={15} />
            <span className="text-sm font-medium">general</span>
          </div>
        </div>

        {/* Members list */}
        <div className="px-3 flex-1 flex flex-col min-h-0 mt-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
              Members — {members.length}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="relative shrink-0">
                  <Avatar name={m.name} photo={m.photoURL} uid={m.id} size={7} />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#13151f]" />
                </div>
                <span className="text-sm text-gray-300 truncate flex-1">{m.name}</span>
                {m.isHost && <Crown size={12} className="text-amber-400 shrink-0" />}
                {m.id === user?.uid && <span className="text-[10px] text-violet-400 shrink-0">(you)</span>}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <header className="h-14 border-b border-white/5 flex items-center px-5 gap-3 bg-[#13151f] shrink-0">
          <Hash size={19} className="text-gray-500" />
          <span className="font-semibold text-white">general</span>
          <div className="mx-1 h-5 w-px bg-white/10" />
          <span className="text-sm text-gray-500 flex items-center gap-1.5">
            <Users size={13} />
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onStartMeeting}
              className="hidden sm:flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
            >
              <Video size={14} />
              Start Meeting
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0.5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center mb-5 shadow-xl shadow-violet-900/40">
                <Hash size={36} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Welcome to #{classroom?.name || 'general'}!</h3>
              <p className="text-gray-500 text-sm max-w-md leading-relaxed">
                This is the beginning of your classroom. Send messages, share files, or start a video meeting!
              </p>
              <div className="mt-4 flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5">
                <span className="text-gray-500 text-sm">Share code:</span>
                <span className="font-mono font-bold text-violet-400 tracking-widest">{classroomId}</span>
                <button onClick={copyCode} className="text-gray-600 hover:text-gray-300 transition-colors">
                  {copiedCode ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = user?.uid === msg.userId;
            const prev = i > 0 ? messages[i - 1] : null;
            const isSameUser = prev?.userId === msg.userId;

            // Date separator
            const dateLabel = formatDateLabel(msg.createdAt);
            const showDateSep = dateLabel !== lastDateLabel;
            if (showDateSep) lastDateLabel = dateLabel;

            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-xs text-gray-600 font-medium px-2">{dateLabel}</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                )}

                <div className={`flex items-end gap-3 group ${isMe ? 'flex-row-reverse' : ''} ${isSameUser && !showDateSep ? 'mt-0.5' : 'mt-4'}`}>
                  {/* Avatar */}
                  <div className={`shrink-0 ${isSameUser && !showDateSep ? 'invisible' : ''}`}>
                    <Avatar name={msg.userName} photo={msg.userPhoto} uid={msg.userId} size={9} />
                  </div>

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {(!isSameUser || showDateSep) && (
                      <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm font-semibold text-gray-200">{isMe ? 'You' : msg.userName}</span>
                        <span className="text-xs text-gray-600">{formatTime(msg.createdAt)}</span>
                      </div>
                    )}

                    {/* Text bubble */}
                    {msg.type === 'text' && (
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                        isMe
                          ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm'
                          : 'bg-[#1e2133] text-gray-100 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    )}



                    {/* Inline timestamp for same-user messages */}
                    {isSameUser && !showDateSep && (
                      <span className="text-[10px] text-gray-700 mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTime(msg.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <form onSubmit={sendMessage} className="p-4 bg-[#13151f] border-t border-white/5">
          <div className="flex items-center gap-3 bg-[#1e2133] rounded-2xl px-4 py-3.5 border border-white/5 focus-within:border-violet-500/40 transition-colors">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as any); }
              }}
              placeholder="Message #general..."
              className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm px-2"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="text-gray-600 hover:text-violet-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0 p-0.5"
            >
              <Send size={19} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
