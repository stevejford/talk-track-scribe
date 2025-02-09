
import { useState } from "react";
import { TranscriptUtterance } from "@/types/assemblyai";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TranscriptionViewerProps {
  utterances: TranscriptUtterance[];
  currentTime: number;
  onUtteranceClick: (start: number) => void;
}

const SPEAKER_COLORS: { [key: string]: string } = {
  A: "bg-blue-100 text-blue-800 border-blue-200",
  B: "bg-green-100 text-green-800 border-green-200",
  C: "bg-purple-100 text-purple-800 border-purple-200",
  D: "bg-orange-100 text-orange-800 border-orange-200",
};

export function TranscriptionViewer({
  utterances,
  currentTime,
  onUtteranceClick,
}: TranscriptionViewerProps) {
  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string>>(
    new Set(utterances.map((u) => u.speaker))
  );

  const toggleSpeaker = (speaker: string) => {
    const newSelected = new Set(selectedSpeakers);
    if (newSelected.has(speaker)) {
      newSelected.delete(speaker);
    } else {
      newSelected.add(speaker);
    }
    setSelectedSpeakers(newSelected);
  };

  const speakers = Array.from(new Set(utterances.map((u) => u.speaker))).sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {speakers.map((speaker) => (
          <Badge
            key={speaker}
            variant="outline"
            className={cn(
              "cursor-pointer transition-colors",
              selectedSpeakers.has(speaker)
                ? SPEAKER_COLORS[speaker]
                : "opacity-50"
            )}
            onClick={() => toggleSpeaker(speaker)}
          >
            Speaker {speaker}
          </Badge>
        ))}
      </div>

      <ScrollArea className="h-[400px] rounded-md border p-4">
        <div className="space-y-4">
          {utterances
            .filter((u) => selectedSpeakers.has(u.speaker))
            .map((utterance, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-lg transition-colors cursor-pointer hover:bg-accent",
                  currentTime >= utterance.start && currentTime <= utterance.end
                    ? "bg-accent"
                    : "bg-card",
                  SPEAKER_COLORS[utterance.speaker]
                )}
                onClick={() => onUtteranceClick(utterance.start)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    Speaker {utterance.speaker}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(utterance.start)} - {formatTime(utterance.end)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{utterance.text}</p>
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
