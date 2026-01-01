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
}
