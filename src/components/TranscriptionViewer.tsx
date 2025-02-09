
import { useState } from "react";
import { TranscriptUtterance } from "@/types/assemblyai";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TranscriptionViewerProps {
  utterances: TranscriptUtterance[];
  currentTime: number;
  onUtteranceClick: (start: number) => void;
  selectedSpeakers: Set<string>;
  onSpeakerToggle: (speaker: string) => void;
}

const SPEAKER_COLORS: { [key: string]: string } = {
  A: "bg-[#D3E4FD] text-blue-800 border-blue-200",
  B: "bg-[#F2FCE2] text-green-800 border-green-200",
  C: "bg-[#E5DEFF] text-purple-800 border-purple-200",
  D: "bg-[#FEC6A1] text-orange-800 border-orange-200",
  E: "bg-[#FFDEE2] text-red-800 border-red-200",
  F: "bg-[#FEF7CD] text-yellow-800 border-yellow-200",
  G: "bg-[#FDE1D3] text-pink-800 border-pink-200",
  H: "bg-[#9b87f5] text-indigo-100 border-indigo-200",
  I: "bg-[#7E69AB] text-purple-100 border-purple-200",
  J: "bg-[#6E59A5] text-purple-100 border-purple-200",
};

export function TranscriptionViewer({
  utterances,
  currentTime,
  onUtteranceClick,
  selectedSpeakers,
  onSpeakerToggle,
}: TranscriptionViewerProps) {
  const speakers = Array.from(new Set(utterances.map((u) => u.speaker))).sort();
  const [speakerNames, setSpeakerNames] = useState<{ [key: string]: string }>({});
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  const playSpeakerSegment = (utterance: TranscriptUtterance) => {
    const mediaElement = document.querySelector("video, audio") as HTMLMediaElement;
    if (mediaElement) {
      mediaElement.currentTime = utterance.start / 1000;
      mediaElement.play();
    }
  };

  const handleSpeakerRename = (speaker: string) => {
    if (tempName.trim()) {
      setSpeakerNames({
        ...speakerNames,
        [speaker]: tempName.trim(),
      });
    }
    setEditingSpeaker(null);
    setTempName("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {speakers.map((speaker) => (
          <Popover
            key={speaker}
            open={editingSpeaker === speaker}
            onOpenChange={(open) => {
              if (open) {
                setEditingSpeaker(speaker);
                setTempName(speakerNames[speaker] || "");
              } else {
                handleSpeakerRename(speaker);
              }
            }}
          >
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedSpeakers.has(speaker)
                      ? SPEAKER_COLORS[speaker]
                      : "opacity-50"
                  )}
                  onClick={() => onSpeakerToggle(speaker)}
                >
                  {speakerNames[speaker] || `Speaker ${speaker}`}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Rename Speaker {speaker}
                </label>
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Enter speaker name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSpeakerRename(speaker);
                    }
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
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
                  "p-4 rounded-lg transition-colors",
                  currentTime * 1000 >= utterance.start &&
                    currentTime * 1000 <= utterance.end
                    ? "bg-accent"
                    : "bg-card",
                  SPEAKER_COLORS[utterance.speaker]
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {speakerNames[utterance.speaker] ||
                        `Speaker ${utterance.speaker}`}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => playSpeakerSegment(utterance)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
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
