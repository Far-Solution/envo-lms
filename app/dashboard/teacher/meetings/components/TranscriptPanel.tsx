"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function TranscriptPanel({ sessionId }: { sessionId: string }) {
  const [chunks, setChunks] = useState<any[]>([]);

  useEffect(() => {
    // fetch existing transcripts for this session
    supabase
      .from("live_transcripts")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setChunks(data);
      });

    // realtime updates
    const channel = supabase
      .channel("transcript-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_transcripts",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setChunks((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return (
    <div className="p-3 bg-gray-50 rounded-lg h-full overflow-y-auto">
      <h2 className="font-semibold mb-2">Live Transcript</h2>
      {chunks.map((c) => (
        <p key={c.id} className="text-sm text-gray-700">
          <strong>{c.speaker || "User"}:</strong> {c.chunk_text}
        </p>
      ))}
    </div>
  );
}
