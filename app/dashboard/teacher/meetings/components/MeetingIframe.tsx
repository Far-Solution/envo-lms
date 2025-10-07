"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function MeetingIframe({ meetingUrl, onLeave }: any) {
  return (
    <div className="flex flex-col h-[80vh] w-full">
      <div className="flex items-center justify-between p-2 border-b">
        <Button variant="ghost" onClick={onLeave}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <span className="font-semibold text-sm text-gray-600">
          In Meeting
        </span>
      </div>
      <iframe
        src={`${process.env.NEXT_PUBLIC_JITSI_BASE_URL}/${meetingUrl}`}
        allow="camera; microphone; fullscreen; display-capture"
        className="w-full flex-1 rounded-lg border"
      />
    </div>
  );
}
