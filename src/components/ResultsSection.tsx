
import { TranscriptionResult } from "@/types/assemblyai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TranscriptionPlayer } from "@/components/TranscriptionPlayer";
import { TranscriptionViewer } from "@/components/TranscriptionViewer";
import { useState } from "react"; // Added this import

interface ResultsSectionProps {
  mediaUrl: string;
  transcriptionResult: TranscriptionResult;
  sessionTitle: string;
  onSessionTitleChange: (title: string) => void;
  onSaveSession: () => void;
  selectedSpeakers: Set<string>;
  onSelectedSpeakersChange: (speakers: Set<string>) => void;
}

export function ResultsSection({
  mediaUrl,
  transcriptionResult,
  sessionTitle,
  onSessionTitleChange,
  onSaveSession,
  selectedSpeakers,
  onSelectedSpeakersChange,
}: ResultsSectionProps) {
  const [currentTime, setCurrentTime] = useState(0);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              value={sessionTitle}
              onChange={(e) => onSessionTitleChange(e.target.value)}
              placeholder="Enter a title for this session"
            />
          </div>
          <Button onClick={onSaveSession} className="mt-6">
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
          onSelectedSpeakersChange(newSelectedSpeakers);
        }}
      />
    </>
  );
}
