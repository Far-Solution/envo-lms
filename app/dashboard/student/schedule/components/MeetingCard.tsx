"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MeetingCard({ session, onJoin }: any) {
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <h3 className="font-medium">{session.title}</h3>
        <p className="text-sm text-gray-500">{session.description}</p>
      </CardHeader>
      <CardContent className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {new Date(session.start_time).toLocaleString()}
        </p>
        {onJoin && (
          <Button onClick={onJoin} size="sm">
            Join
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
