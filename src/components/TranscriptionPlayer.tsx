import { useState, useRef, useEffect } from "react";
import { TranscriptUtterance } from "@/types/assemblyai";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Ear,
  EarOff,
  Subtitles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptionPlayerProps {
  mediaUrl: string;
  utterances: TranscriptUtterance[];
  onTimeUpdate?: (time: number) => void;
  selectedSpeakers?: Set<string>;
}

const SPEAKER_COLORS: { [key: string]: string } = {
  A: "text-blue-500",
  B: "text-green-500",
  C: "text-purple-500",
  D: "text-orange-500",
  E: "text-red-500",
  F: "text-yellow-500",
  G: "text-pink-500",
  H: "text-indigo-500",
  I: "text-violet-500",
  J: "text-teal-500",
};

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
  const [error, setError] = useState<string | null>(null);
  const [originalSound, setOriginalSound] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number>(16/9);
  const isMobile = useIsMobile();

  useEffect(() => {
    const videoCheck = document.createElement('video');
    videoCheck.onloadedmetadata = () => {
      setIsVideo(true);
      setVideoAspectRatio(videoCheck.videoWidth / videoCheck.videoHeight);
    };
    videoCheck.onerror = () => {
      setIsVideo(false);
    };
    videoCheck.src = mediaUrl;

    return () => {
      videoCheck.src = '';
    };
  }, [mediaUrl]);

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = volume;
    }
  }, [volume]);

  const getCurrentWords = () => {
    if (!utterances) return [];
    const currentTimeMs = currentTime * 1000;
    return utterances.filter(utterance => 
      selectedSpeakers?.has(utterance.speaker) &&
      utterance.words.some(word => 
        word.start <= currentTimeMs && 
        word.end >= currentTimeMs
      )
    );
  };

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        setError(null);
        mediaRef.current.play().catch((e) => {
          console.error("Playback error:", e);
          setError("Failed to play media. Please try again.");
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
      onTimeUpdate?.(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleError = (e: any) => {
    console.error("Media error:", e);
    setError("Error loading media. Please check the file format and try again.");
    setIsPlaying(false);
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

  const toggleOriginalSound = () => {
    setOriginalSound(!originalSound);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getSubtitleSize = () => {
    if (!isMobile) return "text-2xl";
    if (videoAspectRatio < 1) {
      return "text-4xl";
    }
    return "text-xl";
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}
      <div className="relative">
        {isVideo ? (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden w-full">
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={mediaUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleError}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
              playsInline
              preload="auto"
            />
            {showSubtitles && (
              <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center justify-center space-y-2 p-4">
                {getCurrentWords().map((utterance, index) => (
                  <div 
                    key={index}
                    className={cn(
                      getSubtitleSize(),
                      "font-semibold bg-black/75 px-4 py-2 rounded-lg animate-fade-in whitespace-nowrap",
                      SPEAKER_COLORS[utterance.speaker]
                    )}
                  >
                    <span className="opacity-75">Speaker {utterance.speaker}:</span>{" "}
                    {utterance.words
                      .filter(
                        word => 
                          word.start <= currentTime * 1000 && 
                          word.end >= currentTime * 1000
                      )
                      .map(word => word.text)
                      .join(" ")}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={mediaUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleError}
            onEnded={() => setIsPlaying(false)}
            preload="auto"
          />
        )}
      </div>

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

        <div className="flex items-center justify-between">
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
          
          <div className="flex items-center space-x-2">
            <Button
              variant={showSubtitles ? "default" : "ghost"}
              onClick={() => setShowSubtitles(!showSubtitles)}
              className="space-x-2"
              size="sm"
            >
              <Subtitles className="h-4 w-4" />
              <span>{showSubtitles ? "Hide Subtitles" : "Show Subtitles"}</span>
            </Button>
            
            <Button
              variant={originalSound ? "default" : "ghost"}
              onClick={toggleOriginalSound}
              className="space-x-2"
              size="sm"
            >
              {originalSound ? (
                <>
                  <Ear className="h-4 w-4" />
                  <span>Original Audio</span>
                </>
              ) : (
                <>
                  <EarOff className="h-4 w-4" />
                  <span>Filtered Audio</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
