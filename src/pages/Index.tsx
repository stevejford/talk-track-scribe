
import { useState } from "react";
import { MediaUploader } from "@/components/MediaUploader";
import { TranscriptionPlayer } from "@/components/TranscriptionPlayer";
import { TranscriptionViewer } from "@/components/TranscriptionViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  uploadAudio,
  startTranscription,
  getTranscriptionResult,
} from "@/services/assemblyai";
import { TranscriptionResult } from "@/types/assemblyai";
import { Loader2 } from "lucide-react";

export default function Index() {
  const [apiKey, setApiKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleFileSelected = async (file: File) => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your AssemblyAI API key first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);

      // Create local media URL for playback
      const localMediaUrl = URL.createObjectURL(file);
      setMediaUrl(localMediaUrl);

      // Upload the file
      setProgress(20);
      const uploadUrl = await uploadAudio(file, apiKey);

      // Start transcription
      setProgress(40);
      const transcriptId = await startTranscription(uploadUrl, apiKey);

      // Poll for results
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes maximum
      const pollInterval = 5000; // 5 seconds

      const pollResult = async () => {
        try {
          const result = await getTranscriptionResult(transcriptId, apiKey);
          setProgress(60 + (attempts / maxAttempts) * 40);

          if (result.status === "completed") {
            setResult(result);
            // Initialize selected speakers with all speakers
            setSelectedSpeakers(new Set(result.utterances.map(u => u.speaker)));
            setProgress(100);
            setIsProcessing(false);
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
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your AssemblyAI API key first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(20);
      setMediaUrl(url);

      const transcriptId = await startTranscription(url, apiKey);
      setProgress(40);

      // Poll for results (same as in handleFileSelected)
      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = 5000;

      const pollResult = async () => {
        try {
          const result = await getTranscriptionResult(transcriptId, apiKey);
          setProgress(60 + (attempts / maxAttempts) * 40);

          if (result.status === "completed") {
            setResult(result);
            setSelectedSpeakers(new Set(result.utterances.map(u => u.speaker)));
            setProgress(100);
            setIsProcessing(false);
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

        <div className="p-6 bg-card rounded-lg shadow-lg space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="apiKey"
              className="text-sm font-medium text-muted-foreground"
            >
              AssemblyAI API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key..."
              className="font-mono"
            />
          </div>

          <MediaUploader
            onFileSelected={handleFileSelected}
            onUrlSubmitted={handleUrlSubmitted}
            isProcessing={isProcessing}
          />

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

        {mediaUrl && result?.utterances && (
          <div className="space-y-8">
            <TranscriptionPlayer
              mediaUrl={mediaUrl}
              utterances={result.utterances}
              onTimeUpdate={setCurrentTime}
              selectedSpeakers={selectedSpeakers}
            />
            <TranscriptionViewer
              utterances={result.utterances}
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
          </div>
        )}
      </div>
    </div>
  );
}
