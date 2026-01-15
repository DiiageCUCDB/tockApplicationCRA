import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "./types";

export const tockCommands = {
  startActivity: async (
    project: string,
    description: string,
    time?: string
  ): Promise<CommandResult> => {
    return await invoke("start_activity", { project, description, time });
  },

  stopActivity: async (time?: string): Promise<CommandResult> => {
    return await invoke("stop_activity", { time });
  },

  addActivity: async (
    project: string,
    description: string,
    start: string,
    end?: string,
    duration?: string
  ): Promise<CommandResult> => {
    return await invoke("add_activity", {
      project,
      description,
      start,
      end,
      duration,
    });
  },

  continueActivity: async (
    index?: number,
    description?: string,
    project?: string,
    time?: string
  ): Promise<CommandResult> => {
    return await invoke("continue_activity", {
      index,
      description,
      project,
      time,
    });
  },

  getCurrentActivity: async (): Promise<CommandResult> => {
    return await invoke("get_current_activity");
  },

  getRecentActivities: async (number?: number): Promise<CommandResult> => {
    return await invoke("get_recent_activities", { number });
  },

  getReport: async (
    dateType: string,
    date?: string
  ): Promise<CommandResult> => {
    return await invoke("get_report", { dateType, date });
  },

  checkTockInstalled: async (): Promise<CommandResult> => {
    return await invoke("check_tock_installed");
  },

  autoInstallTock: async (): Promise<CommandResult> => {
    return await invoke("auto_install_tock");
  },

  getActivitiesForDate: async (date: string): Promise<CommandResult> => {
    return await invoke("get_activities_for_date", { date });
  },

  getActivitiesForMonth: async (year: number, month: number): Promise<CommandResult> => {
    return await invoke("get_activities_for_month", { year, month });
  },

  saveReportToFile: async (
    dateType: string,
    date?: string,
    startDate?: string,
    endDate?: string,
    customPath?: string
  ): Promise<CommandResult> => {
    return await invoke("save_report_to_file", { dateType, date, startDate, endDate, customPath });
  },

  // Favorites
  addFavorite: async (name: string, description: string): Promise<CommandResult> => {
    return await invoke("add_favorite", { name, description });
  },

  removeFavorite: async (name: string, description: string): Promise<CommandResult> => {
    return await invoke("remove_favorite", { name, description });
  },

  isFavorite: async (name: string, description: string): Promise<CommandResult> => {
    return await invoke("is_favorite", { name, description });
  },

  getAllFavorites: async (): Promise<CommandResult> => {
    return await invoke("get_all_favorites");
  },

  // API Routes
  addApiRoute: async (name: string, url: string): Promise<CommandResult> => {
    return await invoke("add_api_route", { name, url });
  },

  updateApiRoute: async (id: number, name: string, url: string, enabled: boolean): Promise<CommandResult> => {
    return await invoke("update_api_route", { id, name, url, enabled });
  },

  deleteApiRoute: async (id: number): Promise<CommandResult> => {
    return await invoke("delete_api_route", { id });
  },

  getAllApiRoutes: async (): Promise<CommandResult> => {
    return await invoke("get_all_api_routes");
  },

  fetchProjectsFromApi: async (url: string): Promise<CommandResult> => {
    return await invoke("fetch_projects_from_api", { url });
  },
  
  // Report API Routes (separate from regular API routes)
  addReportApiRoute: async (name: string, url: string): Promise<CommandResult> => {
    return await invoke("add_report_api_route", { name, url });
  },

  updateReportApiRoute: async (id: number, name: string, url: string, enabled: boolean): Promise<CommandResult> => {
    return await invoke("update_report_api_route", { id, name, url, enabled });
  },

  deleteReportApiRoute: async (id: number): Promise<CommandResult> => {
    return await invoke("delete_report_api_route", { id });
  },

  getAllReportApiRoutes: async (): Promise<CommandResult> => {
    return await invoke("get_all_report_api_routes");
  },
  
  // Report Settings
  getReportSettings: async (): Promise<CommandResult> => {
    return await invoke("get_report_settings");
  },
  
  updateReportSettings: async (autoSendEnabled: boolean, selectedApiRouteId?: number): Promise<CommandResult> => {
    return await invoke("update_report_settings", { 
      autoSendEnabled, 
      selectedApiRouteId: selectedApiRouteId ?? null 
    });
  },
  
  sendMonthlyReportToApi: async (apiRouteId: number): Promise<CommandResult> => {
    return await invoke("send_monthly_report_to_api", { apiRouteId });
  },
  
  checkAndSendAutoReport: async (): Promise<CommandResult> => {
    return await invoke("check_and_send_auto_report");
  },
  
  // Calendar Cache
  getCalendarCache: async (yearMonth: string): Promise<CommandResult> => {
    return await invoke("get_calendar_cache", { yearMonth });
  },
  
  saveCalendarCache: async (yearMonth: string, data: string): Promise<CommandResult> => {
    return await invoke("save_calendar_cache", { yearMonth, data });
  },
  
  clearCalendarCache: async (yearMonth: string): Promise<CommandResult> => {
    return await invoke("clear_calendar_cache", { yearMonth });
  },
  
  // Cached Projects
  getCachedProjects: async (apiRouteId?: number): Promise<CommandResult> => {
    return await invoke("get_cached_projects", { apiRouteId: apiRouteId ?? null });
  },
  
  syncApiProjects: async (apiRouteId: number): Promise<CommandResult> => {
    return await invoke("sync_api_projects", { apiRouteId });
  },
  
  syncAllApiProjects: async (): Promise<CommandResult> => {
    return await invoke("sync_all_api_projects");
  },
  
  deleteCachedProjectsByApi: async (apiRouteId: number): Promise<CommandResult> => {
    return await invoke("delete_cached_projects_by_api", { apiRouteId });
  },
  
  // User Preferences
  getUserPreference: async (key: string): Promise<CommandResult> => {
    return await invoke("get_user_preference", { key });
  },
  
  setUserPreference: async (key: string, value: string): Promise<CommandResult> => {
    return await invoke("set_user_preference", { key, value });
  },
};
