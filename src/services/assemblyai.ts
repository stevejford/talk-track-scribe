
import { TranscriptionResult } from "@/types/assemblyai";

const API_BASE_URL = "https://api.assemblyai.com/v2";

export async function uploadAudio(file: File, apiKey: string): Promise<string> {
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
    throw new Error("Failed to upload audio file");
  }

  const { upload_url } = await response.json();
  return upload_url;
}

export async function startTranscription(audioUrl: string, apiKey: string): Promise<string> {
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
    throw new Error("Failed to start transcription");
  }

  const { id } = await response.json();
  return id;
}

export async function getTranscriptionResult(id: string, apiKey: string): Promise<TranscriptionResult> {
  const response = await fetch(`${API_BASE_URL}/transcript/${id}`, {
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get transcription result");
  }

  return response.json();
}
