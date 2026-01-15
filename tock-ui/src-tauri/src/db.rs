use rusqlite::{Connection, params, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FavoriteProject {
    pub id: Option<i64>,
    pub name: String,
    pub description: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiRoute {
    pub id: Option<i64>,
    pub name: String,
    pub url: String,
    pub enabled: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReportSettings {
    pub id: Option<i64>,
    pub auto_send_enabled: bool,
    pub selected_api_route_id: Option<i64>,
    pub last_sent_at: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CachedProject {
    pub id: Option<i64>,
    pub name: String,
    pub description: String,
    pub source_api_route_id: Option<i64>,
    pub last_synced: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CalendarCache {
    pub id: Option<i64>,
    pub year_month: String, // Format: "YYYY-MM"
    pub data: String, // JSON string of calendar data
    pub cached_at: String,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new() -> SqlResult<Self> {
        let db_path = Self::get_db_path();
        
        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }
        
        let conn = Connection::open(db_path)?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        
        db.init_tables()?;
        Ok(db)
    }
    
    fn get_db_path() -> PathBuf {
        let mut path = dirs::data_local_dir()
            .or_else(|| dirs::home_dir())
            .unwrap_or_else(|| PathBuf::from("."));
        
        path.push("tock-ui");
        path.push("tock_ui.db");
        path
    }
    
    fn init_tables(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        
        // Create favorites table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS favorite_projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(name, description)
            )",
            [],
        )?;
        
        // Create API routes table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS api_routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                url TEXT NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL
            )",
            [],
        )?;
        
        // Create report API routes table (separate from api_routes)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS report_api_routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL
            )",
            [],
        )?;
        
        // Create report settings table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS report_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                auto_send_enabled INTEGER NOT NULL DEFAULT 0,
                selected_api_route_id INTEGER,
                last_sent_at TEXT,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(selected_api_route_id) REFERENCES report_api_routes(id) ON DELETE SET NULL
            )",
            [],
        )?;
        
        // Create cached projects table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS cached_projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                source_api_route_id INTEGER,
                last_synced TEXT NOT NULL,
                UNIQUE(name, description, source_api_route_id),
                FOREIGN KEY(source_api_route_id) REFERENCES api_routes(id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        // Create calendar cache table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS calendar_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                year_month TEXT NOT NULL UNIQUE,
                data TEXT NOT NULL,
                cached_at TEXT NOT NULL
            )",
            [],
        )?;
        
        // Create user preferences table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL UNIQUE,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;
        
        Ok(())
    }
    
    // Favorite Projects methods
    pub fn add_favorite(&self, name: &str, description: &str) -> SqlResult<i64> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Local::now().to_rfc3339();
        
        // Use INSERT OR IGNORE to preserve original created_at
        conn.execute(
            "INSERT OR IGNORE INTO favorite_projects (name, description, created_at) VALUES (?1, ?2, ?3)",
            params![name, description, now],
        )?;
        
        Ok(conn.last_insert_rowid())
    }
    
    pub fn remove_favorite(&self, name: &str, description: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM favorite_projects WHERE name = ?1 AND description = ?2",
            params![name, description],
        )?;
        Ok(())
    }
    
    pub fn is_favorite(&self, name: &str, description: &str) -> SqlResult<bool> {
        let conn = self.conn.lock().unwrap();
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM favorite_projects WHERE name = ?1 AND description = ?2",
            params![name, description],
            |row| row.get(0),
        )?;
        Ok(count > 0)
    }
    
    pub fn get_all_favorites(&self) -> SqlResult<Vec<FavoriteProject>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, created_at FROM favorite_projects ORDER BY created_at DESC"
        )?;
        
        let favorites = stmt.query_map([], |row| {
            Ok(FavoriteProject {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?
        .collect::<SqlResult<Vec<_>>>()?;
        
        Ok(favorites)
    }
    
    // API Routes methods
    pub fn add_api_route(&self, name: &str, url: &str) -> SqlResult<i64> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Local::now().to_rfc3339();
        
        conn.execute(
            "INSERT INTO api_routes (name, url, enabled, created_at) VALUES (?1, ?2, 1, ?3)",
            params![name, url, now],
        )?;
        
        Ok(conn.last_insert_rowid())
    }
    
    pub fn update_api_route(&self, id: i64, name: &str, url: &str, enabled: bool) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE api_routes SET name = ?1, url = ?2, enabled = ?3 WHERE id = ?4",
            params![name, url, enabled as i32, id],
        )?;
        Ok(())
    }
    
    pub fn delete_api_route(&self, id: i64) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM api_routes WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }
    
    pub fn get_all_api_routes(&self) -> SqlResult<Vec<ApiRoute>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, url, enabled, created_at FROM api_routes ORDER BY name"
        )?;
        
        let routes = stmt.query_map([], |row| {
            Ok(ApiRoute {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                url: row.get(2)?,
                enabled: row.get::<_, i32>(3)? != 0,
                created_at: row.get(4)?,
            })
        })?
        .collect::<SqlResult<Vec<_>>>()?;
        
        Ok(routes)
    }
    
    pub fn get_enabled_api_routes(&self) -> SqlResult<Vec<ApiRoute>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, url, enabled, created_at FROM api_routes WHERE enabled = 1 ORDER BY name"
        )?;
        
        let routes = stmt.query_map([], |row| {
            Ok(ApiRoute {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                url: row.get(2)?,
                enabled: row.get::<_, i32>(3)? != 0,
                created_at: row.get(4)?,
            })
        })?
        .collect::<SqlResult<Vec<_>>>()?;
        
        Ok(routes)
    }
    
    // Report API Routes methods (separate from regular API routes)
    pub fn add_report_api_route(&self, name: &str, url: &str) -> SqlResult<i64> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Local::now().to_rfc3339();
        
        conn.execute(
            "INSERT INTO report_api_routes (name, url, enabled, created_at) VALUES (?1, ?2, 1, ?3)",
            params![name, url, now],
        )?;
        
        Ok(conn.last_insert_rowid())
    }
    
    pub fn update_report_api_route(&self, id: i64, name: &str, url: &str, enabled: bool) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE report_api_routes SET name = ?1, url = ?2, enabled = ?3 WHERE id = ?4",
            params![name, url, enabled as i32, id],
        )?;
        Ok(())
    }
    
    pub fn delete_report_api_route(&self, id: i64) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM report_api_routes WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }
    
    pub fn get_all_report_api_routes(&self) -> SqlResult<Vec<ApiRoute>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, url, enabled, created_at FROM report_api_routes ORDER BY name"
        )?;
        
        let routes = stmt.query_map([], |row| {
            Ok(ApiRoute {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                url: row.get(2)?,
                enabled: row.get::<_, i32>(3)? != 0,
                created_at: row.get(4)?,
            })
        })?
        .collect::<SqlResult<Vec<_>>>()?;
        
        Ok(routes)
    }
    
    pub fn get_enabled_report_api_routes(&self) -> SqlResult<Vec<ApiRoute>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, url, enabled, created_at FROM report_api_routes WHERE enabled = 1 ORDER BY name"
        )?;
        
        let routes = stmt.query_map([], |row| {
            Ok(ApiRoute {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                url: row.get(2)?,
                enabled: row.get::<_, i32>(3)? != 0,
                created_at: row.get(4)?,
            })
        })?
        .collect::<SqlResult<Vec<_>>>()?;
        
        Ok(routes)
    }
    
    // Report Settings methods
    pub fn get_report_settings(&self) -> SqlResult<ReportSettings> {
        let conn = self.conn.lock().unwrap();
        
        // Try to get existing settings
        let result = conn.query_row(
            "SELECT id, auto_send_enabled, selected_api_route_id, last_sent_at, updated_at FROM report_settings LIMIT 1",
            [],
            |row| {
                Ok(ReportSettings {
                    id: Some(row.get(0)?),
                    auto_send_enabled: row.get::<_, i32>(1)? != 0,
                    selected_api_route_id: row.get(2)?,
                    last_sent_at: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            }
        );
        
        // If no settings exist, create default
        match result {
            Ok(settings) => Ok(settings),
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                let now = chrono::Local::now().to_rfc3339();
                conn.execute(
                    "INSERT INTO report_settings (auto_send_enabled, selected_api_route_id, last_sent_at, updated_at) VALUES (0, NULL, NULL, ?1)",
                    params![now],
                )?;
                Ok(ReportSettings {
                    id: Some(conn.last_insert_rowid()),
                    auto_send_enabled: false,
                    selected_api_route_id: None,
                    last_sent_at: None,
                    updated_at: now,
                })
            },
            Err(e) => Err(e),
        }
    }
    
    pub fn update_report_settings(&self, auto_send_enabled: bool, selected_api_route_id: Option<i64>) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Local::now().to_rfc3339();
        
        // Ensure settings exist
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM report_settings",
            [],
            |row| row.get(0),
        )?;
        
        if count == 0 {
            conn.execute(
                "INSERT INTO report_settings (auto_send_enabled, selected_api_route_id, last_sent_at, updated_at) VALUES (?1, ?2, NULL, ?3)",
                params![auto_send_enabled as i32, selected_api_route_id, now],
            )?;
        } else {
            conn.execute(
                "UPDATE report_settings SET auto_send_enabled = ?1, selected_api_route_id = ?2, updated_at = ?3",
                params![auto_send_enabled as i32, selected_api_route_id, now],
            )?;
        }
        
        Ok(())
    }
    
    pub fn update_last_sent_at(&self, last_sent_at: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Local::now().to_rfc3339();
        
        conn.execute(
            "UPDATE report_settings SET last_sent_at = ?1, updated_at = ?2",
            params![last_sent_at, now],
        )?;
        
        Ok(())
    }
    
    // Calendar Cache methods
    pub fn get_calendar_cache(&self, year_month: &str) -> SqlResult<Option<CalendarCache>> {
        let conn = self.conn.lock().unwrap();
        let result = conn.query_row(
            "SELECT id, year_month, data, cached_at FROM calendar_cache WHERE year_month = ?1",
            params![year_month],
            |row| {
                Ok(CalendarCache {
                    id: Some(row.get(0)?),
                    year_month: row.get(1)?,
                    data: row.get(2)?,
                    cached_at: row.get(3)?,
                })
            }
        );
        
        match result {
            Ok(cache) => Ok(Some(cache)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }
    
    pub fn save_calendar_cache(&self, year_month: &str, data: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Local::now().to_rfc3339();
        
        conn.execute(
            "INSERT OR REPLACE INTO calendar_cache (year_month, data, cached_at) VALUES (?1, ?2, ?3)",
            params![year_month, data, now],
        )?;
        
        Ok(())
    }
    
    pub fn clear_calendar_cache(&self, year_month: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM calendar_cache WHERE year_month = ?1",
            params![year_month],
        )?;
        Ok(())
    }
    
    pub fn get_cached_projects(&self, api_route_id: Option<i64>) -> SqlResult<Vec<CachedProject>> {
        let conn = self.conn.lock().unwrap();
        
        let mut stmt = if let Some(route_id) = api_route_id {
            conn.prepare(
                "SELECT id, name, description, source_api_route_id, last_synced 
                FROM cached_projects 
                WHERE source_api_route_id = ?1 
                ORDER BY name"
            )?
        } else {
            conn.prepare(
                "SELECT id, name, description, source_api_route_id, last_synced 
                FROM cached_projects 
                ORDER BY name"
            )?
        };
        
        // Use a boxed closure with dynamic dispatch
        let mapper: Box<dyn Fn(&rusqlite::Row) -> SqlResult<CachedProject>> = Box::new(|row| {
            Ok(CachedProject {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                description: row.get(2)?,
                source_api_route_id: row.get(3)?,
                last_synced: row.get(4)?,
            })
        });
        
        let projects = if let Some(route_id) = api_route_id {
            stmt.query_map(params![route_id], mapper)?
        } else {
            stmt.query_map([], mapper)?
        };
        
        projects.collect::<SqlResult<Vec<_>>>()
    }

    pub fn save_cached_projects(&self, projects: &[(String, String, i64)]) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Local::now().to_rfc3339();
        
        for (name, description, api_route_id) in projects {
            conn.execute(
                "INSERT OR REPLACE INTO cached_projects (name, description, source_api_route_id, last_synced) 
                 VALUES (?1, ?2, ?3, ?4)",
                params![name, description, api_route_id, now],
            )?;
        }
        
        Ok(())
    }
    
    pub fn delete_cached_projects_by_api(&self, api_route_id: i64) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM cached_projects WHERE source_api_route_id = ?1",
            params![api_route_id],
        )?;
        Ok(())
    }
    
    // User Preferences methods
    pub fn get_preference(&self, key: &str) -> SqlResult<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let result = conn.query_row(
            "SELECT value FROM user_preferences WHERE key = ?1",
            params![key],
            |row| row.get(0),
        );
        
        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }
    
    pub fn set_preference(&self, key: &str, value: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Local::now().to_rfc3339();
        
        conn.execute(
            "INSERT OR REPLACE INTO user_preferences (key, value, updated_at) VALUES (?1, ?2, ?3)",
            params![key, value, now],
        )?;
        
        Ok(())
    }
}
