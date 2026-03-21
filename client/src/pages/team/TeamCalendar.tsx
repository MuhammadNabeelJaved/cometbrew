/**
 * Team Calendar Page
 * A visual calendar for tracking project milestones and deadlines
 */
import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function TeamCalendar() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDate = new Date();
  
  // Mock events
  const events = [
    { day: 5, title: 'Project Kickoff', type: 'meeting' },
    { day: 12, title: 'Design Review', type: 'review' },
    { day: 15, title: 'Client Presentation', type: 'client' },
    { day: 24, title: 'Sprint Planning', type: 'planning' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-2">Track team schedules and project milestones.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline">Today</Button>
          <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          <Button className="ml-2 gap-2"><Plus className="h-4 w-4" /> New Event</Button>
        </div>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <div className="grid grid-cols-7 gap-px text-center">
            {days.map(day => (
              <div key={day} className="text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <div className="grid grid-cols-7 grid-rows-5 h-full">
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = i - 2; // Offset for demo
              const event = events.find(e => e.day === dayNum);
              
              return (
                <div key={i} className="border-b border-r p-2 min-h-[100px] relative hover:bg-muted/20 transition-colors">
                  {dayNum > 0 && dayNum <= 31 && (
                    <>
                      <span className={`text-sm ${dayNum === currentDate.getDate() ? 'bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center' : 'text-muted-foreground'}`}>
                        {dayNum}
                      </span>
                      {event && (
                        <div className={`mt-2 text-xs p-1.5 rounded truncate ${
                          event.type === 'meeting' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                          event.type === 'client' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                          'bg-green-500/10 text-green-600 dark:text-green-400'
                        }`}>
                          {event.title}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}