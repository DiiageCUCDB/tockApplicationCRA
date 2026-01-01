import React, { useState, useEffect } from 'react';
import { tockCommands } from '../api';
import { Play, Square, Plus, Clock, FolderOpen, Star } from 'lucide-react';
import { ProjectSelectionModal } from './ProjectSelectionModal';
import { ApiRoute, FavoriteProject } from '../types';

interface ActivityTabProps {
  showMessage: (type: 'success' | 'error', text: string) => void;
}

interface ParsedActivity {
  start: string;
  description: string;
  project: string;
  duration: string;
}

interface Project {
  name: string;
  description: string;
  lastUsed?: string;
  source?: string;
  isFavorite?: boolean;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ showMessage }) => {
  const [project, setProject] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedActivities, setParsedActivities] = useState<ParsedActivity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [favorites, setFavorites] = useState<Project[]>([]);
  const [apiRoutes, setApiRoutes] = useState<ApiRoute[]>([]);
  const [currentIsFavorite, setCurrentIsFavorite] = useState(false);

  useEffect(() => {
    refreshCurrentActivities();
    // Load projects once when component mounts
    loadRecentProjects();
    loadFavorites();
    loadApiRoutes();
  }, []);

  // Check if current project/description is a favorite when they change
  useEffect(() => {
    checkIfFavorite();
  }, [project, description]);

  const parseActivityOutput = (output: string): ParsedActivity[] => {
    const lines = output.trim().split('\n');
    const activities: ParsedActivity[] = [];
    
    // Skip empty output
    if (!output.trim() || output.includes('No current activity')) {
      return activities;
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip header line
      if (i === 0 && (line.includes('Start') && line.includes('Description') && line.includes('Project'))) {
        continue;
      }
      
      // Skip empty lines
      if (!line) {
        continue;
      }
      
      // Use regex to parse the line format
      // Expected format: "YYYY-MM-DD HH:MM  description  project  duration"
      const regex = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s+(\S+)\s+(\S+)\s+(\S+)$/;
      const match = line.match(regex);
      
      if (match) {
        const [, start, description, project, duration] = match;
        
        // Format duration nicely
        let displayDuration = duration;
        if (duration.endsWith('s') && !duration.includes('m') && !duration.includes('h')) {
          const seconds = parseInt(duration);
          if (!isNaN(seconds)) {
            if (seconds >= 3600) {
              const hours = Math.floor(seconds / 3600);
              const minutes = Math.floor((seconds % 3600) / 60);
              const remainingSeconds = seconds % 60;
              displayDuration = `${hours}h${minutes > 0 ? `${minutes}m` : ''}${remainingSeconds > 0 ? `${remainingSeconds}s` : ''}`;
            } else if (seconds >= 60) {
              const minutes = Math.floor(seconds / 60);
              const remainingSeconds = seconds % 60;
              displayDuration = `${minutes}m${remainingSeconds > 0 ? `${remainingSeconds}s` : ''}`;
            }
          }
        }
        
        activities.push({
          start,
          description,
          project,
          duration: displayDuration,
        });
      } else {
        // Try a more flexible regex if the first one fails
        const flexibleRegex = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s+([^\s]+(?:\s+[^\s]+)*?)\s+([^\s]+)\s+([^\s]+)$/;
        const flexibleMatch = line.match(flexibleRegex);
        
        if (flexibleMatch) {
          const [, start, description, project, duration] = flexibleMatch;
          activities.push({
            start,
            description: description.trim(),
            project,
            duration,
          });
        } else {
          console.log('Could not parse line:', line);
        }
      }
    }
    
    return activities;
  };

  const refreshCurrentActivities = async () => {
    const result = await tockCommands.getCurrentActivity();
    console.log(`Loaded current activities:`, result);
    const output = result.success ? result.output : result.error || 'No active activities';
    setParsedActivities(parseActivityOutput(output));
  };

  const loadRecentProjects = async () => {
    const result = await tockCommands.getRecentActivities(100);
    if (!result.success) {
      return;
    }

    const activities = parseActivityOutput(result.output);
    
    // Create a map to store unique projects with their most recent description
    // Activities are returned from most recent to oldest, so we process them in reverse
    // to keep the most recent description
    const projectMap = new Map<string, Project>();
    
    // Process in reverse order so most recent activities override older ones
    activities.reverse().forEach((activity) => {
      projectMap.set(activity.project, {
        name: activity.project,
        description: activity.description,
        lastUsed: activity.start,
      });
    });

    // Convert map to array and sort by name
    const projects = Array.from(projectMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    setAvailableProjects(projects);
  };

  const loadFavorites = async () => {
    const result = await tockCommands.getAllFavorites();
    if (result.success) {
      try {
        const favs: FavoriteProject[] = JSON.parse(result.output);
        const projects: Project[] = favs.map(f => ({
          name: f.name,
          description: f.description,
          isFavorite: true,
          source: 'favorite'
        }));
        setFavorites(projects);
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }
  };

  const loadApiRoutes = async () => {
    const result = await tockCommands.getAllApiRoutes();
    if (result.success) {
      try {
        const routes: ApiRoute[] = JSON.parse(result.output);
        setApiRoutes(routes);
      } catch (e) {
        console.error('Failed to parse API routes:', e);
      }
    }
  };

  const checkIfFavorite = async () => {
    if (!project || !description) {
      setCurrentIsFavorite(false);
      return;
    }
    
    const result = await tockCommands.isFavorite(project, description);
    setCurrentIsFavorite(result.success && result.output === 'true');
  };

  const handleFetchFromApi = async (routeId: number): Promise<Project[]> => {
    const route = apiRoutes.find(r => r.id === routeId);
    if (!route) return [];

    try {
      const result = await tockCommands.fetchProjectsFromApi(route.url);
      if (result.success) {
        // Parse the JSON response from the API
        const parsed = JSON.parse(result.output);
        
        // Support both formats:
        // 1. Direct array: [{"name": "project1", "description": "desc1"}]
        // 2. Object with results: {results: [{"name": "project1", "description": "desc1"}]}
        const apiProjects = Array.isArray(parsed) ? parsed : (parsed.results || []);
        
        // Convert to our Project format
        return apiProjects.map((p: any) => ({
          name: p.name || p.project,
          description: p.description || p.desc || '',
          source: route.name,
        }));
      } else {
        showMessage('error', `Failed to fetch from ${route.name}: ${result.error}`);
        return [];
      }
    } catch (e) {
      showMessage('error', `Error fetching from ${route.name}: ${e}`);
      return [];
    }
  };

  const handleOpenProjectModal = async () => {
    setIsModalOpen(true);
    // Only reload if we don't have any projects yet
    if (availableProjects.length === 0) {
      await loadRecentProjects();
    }
  };

  const handleProjectSelect = (selectedProject: Project) => {
    setProject(selectedProject.name);
    setDescription(selectedProject.description);
  };

  // Determine if user wants to start/stop or add activity
  const isAddingActivity = () => {
    // If both start and end time are provided, or duration is provided, it's adding
    if (startTime && (endTime || duration)) {
      return true;
    }
    // If start time contains a date (YYYY-MM-DD), it's adding
    if (startTime && startTime.includes('-')) {
      return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!project || !description) {
      showMessage('error', 'Project and description are required');
      return;
    }

    setLoading(true);
    let result;
    const isAdding = isAddingActivity(); // Store before clearing state

    if (isAdding) {
      // Add past activity
      if (!startTime) {
        showMessage('error', 'Start time is required for adding activities');
        setLoading(false);
        return;
      }
      result = await tockCommands.addActivity(
        project,
        description,
        startTime,
        endTime.trim() === '' ? undefined : endTime,
        duration.trim() === '' ? undefined : duration
      );
    } else {
      // Start new activity
      result = await tockCommands.startActivity(
        project,
        description,
        startTime.trim() === '' ? undefined : startTime
      );
    }

    setLoading(false);

    if (result.success) {
      // Handle favorites if checkbox is checked
      if (currentIsFavorite) {
        await tockCommands.addFavorite(project, description);
        await loadFavorites();
      }
      
      showMessage('success', isAdding ? 'Activity added successfully!' : 'Activity started successfully!');
      setProject('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setDuration('');
      refreshCurrentActivities();
    } else {
      showMessage('error', result.error || 'Operation failed');
    }
  };

  const toggleFavorite = async () => {
    if (!project || !description) return;

    if (currentIsFavorite) {
      await tockCommands.removeFavorite(project, description);
      setCurrentIsFavorite(false);
    } else {
      await tockCommands.addFavorite(project, description);
      setCurrentIsFavorite(true);
    }
    await loadFavorites();
  };

  const handleStopActivity = async () => {
    setLoading(true);
    const result = await tockCommands.stopActivity(endTime.trim() === '' ? undefined : endTime);
    setLoading(false);

    if (result.success) {
      showMessage('success', 'Activity stopped successfully!');
      setEndTime('');
      refreshCurrentActivities();
    } else {
      showMessage('error', result.error || 'Failed to stop activity');
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left Column: Current Activities (66%) */}
      <div className="flex-[2] bg-slate-50 rounded-lg p-6 border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Current Activities</h2>
        
        {parsedActivities.length > 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Start</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Project</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Duration</th>
                </tr>
              </thead>
              <tbody>
                {parsedActivities.map((activity, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{activity.start}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">{activity.description}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{activity.project}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-slate-400" />
                        {activity.duration}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 border border-slate-200 mb-4 text-center">
            <p className="text-slate-500">No active activities</p>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={refreshCurrentActivities}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleStopActivity}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Square size={16} />
            Stop Current Activity
          </button>
        </div>
      </div>

      {/* Right Column: Form (33%) */}
      <div className="flex-1 bg-slate-50 rounded-lg p-6 border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Track Time</h2>
        
        {/* Button to select previous project */}
        <button
          onClick={handleOpenProjectModal}
          className="w-full mb-4 px-4 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <FolderOpen size={16} />
          Select Previous Project
        </button>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="My Project"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Task description"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={toggleFavorite}
                disabled={!project || !description}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Star 
                  size={16} 
                  className={currentIsFavorite ? "fill-yellow-500 text-yellow-500" : ""}
                />
                {currentIsFavorite ? 'Favorited' : 'Add to favorites'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Time
            </label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="HH:MM or YYYY-MM-DD HH:MM"
            />
            <p className="text-xs text-slate-500 mt-1">Optional for new activities</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              End Time
            </label>
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="HH:MM or YYYY-MM-DD HH:MM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="e.g., 1h, 30m, 1h30m"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              'Processing...'
            ) : isAddingActivity() ? (
              <>
                <Plus size={16} />
                Add Activity
              </>
            ) : (
              <>
                <Play size={16} />
                Start Activity
              </>
            )}
          </button>

          <p className="text-xs text-slate-600 text-center">
            {isAddingActivity()
              ? 'Adding a past activity'
              : 'Starting a new activity'}
          </p>
        </div>
      </div>

      {/* Project Selection Modal */}
      <ProjectSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleProjectSelect}
        projects={availableProjects}
        favorites={favorites}
        apiRoutes={apiRoutes}
        onFetchFromApi={handleFetchFromApi}
      />
    </div>
  );
};
