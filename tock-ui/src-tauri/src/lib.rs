use std::process::Command;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;
use std::sync::Mutex;
use std::collections::HashMap;
use std::time::{Duration, Instant};
use chrono::{NaiveDate, Datelike};

mod db;
use db::{Database, FavoriteProject, ApiRoute, ReportSettings};

static DB: OnceLock<Database> = OnceLock::new();

fn get_db() -> &'static Database {
    DB.get_or_init(|| {
        Database::new().expect("Failed to initialize database")
    })
}

// Cache for command results
struct CacheEntry {
    result: CommandResult,
    timestamp: Instant,
}

struct CommandCache {
    entries: Mutex<HashMap<String, CacheEntry>>,
    ttl: Duration,
}

impl CommandCache {
    fn new(ttl_seconds: u64) -> Self {
        Self {
            entries: Mutex::new(HashMap::new()),
            ttl: Duration::from_secs(ttl_seconds),
        }
    }

    fn get(&self, key: &str) -> Option<CommandResult> {
        let mut entries = match self.entries.lock() {
            Ok(guard) => guard,
            Err(poisoned) => {
                // If the mutex is poisoned, recover the data and continue
                // This is safe because we're just reading cached data
                poisoned.into_inner()
            }
        };
        if let Some(entry) = entries.get(key) {
            if entry.timestamp.elapsed() < self.ttl {
                return Some(CommandResult {
                    success: entry.result.success,
                    output: entry.result.output.clone(),
                    error: entry.result.error.clone(),
                });
            } else {
                entries.remove(key);
            }
        }
        None
    }

    fn set(&self, key: String, result: CommandResult) {
        let mut entries = match self.entries.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };
        entries.insert(key, CacheEntry {
            result,
            timestamp: Instant::now(),
        });
    }

    fn invalidate(&self) {
        let mut entries = match self.entries.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };
        entries.clear();
    }

    fn invalidate_pattern(&self, pattern: &str) {
        let mut entries = match self.entries.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };
        entries.retain(|key, _| !key.contains(pattern));
    }
}

static CACHE: OnceLock<CommandCache> = OnceLock::new();

fn get_cache() -> &'static CommandCache {
    CACHE.get_or_init(|| {
        // Cache for 60 seconds by default
        CommandCache::new(60)
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Activity {
    pub project: String,
    pub description: String,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub duration: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
}

// Execute tock command with arguments
fn execute_tock_command(args: Vec<&str>) -> CommandResult {
    let output = Command::new("tock")
        .args(&args)
        .output();

    match output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            
            CommandResult {
                success: output.status.success(),
                output: stdout,
                error: if stderr.is_empty() { None } else { Some(stderr) },
            }
        }
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to execute tock command: {}. Make sure tock is installed and in your PATH.", e)),
        },
    }
}

// Execute tock command with caching for read operations
fn execute_tock_command_cached(args: Vec<&str>, use_cache: bool) -> CommandResult {
    if use_cache {
        let cache_key = args.join(" ");
        if let Some(cached_result) = get_cache().get(&cache_key) {
            return cached_result;
        }
        
        let result = execute_tock_command(args.clone());
        if result.success {
            get_cache().set(cache_key, CommandResult {
                success: result.success,
                output: result.output.clone(),
                error: result.error.clone(),
            });
        }
        result
    } else {
        execute_tock_command(args)
    }
}

#[tauri::command]
fn start_activity(project: String, description: String, time: Option<String>) -> CommandResult {
    let mut args = vec!["start", "-p", &project, "-d", &description];
    
    if let Some(t) = &time {
        args.push("-t");
        args.push(t);
    }
    
    let result = execute_tock_command(args);
    
    // Invalidate cache on successful write operation
    if result.success {
        get_cache().invalidate();
    }
    
    result
}

#[tauri::command]
fn stop_activity(time: Option<String>) -> CommandResult {
    let mut args = vec!["stop"];
    
    if let Some(t) = &time {
        args.push("-t");
        args.push(t);
    }
    
    let result = execute_tock_command(args);
    
    // Invalidate cache on successful write operation
    if result.success {
        get_cache().invalidate();
    }
    
    result
}

#[tauri::command]
fn add_activity(project: String, description: String, start: String, end: Option<String>, duration: Option<String>) -> CommandResult {
    let mut args = vec!["add", "-p", &project, "-d", &description, "-s", &start];
    
    if let Some(e) = &end {
        args.push("-e");
        args.push(e);
    } else if let Some(dur) = &duration {
        args.push("--duration");
        args.push(dur);
    }
    
    let result = execute_tock_command(args);
    
    // Invalidate cache on successful write operation
    if result.success {
        get_cache().invalidate();
    }
    
    result
}

#[tauri::command]
fn continue_activity(index: Option<u32>, description: Option<String>, project: Option<String>, time: Option<String>) -> CommandResult {
    let mut args = vec!["continue"];
    let idx_str: String;
    
    if let Some(idx) = index {
        idx_str = idx.to_string();
        args.push(&idx_str);
    }
    
    if let Some(d) = &description {
        args.push("-d");
        args.push(d);
    }
    
    if let Some(p) = &project {
        args.push("-p");
        args.push(p);
    }
    
    if let Some(t) = &time {
        args.push("-t");
        args.push(t);
    }
    
    let result = execute_tock_command(args);
    
    // Invalidate cache on successful write operation
    if result.success {
        get_cache().invalidate();
    }
    
    result
}

#[tauri::command]
fn get_current_activity() -> CommandResult {
    execute_tock_command_cached(vec!["current"], true)
}

#[tauri::command]
fn get_recent_activities(number: Option<u32>) -> CommandResult {
    let mut args = vec!["last"];
    let n_str: String;
    
    if let Some(n) = number {
        n_str = n.to_string();
        args.push("-n");
        args.push(&n_str);
    }
    
    execute_tock_command_cached(args, true)
}

#[tauri::command]
fn get_report(date_type: String, date: Option<String>) -> CommandResult {
    let mut args = vec!["report"];
    
    match date_type.as_str() {
        "today" => args.push("--today"),
        "yesterday" => args.push("--yesterday"),
        "date" => {
            if let Some(d) = &date {
                args.push("--date");
                args.push(d);
            }
        }
        _ => {}
    }
    
    execute_tock_command_cached(args, true)
}

#[tauri::command]
fn check_tock_installed() -> CommandResult {
    let output = Command::new("tock")
        .arg("--version")
        .output();

    match output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            CommandResult {
                success: output.status.success(),
                output: stdout,
                error: None,
            }
        }
        Err(_) => CommandResult {
            success: false,
            output: String::new(),
            error: Some("Tock CLI is not installed or not in PATH. Please install tock first.".to_string()),
        },
    }
}

#[tauri::command]
fn get_activities_for_date(date: String) -> CommandResult {
    // Get report for specific date with caching
    execute_tock_command_cached(vec!["report", "--date", &date], true)
}

#[tauri::command]
fn get_activities_for_month(year: u32, month: u32) -> CommandResult {
    // Validate input parameters
    if year < 1900 || year > 3000 {
        return CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Invalid year: {}. Year must be between 1900 and 3000.", year)),
        };
    }
    
    if month < 1 || month > 12 {
        return CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Invalid month: {}. Month must be between 1 and 12.", month)),
        };
    }
    
    // Calculate the start and end dates of the month
    let first_day = match NaiveDate::from_ymd_opt(year as i32, month, 1) {
        Some(date) => date,
        None => {
            return CommandResult {
                success: false,
                output: String::new(),
                error: Some(format!("Invalid year ({}) or month ({})", year, month)),
            };
        }
    };
    
    // Calculate last day of month by finding the first day of next month and subtracting one day
    let (next_year, next_month) = if month == 12 {
        (year + 1, 1)
    } else {
        (year, month + 1)
    };
    
    let last_day = match NaiveDate::from_ymd_opt(next_year as i32, next_month, 1) {
        Some(next_month_start) => match next_month_start.pred_opt() {
            Some(d) => d,
            None => {
                return CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some("Failed to calculate last day of month".to_string()),
                };
            }
        },
        None => {
            return CommandResult {
                success: false,
                output: String::new(),
                error: Some(format!("Failed to calculate next month date for {}-{}", next_year, next_month)),
            };
        }
    };
    
    // Use caching for month reports
    let cache_key = format!("month_report_{}_{}", year, month);
    if let Some(cached_result) = get_cache().get(&cache_key) {
        return cached_result;
    }
    
    // Fetch all activities for each day in the month and aggregate
    let mut all_outputs = Vec::new();
    let mut current_date = first_day;
    
    while current_date <= last_day {
        let date_str = current_date.format("%Y-%m-%d").to_string();
        let result = execute_tock_command_cached(vec!["report", "--date", &date_str], true);
        
        if result.success && !result.output.trim().is_empty() {
            // Add date header and the output
            all_outputs.push(format!("=== {} ===\n{}", date_str, result.output));
        }
        
        // Move to next day, break if we can't (edge case at max date)
        current_date = match current_date.succ_opt() {
            Some(date) => date,
            None => {
                // Log warning but don't fail - we've processed up to this point
                // Use println since this is a backend warning and Tauri captures stdout
                println!("Warning: Could not increment date beyond {}. This may indicate we've reached the maximum date value.", current_date);
                break;
            }
        };
    }
    
    let combined_output = if all_outputs.is_empty() {
        String::new()
    } else {
        all_outputs.join("\n\n")
    };
    
    let result = CommandResult {
        success: true,
        output: combined_output,
        error: None,
    };
    
    // Cache the result
    get_cache().set(cache_key, CommandResult {
        success: result.success,
        output: result.output.clone(),
        error: result.error.clone(),
    });
    
    result
}

#[tauri::command]
fn save_report_to_file(
    date_type: String,
    date: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
    custom_path: Option<String>,
) -> CommandResult {
    // Generate report output
    let mut args = vec!["report"];
    
    let report_result = match date_type.as_str() {
        "today" => {
            args.push("--today");
            execute_tock_command(args)
        }
        "yesterday" => {
            args.push("--yesterday");
            execute_tock_command(args)
        }
        "date" => {
            if let Some(d) = &date {
                args.push("--date");
                args.push(d);
                execute_tock_command(args)
            } else {
                return CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some("Date is required for date type report".to_string()),
                };
            }
        }
        "range" => {
            // For range, we'll generate multiple reports
            // Note: Current implementation uses start date only
            // Full range reporting would require iterating through dates
            // and aggregating results, which is not implemented yet
            if start_date.is_none() || end_date.is_none() {
                return CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some("Start and end dates are required for range report".to_string()),
                };
            }
            // For simplicity, just use start date
            args.push("--date");
            args.push(start_date.as_ref().unwrap());
            execute_tock_command(args)
        }
        _ => {
            return CommandResult {
                success: false,
                output: String::new(),
                error: Some("Invalid date type".to_string()),
            };
        }
    };

    if !report_result.success {
        return report_result;
    }

    // Generate filename
    let filename = match date_type.as_str() {
        "today" => {
            let now = chrono::Local::now();
            format!("{}_tock.txt", now.format("%Y-%m-%d"))
        }
        "yesterday" => {
            let yesterday = chrono::Local::now() - chrono::Duration::days(1);
            format!("{}_tock.txt", yesterday.format("%Y-%m-%d"))
        }
        "date" => {
            if let Some(d) = &date {
                format!("{}_tock.txt", d)
            } else {
                "report_tock.txt".to_string()
            }
        }
        "range" => {
            if let (Some(start), Some(end)) = (&start_date, &end_date) {
                format!("{}_{}_tock.txt", start, end)
            } else {
                "range_tock.txt".to_string()
            }
        }
        _ => "report_tock.txt".to_string(),
    };

    // Determine save directory
    let save_dir = if let Some(path) = custom_path {
        PathBuf::from(path)
    } else {
        // Default to home directory
        match std::env::var("HOME").or_else(|_| std::env::var("USERPROFILE")) {
            Ok(dir) => PathBuf::from(dir),
            Err(_) => PathBuf::from("."),
        }
    };
    
    let filepath = save_dir.join(&filename);
    
    match File::create(&filepath) {
        Ok(mut file) => {
            if let Err(e) = file.write_all(report_result.output.as_bytes()) {
                CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("Failed to write to file: {}", e)),
                }
            } else {
                CommandResult {
                    success: true,
                    output: format!("Report saved to: {}", filepath.display()),
                    error: None,
                }
            }
        }
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to create file: {}", e)),
        },
    }
}

// Favorites commands
#[tauri::command]
fn add_favorite(name: String, description: String) -> CommandResult {
    match get_db().add_favorite(&name, &description) {
        Ok(_) => CommandResult {
            success: true,
            output: "Added to favorites".to_string(),
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to add favorite: {}", e)),
        },
    }
}

#[tauri::command]
fn remove_favorite(name: String, description: String) -> CommandResult {
    match get_db().remove_favorite(&name, &description) {
        Ok(_) => CommandResult {
            success: true,
            output: "Removed from favorites".to_string(),
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to remove favorite: {}", e)),
        },
    }
}

#[tauri::command]
fn is_favorite(name: String, description: String) -> CommandResult {
    match get_db().is_favorite(&name, &description) {
        Ok(is_fav) => CommandResult {
            success: true,
            output: if is_fav { "true" } else { "false" }.to_string(),
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: "false".to_string(),
            error: Some(format!("Failed to check favorite: {}", e)),
        },
    }
}

#[tauri::command]
fn get_all_favorites() -> CommandResult {
    match get_db().get_all_favorites() {
        Ok(favorites) => {
            match serde_json::to_string(&favorites) {
                Ok(json) => CommandResult {
                    success: true,
                    output: json,
                    error: None,
                },
                Err(e) => CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("Failed to serialize favorites: {}", e)),
                },
            }
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to get favorites: {}", e)),
        },
    }
}

// API Routes commands
#[tauri::command]
fn add_api_route(name: String, url: String) -> CommandResult {
    match get_db().add_api_route(&name, &url) {
        Ok(_) => CommandResult {
            success: true,
            output: "API route added".to_string(),
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to add API route: {}", e)),
        },
    }
}

#[tauri::command]
fn update_api_route(id: i64, name: String, url: String, enabled: bool) -> CommandResult {
    match get_db().update_api_route(id, &name, &url, enabled) {
        Ok(_) => CommandResult {
            success: true,
            output: "API route updated".to_string(),
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to update API route: {}", e)),
        },
    }
}

#[tauri::command]
fn delete_api_route(id: i64) -> CommandResult {
    match get_db().delete_api_route(id) {
        Ok(_) => CommandResult {
            success: true,
            output: "API route deleted".to_string(),
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to delete API route: {}", e)),
        },
    }
}

#[tauri::command]
fn get_all_api_routes() -> CommandResult {
    match get_db().get_all_api_routes() {
        Ok(routes) => {
            match serde_json::to_string(&routes) {
                Ok(json) => CommandResult {
                    success: true,
                    output: json,
                    error: None,
                },
                Err(e) => CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("Failed to serialize API routes: {}", e)),
                },
            }
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to get API routes: {}", e)),
        },
    }
}

// Fetch projects from API route
#[tauri::command]
async fn fetch_projects_from_api(url: String) -> CommandResult {
    // Basic URL validation
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return CommandResult {
            success: false,
            output: String::new(),
            error: Some("Invalid URL: must start with http:// or https://".to_string()),
        };
    }
    
    // Create client with timeout and size limits
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build() {
            Ok(c) => c,
            Err(e) => return CommandResult {
                success: false,
                output: String::new(),
                error: Some(format!("Failed to create HTTP client: {}", e)),
            },
        };
    
    match client.get(&url).send().await {
        Ok(response) => {
            // Check response size to prevent memory exhaustion
            if let Some(content_length) = response.content_length() {
                if content_length > 10_000_000 { // 10MB limit
                    return CommandResult {
                        success: false,
                        output: String::new(),
                        error: Some("Response too large (max 10MB)".to_string()),
                    };
                }
            }
            
            match response.text().await {
                Ok(text) => {
                    // Additional size check after reading
                    if text.len() > 10_000_000 {
                        return CommandResult {
                            success: false,
                            output: String::new(),
                            error: Some("Response too large (max 10MB)".to_string()),
                        };
                    }
                    CommandResult {
                        success: true,
                        output: text,
                        error: None,
                    }
                },
                Err(e) => CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("Failed to read response: {}", e)),
                },
            }
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to fetch from API: {}", e)),
        },
    }
}

// Report Settings commands
#[tauri::command]
fn get_report_settings() -> CommandResult {
    match get_db().get_report_settings() {
        Ok(settings) => {
            match serde_json::to_string(&settings) {
                Ok(json) => CommandResult {
                    success: true,
                    output: json,
                    error: None,
                },
                Err(e) => CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("Failed to serialize report settings: {}", e)),
                },
            }
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to get report settings: {}", e)),
        },
    }
}

#[tauri::command]
fn update_report_settings(auto_send_enabled: bool, selected_api_route_id: Option<i64>) -> CommandResult {
    match get_db().update_report_settings(auto_send_enabled, selected_api_route_id) {
        Ok(_) => CommandResult {
            success: true,
            output: "Report settings updated".to_string(),
            error: None,
        },
        Err(e) => CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to update report settings: {}", e)),
        },
    }
}

#[tauri::command]
async fn send_monthly_report_to_api(api_route_id: i64) -> CommandResult {
    // Get the API route
    let routes = match get_db().get_all_api_routes() {
        Ok(r) => r,
        Err(e) => return CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to get API routes: {}", e)),
        },
    };
    
    let api_route = match routes.iter().find(|r| r.id == Some(api_route_id)) {
        Some(route) => route,
        None => return CommandResult {
            success: false,
            output: String::new(),
            error: Some("API route not found".to_string()),
        },
    };
    
    // Get current month's report
    let now = chrono::Local::now();
    let year = now.year() as u32;
    let month = now.month();
    
    let report_result = get_activities_for_month(year, month);
    
    if !report_result.success {
        return CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("Failed to generate monthly report: {}", report_result.error.unwrap_or_default())),
        };
    }
    
    // Prepare JSON payload
    let payload = serde_json::json!({
        "year": year,
        "month": month,
        "report": report_result.output,
        "generated_at": chrono::Local::now().to_rfc3339(),
    });
    
    // Send to API
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build() {
            Ok(c) => c,
            Err(e) => return CommandResult {
                success: false,
                output: String::new(),
                error: Some(format!("Failed to create HTTP client: {}", e)),
            },
        };
    
    match client.post(&api_route.url)
        .json(&payload)
        .send()
        .await {
            Ok(response) => {
                let status = response.status();
                if status.is_success() {
                    CommandResult {
                        success: true,
                        output: format!("Monthly report sent successfully to {}", api_route.name),
                        error: None,
                    }
                } else {
                    CommandResult {
                        success: false,
                        output: String::new(),
                        error: Some(format!("API returned status: {}", status)),
                    }
                }
            },
            Err(e) => CommandResult {
                success: false,
                output: String::new(),
                error: Some(format!("Failed to send report to API: {}", e)),
            },
        }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            start_activity,
            stop_activity,
            add_activity,
            continue_activity,
            get_current_activity,
            get_recent_activities,
            get_report,
            check_tock_installed,
            get_activities_for_date,
            get_activities_for_month,
            save_report_to_file,
            add_favorite,
            remove_favorite,
            is_favorite,
            get_all_favorites,
            add_api_route,
            update_api_route,
            delete_api_route,
            get_all_api_routes,
            fetch_projects_from_api,
            get_report_settings,
            update_report_settings,
            send_monthly_report_to_api
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
