// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::{engine::general_purpose::STANDARD, Engine};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

mod wallpaper_engine;
use wallpaper_engine::RenderOptions;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: Option<i64>,
    pub text: String,
    pub important: bool,
    pub urgent: bool,
    pub completed: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WallpaperSettings {
    pub base_image_path: Option<String>,
    pub show_tasks: bool,
    pub opacity: f32,
    pub blur_amount: i32,
}

fn get_wallpaper_dir() -> PathBuf {
    let app_data = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("CJWproductivity")
        .join("wallpapers");
    fs::create_dir_all(&app_data).ok();
    app_data
}

#[tauri::command]
async fn update_wallpaper(image_data: String) -> Result<String, String> {
    let image_bytes = STANDARD
        .decode(&image_data)
        .map_err(|e| format!("Failed to decode image: {}", e))?;
    let wallpaper_path = get_wallpaper_dir().join("cjw_wallpaper.png");
    fs::write(&wallpaper_path, &image_bytes)
        .map_err(|e| format!("Failed to save wallpaper: {}", e))?;
    wallpaper::set_from_path(wallpaper_path.to_str().unwrap())
        .map_err(|e| format!("Failed to set wallpaper: {}", e))?;
    Ok(wallpaper_path.to_string_lossy().to_string())
}

#[tauri::command]
async fn get_current_wallpaper() -> Result<String, String> {
    wallpaper::get().map_err(|e| format!("Failed to get wallpaper: {}", e))
}

#[tauri::command]
async fn save_base_image(image_data: String, filename: String) -> Result<String, String> {
    let image_bytes = STANDARD
        .decode(&image_data)
        .map_err(|e| format!("Failed to decode image: {}", e))?;
    let image_path = get_wallpaper_dir().join(&filename);
    fs::write(&image_path, &image_bytes)
        .map_err(|e| format!("Failed to save image: {}", e))?;
    Ok(image_path.to_string_lossy().to_string())
}

#[tauri::command]
async fn read_image_as_base64(path: String) -> Result<String, String> {
    let image_bytes = fs::read(&path)
        .map_err(|e| format!("Failed to read image: {}", e))?;
    Ok(STANDARD.encode(&image_bytes))
}

#[tauri::command]
async fn show_spotlight(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("spotlight") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn hide_spotlight(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("spotlight") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn toggle_spotlight(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("spotlight") {
        if window.is_visible().unwrap_or(false) {
            window.hide().map_err(|e| e.to_string())?;
        } else {
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

// ============ Splash Window Commands ============

/// 显示主窗口
#[tauri::command]
async fn show_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// 显示主窗口并关闭 splash 窗口
#[tauri::command]
async fn show_main_and_close_splash(app: AppHandle) -> Result<(), String> {
    // 1. 显示主窗口
    if let Some(main_window) = app.get_webview_window("main") {
        main_window.show().map_err(|e| e.to_string())?;
        main_window.set_focus().map_err(|e| e.to_string())?;
    }
    
    // 2. 关闭 splash 窗口
    if let Some(splash_window) = app.get_webview_window("splash") {
        splash_window.close().map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

/// 关闭 splash 窗口
#[tauri::command]
async fn close_splash(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("splash") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// 重启应用
#[tauri::command]
async fn restart_app(app: AppHandle) -> Result<(), String> {
    app.restart();
    #[allow(unreachable_code)]
    Ok(())
}

/// 显示 splash 窗口（内容加载完成后调用）
#[tauri::command]
async fn show_splash(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("splash") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn get_app_data_dir() -> String {
    get_wallpaper_dir()
        .parent()
        .unwrap_or(&get_wallpaper_dir())
        .to_string_lossy()
        .to_string()
}

#[tauri::command]
async fn render_wallpaper_native(
    background_path: String,
    options: RenderOptions,
) -> Result<String, String> {
    let png_data = wallpaper_engine::render_wallpaper(&background_path, &options)?;
    let wallpaper_path = get_wallpaper_dir().join("cjw_wallpaper.png");
    fs::write(&wallpaper_path, &png_data)
        .map_err(|e| format!("Failed to save wallpaper: {}", e))?;
    wallpaper::set_from_path(wallpaper_path.to_str().unwrap())
        .map_err(|e| format!("Failed to set wallpaper: {}", e))?;
    Ok(wallpaper_path.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 当尝试启动第二个实例时，聚焦到已存在的主窗口
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .invoke_handler(tauri::generate_handler![
            update_wallpaper,
            get_current_wallpaper,
            save_base_image,
            read_image_as_base64,
            show_spotlight,
            hide_spotlight,
            toggle_spotlight,
            show_main_window,
            show_main_and_close_splash,
            close_splash,
            restart_app,
            show_splash,
            get_app_data_dir,
            render_wallpaper_native,
        ])
        .setup(|app| {
            let _spotlight = app.get_webview_window("spotlight");
            Ok(())
        })
        .on_window_event(|window, event| {
            // 当主窗口关闭时，退出整个程序
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { .. } = event {
                    // 退出程序
                    std::process::exit(0);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
