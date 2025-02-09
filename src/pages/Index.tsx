
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

export default function Index() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [speakersExpected, setSpeakersExpected] = useState(2);
  const [currentTime, setCurrentTime] = useState(0);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="results" disabled={!transcriptionResult}>Results</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
}
