
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptionResult } from "@/types/assemblyai";

interface SavedSession {
  id: string;
  title: string;
  date: string;
  mediaUrl: string;
  transcriptionResult: TranscriptionResult;
  thumbnail?: string;
}

interface LibrarySectionProps {
  savedSessions: SavedSession[];
  onLoadSession: (session: SavedSession) => void;
}

export function LibrarySection({ savedSessions, onLoadSession }: LibrarySectionProps) {
  return (
    <ScrollArea className="h-[600px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savedSessions.map((session) => (
          <Card key={session.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{session.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => onLoadSession(session)}>
                    Load
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.transcriptionResult.utterances.length} segments
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
