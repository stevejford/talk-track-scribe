
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MediaUploader } from "@/components/MediaUploader";
import { Progress } from "@/components/ui/progress";
import {
  uploadAudio,
  startTranscription,
  getTranscriptionResult,
} from "@/services/assemblyai";
import { TranscriptionResult } from "@/types/assemblyai";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Index() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [speakersExpected, setSpeakersExpected] = useState(2);
  const { toast } = useToast();
  const navigate = useNavigate();

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
            toast({
              title: "Transcription Complete",
              description: "Your media has been successfully transcribed.",
            });
            // Navigate to result page
            navigate("/result", { state: { mediaUrl: localMediaUrl, result } });
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
            toast({
              title: "Transcription Complete",
              description: "Your media has been successfully transcribed.",
            });
            // Navigate to result page
            navigate("/result", { state: { mediaUrl: url, result } });
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
      </div>
    </div>
  );
}
