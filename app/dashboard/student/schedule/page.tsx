"use client";

import { useEffect, useState } from "react";
import MeetingCard from "./components/MeetingCard";
import MeetingIframe from "./components/MeetingIframe";
import { Loader2 } from "lucide-react";

export default function StudentMeetingsPage() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMeeting, setActiveMeeting] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/student/sessions");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setUpcoming(json.upcoming);
        setPast(json.past);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    );

  if (activeMeeting)
    return (
      <MeetingIframe
        meetingUrl={activeMeeting.meeting_url}
        onLeave={() => setActiveMeeting(null)}
      />
    );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-3">Upcoming Classes</h2>
        {upcoming.length ? (
          <div className="grid gap-3">
            {upcoming.map((s) => (
              <MeetingCard
                key={s.id}
                session={s}
                onJoin={() => setActiveMeeting(s)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No upcoming classes.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Past Classes</h2>
        {past.length ? (
          <div className="grid gap-3">
            {past.map((s) => (
              <MeetingCard key={s.id} session={s} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No past classes.</p>
        )}
      </section>
    </div>
  );
}
