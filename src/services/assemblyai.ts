
import { TranscriptionResult } from "@/types/assemblyai";

const API_BASE_URL = "https://api.assemblyai.com/v2";

export async function uploadAudio(file: File, apiKey: string): Promise<string> {
  console.log("Starting audio upload...", { fileName: file.name, fileSize: file.size });
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
    },
    body: formData,
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
}

export async function startTranscription(audioUrl: string, apiKey: string): Promise<string> {
  console.log("Starting transcription...", { audioUrl });
  const response = await fetch(`${API_BASE_URL}/transcript`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speaker_labels: true,
      speakers_expected: 2,
    }),
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

export async function getTranscriptionResult(id: string, apiKey: string): Promise<TranscriptionResult> {
  console.log("Checking transcription status...", { id });
  const response = await fetch(`${API_BASE_URL}/transcript/${id}`, {
    headers: {
      Authorization: apiKey,
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
