
import { useState, useRef, useEffect } from "react";
import { TranscriptUtterance } from "@/types/assemblyai";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptionPlayerProps {
  mediaUrl: string;
  utterances: TranscriptUtterance[];
  onTimeUpdate?: (time: number) => void;
  selectedSpeakers?: Set<string>;
}

export function TranscriptionPlayer({
  mediaUrl,
  utterances,
  onTimeUpdate,
  selectedSpeakers,
}: TranscriptionPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const isVideo = mediaUrl.match(/\.(mp4|mov|webm)$/i);

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (!mediaRef.current || !utterances || !selectedSpeakers) return;

    const currentUtterance = utterances.find(
      (u) =>
        currentTime * 1000 >= u.start &&
        currentTime * 1000 <= u.end &&
        selectedSpeakers.has(u.speaker)
    );

    if (!currentUtterance) {
      mediaRef.current.volume = 0;
    } else {
      mediaRef.current.volume = volume;
    }
  }, [currentTime, utterances, selectedSpeakers, volume]);

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
      onTimeUpdate?.(mediaRef.current.currentTime * 1000);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const skipTime = (seconds: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime += seconds;
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {isVideo && (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={mediaUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain"
          />
        </div>
      )}
      {!isVideo && (
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={mediaUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <div className="p-4 bg-card rounded-lg shadow-lg space-y-4">
        <div className="flex items-center justify-between space-x-4">
          <span className="text-sm font-medium">{formatTime(currentTime)}</span>
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={(value) => {
              if (mediaRef.current) {
                mediaRef.current.currentTime = value[0];
              }
            }}
            className="w-full"
          />
          <span className="text-sm font-medium">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skipTime(-10)}
            className="hover:bg-primary/10"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            onClick={togglePlay}
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full",
              isPlaying ? "bg-primary" : "bg-primary hover:bg-primary/90"
            )}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => skipTime(10)}
            className="hover:bg-primary/10"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="hover:bg-primary/10"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          <Slider
            value={[volume * 100]}
            max={100}
            onValueChange={(value) => setVolume(value[0] / 100)}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
