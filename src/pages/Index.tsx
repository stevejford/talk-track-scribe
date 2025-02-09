import { useState } from "react";
import { MediaUploader } from "@/components/MediaUploader";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  uploadAudio,
  startTranscription,
  getTranscriptionResult,
} from "@/services/assemblyai";
import { type TranscriptionResult } from "@/types/assemblyai";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TranscriptionPlayer } from "@/components/TranscriptionPlayer";
import { TranscriptionViewer } from "@/components/TranscriptionViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SavedSession {
  id: string;
  title: string;
  date: string;
  mediaUrl: string;
  transcriptionResult: TranscriptionResult;
  thumbnail?: string;
}

export default function Index() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [speakersExpected, setSpeakersExpected] = useState(2);
  const [currentTime, setCurrentTime] = useState(0);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string>>(new Set());
  const [sessionTitle, setSessionTitle] = useState("");
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => {
    const saved = localStorage.getItem("savedSessions");
    return saved ? JSON.parse(saved) : [];
  });
  const { toast } = useToast();

  const saveSession = () => {
    if (!mediaUrl || !transcriptionResult || !sessionTitle.trim()) {
      toast({
        title: "Cannot Save Session",
        description: "Please ensure you have a title and completed transcription.",
        variant: "destructive",
      });
      return;
    }

    const newSession: SavedSession = {
      id: Date.now().toString(),
      title: sessionTitle,
      date: new Date().toISOString(),
      mediaUrl,
      transcriptionResult,
    };

    const updatedSessions = [...savedSessions, newSession];
    setSavedSessions(updatedSessions);
    localStorage.setItem("savedSessions", JSON.stringify(updatedSessions));

    toast({
      title: "Session Saved",
      description: "Your transcription has been saved to the library.",
    });
  };

  const loadSession = (session: SavedSession) => {
    setMediaUrl(session.mediaUrl);
    setTranscriptionResult(session.transcriptionResult);
    setSessionTitle(session.title);
    setSelectedSpeakers(new Set(session.transcriptionResult.utterances.map((u) => u.speaker)));
  };

  const handleFileSelected = async (file: File) => {
    try {
      setIsProcessing(true);
      setProgress(0);

      const localMediaUrl = URL.createObjectURL(file);
      setMediaUrl(localMediaUrl);

      setProgress(20);
      const uploadUrl = await uploadAudio(file);

      setProgress(40);
      const transcriptId = await startTranscription(uploadUrl, speakersExpected);

      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = 5000;

      const pollResult = async () => {
        try {
          const result = await getTranscriptionResult(transcriptId);
          setProgress(60 + (attempts / maxAttempts) * 40);

          if (result.status === "completed") {
            setProgress(100);
            setIsProcessing(false);
            setTranscriptionResult(result);
            setSelectedSpeakers(new Set(result.utterances.map((u) => u.speaker)));
            toast({
              title: "Transcription Complete",
              description: "Your media has been successfully transcribed.",
            });
          } else if (result.status === "error") {
            throw new Error("Transcription failed");
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollResult, pollInterval);
          } else {
            throw new Error("Transcription timed out");
          }
        } catch (error) {
          handleError(error);
        }
      };

      await pollResult();
    } catch (error) {
      handleError(error);
    }
  };

  const handleUrlSubmitted = async (url: string) => {
    try {
      setIsProcessing(true);
      setProgress(20);
      setMediaUrl(url);

      const transcriptId = await startTranscription(url, speakersExpected);
      setProgress(40);

      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = 5000;

      const pollResult = async () => {
        try {
          const result = await getTranscriptionResult(transcriptId);
          setProgress(60 + (attempts / maxAttempts) * 40);

          if (result.status === "completed") {
            setProgress(100);
            setIsProcessing(false);
            setTranscriptionResult(result);
            setSelectedSpeakers(new Set(result.utterances.map((u) => u.speaker)));
            toast({
              title: "Transcription Complete",
              description: "Your media has been successfully transcribed.",
            });
          } else if (result.status === "error") {
            throw new Error("Transcription failed");
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollResult, pollInterval);
          } else {
            throw new Error("Transcription timed out");
          }
        } catch (error) {
          handleError(error);
        }
      };

      await pollResult();
    } catch (error) {
      handleError(error);
    }
  };

  const handleError = (error: any) => {
    setIsProcessing(false);
    setProgress(0);
    toast({
      title: "Error",
      description: error.message || "An error occurred during transcription.",
      variant: "destructive",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Media Speaker Analysis
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload your audio or video file to identify and analyze different speakers
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="results" disabled={!transcriptionResult}>Results</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="p-6 bg-card rounded-lg shadow-lg space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="speakers">Expected Number of Speakers</Label>
                  <Input
                    id="speakers"
                    type="number"
                    min="1"
                    max="10"
                    value={speakersExpected}
                    onChange={(e) => setSpeakersExpected(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    disabled={isProcessing}
                    className="max-w-[200px]"
                  />
                </div>
                <MediaUploader
                  onFileSelected={handleFileSelected}
                  onUrlSubmitted={handleUrlSubmitted}
                  isProcessing={isProcessing}
                />
              </div>

              {isProcessing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Processing media...</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-8">
            {transcriptionResult && mediaUrl && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Label htmlFor="title">Session Title</Label>
                      <Input
                        id="title"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        placeholder="Enter a title for this session"
                      />
                    </div>
                    <Button onClick={saveSession} className="mt-6">
                      Save to Library
                    </Button>
                  </div>
                </div>
                <TranscriptionPlayer
                  mediaUrl={mediaUrl}
                  utterances={transcriptionResult.utterances}
                  onTimeUpdate={setCurrentTime}
                  selectedSpeakers={selectedSpeakers}
                />
                <TranscriptionViewer
                  utterances={transcriptionResult.utterances}
                  currentTime={currentTime}
                  onUtteranceClick={(time) => {
                    const mediaElement = document.querySelector("video, audio");
                    if (mediaElement) {
                      (mediaElement as HTMLMediaElement).currentTime = time / 1000;
                    }
                  }}
                  selectedSpeakers={selectedSpeakers}
                  onSpeakerToggle={(speaker) => {
                    const newSelectedSpeakers = new Set(selectedSpeakers);
                    if (newSelectedSpeakers.has(speaker)) {
                      newSelectedSpeakers.delete(speaker);
                    } else {
                      newSelectedSpeakers.add(speaker);
                    }
                    setSelectedSpeakers(newSelectedSpeakers);
                  }}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <ScrollArea className="h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedSessions.map((session) => (
                  <Card key={session.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{session.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(session.date).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="secondary" onClick={() => loadSession(session)}>
                            Load
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.transcriptionResult.utterances.length} segments
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
