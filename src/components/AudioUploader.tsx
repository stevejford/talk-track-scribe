
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AudioUploaderProps {
  onFileSelected: (file: File) => void;
  onUrlSubmitted: (url: string) => void;
  isProcessing: boolean;
}

export function AudioUploader({ onFileSelected, onUrlSubmitted, isProcessing }: AudioUploaderProps) {
  const [url, setUrl] = useState("");

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac']
    },
    disabled: isProcessing,
    maxFiles: 1,
  });

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSubmitted(url.trim());
      setUrl("");
    }
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-border",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <Upload className="w-12 h-12 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragActive ? "Drop your audio file here" : "Drag & drop your audio file"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to select a file from your computer
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <form onSubmit={handleUrlSubmit} className="flex space-x-2">
          <Input
            type="url"
            placeholder="Enter audio URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isProcessing}
          />
          <Button type="submit" disabled={!url.trim() || isProcessing}>
            <Link className="w-4 h-4 mr-2" />
            Submit URL
          </Button>
        </form>
      </div>
    </div>
  );
}
