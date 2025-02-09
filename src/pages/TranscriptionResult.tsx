
import { useLocation } from "react-router-dom";
import { TranscriptionPlayer } from "@/components/TranscriptionPlayer";
import { TranscriptionViewer } from "@/components/TranscriptionViewer";
import { useState } from "react";
import type { TranscriptionResult as TranscriptionResultType } from "@/types/assemblyai";

export default function TranscriptionResult() {
  const location = useLocation();
  const { mediaUrl, result } = location.state as {
    mediaUrl: string;
    result: TranscriptionResultType;
  };
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string>>(
    new Set(result.utterances.map((u) => u.speaker))
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight text-center mb-8">
          Transcription Result
        </h1>
        
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
      </div>
    </div>
  );
}
