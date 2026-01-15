import React, { useState, useEffect } from 'react';
import { tockCommands } from '../api';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  addMonths,
  subMonths,
  isSameDay,
  getDay
} from 'date-fns';

interface ActivityData {
  date: string;
  activities: string[];
  colors: { [project: string]: string };
}

export const HistoryTab: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activitiesData, setActivitiesData] = useState<{ [key: string]: ActivityData }>({});
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Date separator format used by the backend
  // Format: === YYYY-MM-DD ===
  const DATE_SEPARATOR_REGEX = /\n*===\s*(\d{4}-\d{2}-\d{2})\s*===\n*/;

  // Color palette for activities
  const colorPalette = [
    '#94a3b8', // slate-400
    '#60a5fa', // blue-400
    '#34d399', // emerald-400
    '#fbbf24', // amber-400
    '#f472b6', // pink-400
    '#a78bfa', // violet-400
    '#fb923c', // orange-400
    '#22d3ee', // cyan-400
  ];

  const parseActivitiesOutput = (output: string, dateStr: string): ActivityData => {
    const lines = output.trim().split('\n');
    const activities: string[] = [];
    const colors: { [project: string]: string } = {};
    const projects = new Set<string>();
    
    // Skip the header lines
    let currentProject = '';
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.includes('Time Tracking Report') || trimmedLine.includes('=====')) {
        return; // Skip empty lines and headers
      }
      
      // Check if it's a project header (starts with 📁)
      if (trimmedLine.startsWith('📁')) {
        // Extract project name from "📁 loiu: 1h 3m"
        const projectMatch = trimmedLine.match(/📁\s*([^:]+):/);
        if (projectMatch) {
          currentProject = projectMatch[1].trim();
          projects.add(currentProject);
        }
        return;
      }
      
      // Check if it's an activity line (contains timestamp)
      if (trimmedLine.includes('-') && trimmedLine.includes('(') && currentProject) {
        // The line format is: "13:46 - 14:49 (1h 3m) | uil"
        // We want to extract the description after the pipe
        const parts = trimmedLine.split('|');
        if (parts.length >= 2) {
          const timePart = parts[0].trim(); // "13:46 - 14:49 (1h 3m)"
          const description = parts[1].trim(); // "uil"
          
          // Format as: "TIME | PROJECT | DESCRIPTION"
          const formattedActivity = `${timePart} | ${currentProject} | ${description}`;
          activities.push(formattedActivity);
        } else {
          // Fallback: just add the line as-is
          activities.push(trimmedLine);
        }
      }
    });

    // Assign colors to projects
    Array.from(projects).forEach((project, index) => {
      colors[project] = colorPalette[index % colorPalette.length];
    });

    return { date: dateStr, activities, colors };
  };

  const loadActivitiesForMonth = async (useCache: boolean = true) => {
    setLoading(true);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1; // JavaScript months are 0-indexed
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

    // Try to load from cache first if useCache is true
    if (useCache) {
      const cacheResult = await tockCommands.getCalendarCache(yearMonth);
      if (cacheResult.success) {
        try {
          const cachedData = JSON.parse(cacheResult.output);
          setActivitiesData(cachedData);
          setLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse calendar cache:', e);
          // Continue to fetch fresh data
        }
      }
    }

    const newActivitiesData: { [key: string]: ActivityData } = {};

    // Use the new bulk month fetch API
    const result = await tockCommands.getActivitiesForMonth(year, month);
    
    if (result.success && result.output.trim()) {
      // Parse the combined output which has format defined by DATE_SEPARATOR_REGEX:
      // === 2026-01-01 ===
      // <report data>
      //
      // === 2026-01-02 ===
      // <report data>
      
      const sections = result.output.split(DATE_SEPARATOR_REGEX);
      
      // sections will be like: ['', '2026-01-01', '<data>', '2026-01-02', '<data>', ...]
      // Ensure we have pairs of (date, data) by checking bounds
      for (let i = 1; i + 1 < sections.length; i += 2) {
        const dateStr = sections[i];
        const output = sections[i + 1];
        
        if (dateStr && output && output.trim()) {
          newActivitiesData[dateStr] = parseActivitiesOutput(output, dateStr);
        }
      }
      
      // Save to cache
      await tockCommands.saveCalendarCache(yearMonth, JSON.stringify(newActivitiesData));
    }

    setActivitiesData(newActivitiesData);
    setLoading(false);
  };
  
  const handleRefresh = async () => {
    await loadActivitiesForMonth(false); // Force refresh, bypass cache
  };

  const loadFavorites = async () => {
    const result = await tockCommands.getAllFavorites();
    if (result.success) {
      try {
        const favs = JSON.parse(result.output);
        const favSet = new Set<string>(favs.map((f: any) => `${f.name}|${f.description}`));
        setFavorites(favSet);
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }
  };

  const isFavorite = (project: string, description: string) => {
    return favorites.has(`${project}|${description}`);
  };

  const toggleFavorite = async (project: string, description: string) => {
    const key = `${project}|${description}`;
    if (favorites.has(key)) {
      await tockCommands.removeFavorite(project, description);
      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    } else {
      await tockCommands.addFavorite(project, description);
      setFavorites(prev => new Set(prev).add(key));
    }
  };

  useEffect(() => {
    loadActivitiesForMonth();
    loadFavorites();
  }, [currentMonth]);

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = monthStart;
    const endDate = monthEnd;

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const firstDayOfWeek = getDay(monthStart);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-800">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh calendar data"
            >
              <svg className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Calendar days */}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasActivities = activitiesData[dateStr] && activitiesData[dateStr].activities.length > 0;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const dayData = activitiesData[dateStr];

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(day)}
                className={`aspect-square p-2 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-slate-700 text-white ring-2 ring-slate-500'
                    : hasActivities
                    ? 'bg-slate-100 hover:bg-slate-200'
                    : 'bg-white hover:bg-slate-50 text-slate-400'
                } border ${
                  hasActivities ? 'border-slate-300' : 'border-slate-100'
                } relative`}
              >
                <div className="text-sm font-medium">{format(day, 'd')}</div>
                {hasActivities && dayData && (
                  <div className="flex gap-0.5 justify-center mt-1 flex-wrap">
                    {Object.keys(dayData.colors).slice(0, 3).map((project, idx) => (
                      <div
                        key={idx}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: dayData.colors[project] }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="text-center mt-4 text-slate-600">
            Loading activities...
          </div>
        )}
      </div>
    );
  };

  const renderSelectedDayDetails = () => {
    if (!selectedDate) {
      return (
        <div className="text-center text-slate-500 py-8">
          Select a day to view activities
        </div>
      );
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayData = activitiesData[dateStr];

    if (!dayData || dayData.activities.length === 0) {
      return (
        <div className="text-slate-500 text-center py-8">
          No activities for this day
        </div>
      );
    }

    // Parse activities for timeline display
    const timelineItems: Array<{
      time: string;
      project: string;
      description: string;
      color: string;
      duration: number;
    }> = [];
    let totalMinutes = 0;

    dayData.activities.forEach((activity) => {
      const parts = activity.split('|');
      if (parts.length >= 3) {
        const timePart = parts[0].trim();
        const projectPart = parts[1].trim();
        const descPart = parts[2].trim();

        // Extract time from "2026-01-01 13:46 - 13:47 (0h 1m)"
        // To 13:46 - 13:47
        const timeMatch = timePart.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
        const displayTime = timeMatch ? timeMatch[0] : '';

        // Parse duration
        const durationMatch = activity.match(/\((\d+)h\s*(\d+)m\)/);
        let minutes = 0;
        if (durationMatch) {
          minutes = parseInt(durationMatch[1], 10) * 60 + parseInt(durationMatch[2], 10);
        }

        const color = dayData.colors[projectPart] || '#cbd5e1';
        
        timelineItems.push({
          time: displayTime,
          project: projectPart,
          description: descPart,
          color: color,
          duration: minutes,
        });

        totalMinutes += minutes;
      }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;

    return (
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-6">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>

        {/* Timeline */}
        <div className="space-y-6">
          {timelineItems.map((item, index) => (
            <div key={index} className="flex gap-4">
              {/* Timeline on the left */}
              <div className="flex flex-col items-center">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: item.color }}
                />
                {index < timelineItems.length - 1 && (
                  <div
                    className="w-0.5 h-full min-h-[40px] mt-1"
                    style={{ backgroundColor: item.color, opacity: 0.3 }}
                  />
                )}
              </div>

              {/* Content on the right */}
              <div className="flex-1 pb-6">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-mono text-slate-600">{item.time}</span>
                    <span className="text-sm font-semibold text-slate-800">{item.project}</span>
                  </div>
                  <button
                    onClick={() => toggleFavorite(item.project, item.description)}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                    title={isFavorite(item.project, item.description) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star 
                      size={16} 
                      className={isFavorite(item.project, item.description) 
                        ? "fill-yellow-500 text-yellow-500" 
                        : "text-slate-400"
                      }
                    />
                  </button>
                </div>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            </div>
          ))}

          {/* Total time at the end */}
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-slate-400 border-2 border-white shadow-md" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">⏱️ Total:</span>
                <span className="font-mono text-slate-700">
                  {totalHours}h {totalMins}m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar View */}
      <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Calendar</h2>
        {renderCalendar()}
      </div>

      {/* Selected Day Details */}
      <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Activity Details</h2>
        <div className="bg-white rounded-lg p-4 border border-slate-200 min-h-[300px]">
          {renderSelectedDayDetails()}
        </div>
      </div>
    </div>
  );
};
