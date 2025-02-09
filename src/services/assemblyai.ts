
import { TranscriptionResult } from "@/types/assemblyai";

const API_BASE_URL = "https://api.assemblyai.com/v2";
const API_KEY = "5ef9e585f281418c9f717f5bc99c24ba"; // Public API key for demo purposes

export async function uploadAudio(file: File): Promise<string> {
  console.log("Starting audio upload...", { fileName: file.name, fileSize: file.size });
  
  // Get the correct MIME type and validate it
  const mimeType = file.type || getMimeType(file.name);
  if (!isValidMediaType(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Please upload an audio or video file.`);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: API_KEY,
      },
      body: file,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Upload failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Failed to upload audio file: ${response.statusText}`);
    }

    const { upload_url } = await response.json();
    console.log("Upload successful, received URL:", upload_url);
    return upload_url;
  } catch (error) {
    console.error("Error during upload:", error);
    throw error;
  }
}

function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'flac': 'audio/flac',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'webm': 'video/webm',
    'ogg': 'audio/ogg',
    'oga': 'audio/ogg',
    'ogv': 'video/ogg',
    'm4v': 'video/mp4'
  };
  return mimeTypes[ext || ''] || 'audio/mpeg';
}

function isValidMediaType(mimeType: string): boolean {
  return mimeType.startsWith('audio/') || mimeType.startsWith('video/');
}

export async function startTranscription(audioUrl: string): Promise<string> {
  console.log("Starting transcription...", { audioUrl });
  const requestBody = {
    audio_url: audioUrl,
    speaker_labels: true,
    speakers_expected: 8
  };

  console.log("Sending request with body:", requestBody);

  const response = await fetch(`${API_BASE_URL}/transcript`, {
    method: "POST",
    headers: {
      Authorization: API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Transcription start failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`Failed to start transcription: ${response.statusText}`);
  }

  const { id } = await response.json();
  console.log("Transcription started with ID:", id);
  return id;
}

export async function getTranscriptionResult(id: string): Promise<TranscriptionResult> {
  console.log("Checking transcription status...", { id });
  const response = await fetch(`${API_BASE_URL}/transcript/${id}`, {
    headers: {
      Authorization: API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Getting transcription result failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`Failed to get transcription result: ${response.statusText}`);
  }

  const result = await response.json();
  console.log("Received transcription status:", result.status);
  
  if (result.status === "error") {
    console.error("Transcription failed:", result.error);
    throw new Error(`Transcription failed: ${result.error || 'Unknown error occurred'}`);
  }
  
  return result;
}
