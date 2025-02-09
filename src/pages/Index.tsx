
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  uploadAudio,
  startTranscription,
  getTranscriptionResult,
} from "@/services/assemblyai";
import { type TranscriptionResult } from "@/types/assemblyai";
import { useToast } from "@/components/ui/use-toast";
import { MediaInputSection } from "@/components/MediaInputSection";
import { ResultsSection } from "@/components/ResultsSection";
import { LibrarySection } from "@/components/LibrarySection";

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

          <TabsContent value="upload">
            <MediaInputSection
              isProcessing={isProcessing}
              progress={progress}
              speakersExpected={speakersExpected}
              onSpeakersChange={setSpeakersExpected}
              onFileSelected={handleFileSelected}
              onUrlSubmitted={handleUrlSubmitted}
            />
          </TabsContent>

          <TabsContent value="results" className="space-y-8">
            {transcriptionResult && mediaUrl && (
              <ResultsSection
                mediaUrl={mediaUrl}
                transcriptionResult={transcriptionResult}
                sessionTitle={sessionTitle}
                onSessionTitleChange={setSessionTitle}
                onSaveSession={saveSession}
                selectedSpeakers={selectedSpeakers}
                onSelectedSpeakersChange={setSelectedSpeakers}
              />
            )}
          </TabsContent>

          <TabsContent value="library">
            <LibrarySection
              savedSessions={savedSessions}
              onLoadSession={loadSession}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
