
import { useState } from "react";
import { AudioUploader } from "@/components/AudioUploader";
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
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

      // Create local audio URL for playback
      const localAudioUrl = URL.createObjectURL(file);
      setAudioUrl(localAudioUrl);

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
            setProgress(100);
            setIsProcessing(false);
            toast({
              title: "Transcription Complete",
              description: "Your audio has been successfully transcribed.",
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
      setAudioUrl(url);

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
            setProgress(100);
            setIsProcessing(false);
            toast({
              title: "Transcription Complete",
              description: "Your audio has been successfully transcribed.",
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
            Audio Speaker Analysis
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload your audio file to identify and analyze different speakers
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

          <AudioUploader
            onFileSelected={handleFileSelected}
            onUrlSubmitted={handleUrlSubmitted}
            isProcessing={isProcessing}
          />

          {isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Processing audio...</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        {audioUrl && result?.utterances && (
          <div className="space-y-8">
            <TranscriptionPlayer
              audioUrl={audioUrl}
              utterances={result.utterances}
              onTimeUpdate={setCurrentTime}
            />
            <TranscriptionViewer
              utterances={result.utterances}
              currentTime={currentTime}
              onUtteranceClick={(time) => {
                const audioElement = document.querySelector("audio");
                if (audioElement) {
                  audioElement.currentTime = time / 1000;
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
