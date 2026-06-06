'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storage } from '@/lib/firebase';
// @ts-ignore
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { saveRecordingMetadata } from '@/actions/recording.actions';
import { useToast } from '@/components/ui/use-toast';
import { Upload } from 'lucide-react';

const RecordingUploadModal = ({ onSuccess }: { onSuccess: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) setTitle(e.target.files[0].name.split('.')[0]);
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!file || !title) return;

    setUploading(true);
    setProgress(0);

    try {
      const duration = await getVideoDuration(file);
      const storageRef = ref(storage, `recordings/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot: any) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(p));
        },
        (error: any) => {
          console.error('Upload failed:', error);
          toast({ title: 'Upload failed', variant: 'destructive' });
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const result = await saveRecordingMetadata({
            title,
            videoUrl: downloadURL,
            duration,
          });

          if (result.success) {
            toast({ title: 'Recording uploaded successfully' });
            setIsOpen(false);
            onSuccess();
          } else {
            toast({ title: 'Failed to save metadata', variant: 'destructive' });
          }
          setUploading(false);
          setFile(null);
          setTitle('');
        }
      );
    } catch (error) {
      console.error('Error during upload process:', error);
      toast({ title: 'An error occurred', variant: 'destructive' });
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
      </DialogTrigger>
      <DialogContent className="bg-dark-1 border-dark-3 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Meeting Recording</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-sky-2">Recording Title</label>
            <Input
              placeholder="e.g. Project Sync-up"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-dark-3 border-none focus-visible:ring-1 focus-visible:ring-blue-1"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-sky-2">Video File (.mp4, .webm)</label>
            <Input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="bg-dark-3 border-none file:bg-blue-1 file:text-white file:border-none file:rounded file:px-2 file:py-1 cursor-pointer"
            />
          </div>

          {uploading && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-sky-2">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-dark-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-1 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={uploading}
            className="text-white hover:bg-dark-3"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !title || uploading}
            className="bg-blue-1 hover:bg-blue-600 px-8"
          >
            {uploading ? 'Uploading...' : 'Launch Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordingUploadModal;
