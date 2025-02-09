
import { useState } from "react";
import { MediaUploader } from "@/components/MediaUploader";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface MediaInputSectionProps {
  isProcessing: boolean;
  progress: number;
  speakersExpected: number;
  onSpeakersChange: (speakers: number) => void;
  onFileSelected: (file: File) => void;
  onUrlSubmitted: (url: string) => void;
}

export function MediaInputSection({
  isProcessing,
  progress,
  speakersExpected,
  onSpeakersChange,
  onFileSelected,
  onUrlSubmitted,
}: MediaInputSectionProps) {
  return (
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
            onChange={(e) => onSpeakersChange(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            disabled={isProcessing}
            className="max-w-[200px]"
          />
        </div>
        <MediaUploader
          onFileSelected={onFileSelected}
          onUrlSubmitted={onUrlSubmitted}
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
  );
}
