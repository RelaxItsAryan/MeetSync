'use client';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebaseUser } from '@/providers/FirebaseAuthProvider';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: any;
}

export default function ClassroomChat({ classroomId }: { classroomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useFirebaseUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!classroomId) return;
    
    const q = query(
      collection(db, 'classrooms', classroomId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [classroomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'classrooms', classroomId, 'messages'), {
        text: newMessage,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-1 border-l border-dark-3 w-full max-w-sm shrink-0">
      <div className="p-4 border-b border-dark-3 bg-dark-2">
        <h2 className="text-lg font-semibold text-white">Classroom Chat</h2>
        <p className="text-xs text-sky-1 text-opacity-80">Code: {classroomId}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = user?.uid === msg.userId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-sky-2 mb-1">{isMe ? 'You' : msg.userName}</span>
              <div 
                className={`px-4 py-2 rounded-2xl max-w-[85%] break-words ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-dark-3 text-white rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-dark-3 bg-dark-2 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-dark-3 border-none text-white focus-visible:ring-1 focus-visible:ring-blue-1"
        />
        <Button type="submit" size="icon" className="bg-blue-1 hover:bg-blue-600 rounded-lg">
          <Send size={18} className="text-white" />
        </Button>
      </form>
    </div>
  );
}
