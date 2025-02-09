
export interface TranscriptUtterance {
  confidence: number;
  end: number;
  speaker: string;
  start: number;
  text: string;
  words: {
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker: string;
  }[];
}

export interface TranscriptionResult {
  utterances: TranscriptUtterance[];
  status: string;
  text: string;
  id: string;
}

export interface TranscriptionConfig {
  speaker_labels: boolean;
  speakers_expected?: number;
}
