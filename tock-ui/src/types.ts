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

export interface ReportSettings {
  id?: number;
  auto_send_enabled: boolean;
  selected_api_route_id?: number;
  last_sent_at?: string;
  updated_at?: string;
}

export interface CachedProject {
  id?: number;
  name: string;
  description: string;
  source_api_route_id?: number;
  last_synced?: string;
}

export interface CalendarCache {
  id?: number;
  year_month: string;
  data: string;
  cached_at?: string;
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
  
  // Report API Routes (separate from regular API routes)
  addReportApiRoute: (name: string, url: string) => Promise<CommandResult>;
  updateReportApiRoute: (id: number, name: string, url: string, enabled: boolean) => Promise<CommandResult>;
  deleteReportApiRoute: (id: number) => Promise<CommandResult>;
  getAllReportApiRoutes: () => Promise<CommandResult>;
  
  // Report Settings
  getReportSettings: () => Promise<CommandResult>;
  updateReportSettings: (autoSendEnabled: boolean, selectedApiRouteId?: number) => Promise<CommandResult>;
  sendMonthlyReportToApi: (apiRouteId: number) => Promise<CommandResult>;
  checkAndSendAutoReport: () => Promise<CommandResult>;
  
  // Calendar Cache
  getCalendarCache: (yearMonth: string) => Promise<CommandResult>;
  saveCalendarCache: (yearMonth: string, data: string) => Promise<CommandResult>;
  clearCalendarCache: (yearMonth: string) => Promise<CommandResult>;
  
  // Cached Projects
  getCachedProjects: (apiRouteId?: number) => Promise<CommandResult>;
  syncApiProjects: (apiRouteId: number) => Promise<CommandResult>;
  syncAllApiProjects: () => Promise<CommandResult>;
  deleteCachedProjectsByApi: (apiRouteId: number) => Promise<CommandResult>;
  
  // User Preferences
  getUserPreference: (key: string) => Promise<CommandResult>;
  setUserPreference: (key: string, value: string) => Promise<CommandResult>;
}
