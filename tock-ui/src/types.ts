export interface Activity {
  project: string;
  description: string;
  start_time?: string;
  end_time?: string;
  duration?: string;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface FavoriteProject {
  id?: number;
  name: string;
  description: string;
  created_at?: string;
}

export interface ApiRoute {
  id?: number;
  name: string;
  url: string;
  enabled: boolean;
  created_at?: string;
}

export interface TockCommands {
  startActivity: (project: string, description: string, time?: string) => Promise<CommandResult>;
  stopActivity: (time?: string) => Promise<CommandResult>;
  addActivity: (
    project: string,
    description: string,
    start: string,
    end?: string,
    duration?: string
  ) => Promise<CommandResult>;
  continueActivity: (
    index?: number,
    description?: string,
    project?: string,
    time?: string
  ) => Promise<CommandResult>;
  getCurrentActivity: () => Promise<CommandResult>;
  getRecentActivities: (number?: number) => Promise<CommandResult>;
  getReport: (dateType: string, date?: string) => Promise<CommandResult>;
  checkTockInstalled: () => Promise<CommandResult>;
  getActivitiesForDate: (date: string) => Promise<CommandResult>;
  saveReportToFile: (dateType: string, date?: string, startDate?: string, endDate?: string, customPath?: string) => Promise<CommandResult>;
  
  // Favorites
  addFavorite: (name: string, description: string) => Promise<CommandResult>;
  removeFavorite: (name: string, description: string) => Promise<CommandResult>;
  isFavorite: (name: string, description: string) => Promise<CommandResult>;
  getAllFavorites: () => Promise<CommandResult>;
  
  // API Routes
  addApiRoute: (name: string, url: string) => Promise<CommandResult>;
  updateApiRoute: (id: number, name: string, url: string, enabled: boolean) => Promise<CommandResult>;
  deleteApiRoute: (id: number) => Promise<CommandResult>;
  getAllApiRoutes: () => Promise<CommandResult>;
  fetchProjectsFromApi: (url: string) => Promise<CommandResult>;
}
