use tauri::{Manager, Emitter};
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};
use tauri::image::Image;
use std::thread;
use std::time::Duration;
use std::sync::{Arc, Mutex};
use std::io::Cursor;
use std::fs;
use std::path::PathBuf;
use std::io::Write;
use enigo::{Enigo, Key, Keyboard, Settings};
use base64::{Engine as _, engine::general_purpose};
use serde_json::Value;
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

#[cfg(target_os = "windows")]
use window_vibrancy::apply_blur;

// Locale JSON files loaded at compile time
const LOCALE_EN: &str = include_str!("../../lib/locales/en.json");
const LOCALE_DE: &str = include_str!("../../lib/locales/de.json");
const LOCALE_FR: &str = include_str!("../../lib/locales/fr.json");
const LOCALE_TR: &str = include_str!("../../lib/locales/tr.json");

// Application state for settings
struct AppState {
    sound_enabled: Arc<Mutex<bool>>,
    shortcut_key: Arc<Mutex<String>>,
    shortcut_modifier: Arc<Mutex<String>>,
    auto_paste_enabled: Arc<Mutex<bool>>,
    current_model: Arc<Mutex<String>>,
    current_style: Arc<Mutex<String>>,
    locale: Arc<Mutex<String>>,
}

// Sound playback function (non-blocking)
fn play_sound(sound_type: &str, sound_enabled: bool) {
    if !sound_enabled {
        return;
    }

    let sound_bytes: &'static [u8] = match sound_type {
        "empty" => include_bytes!("../sounds/empty.wav"),
        "processing" => include_bytes!("../sounds/processing.wav"),
        "completed" => include_bytes!("../sounds/completed.wav"),
        _ => return,
    };

    let bytes = sound_bytes.to_vec();

    // Play sound in a separate thread to avoid blocking
    thread::spawn(move || {
        if let Err(e) = play_sound_blocking(&bytes) {
            eprintln!("Failed to play sound: {}", e);
        }
    });
}

fn play_sound_blocking(bytes: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
    use rodio::{Decoder, OutputStream, Sink};

    let (_stream, stream_handle) = OutputStream::try_default()?;
    let sink = Sink::try_new(&stream_handle)?;

    let cursor = Cursor::new(bytes.to_vec());
    let source = Decoder::new(cursor)?;

    sink.append(source);
    sink.sleep_until_end();

    Ok(())
}

// Tauri command to handle corrected text from frontend
#[tauri::command]
async fn handle_corrected_text(
    app: tauri::AppHandle,
    text: String,
    model: Option<String>,
    duration: Option<f64>,
    auto_paste: Option<bool>,
) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    use tauri_plugin_notification::NotificationExt;

    // Write corrected text to clipboard
    app.clipboard().write_text(text.clone())
        .map_err(|e| format!("Failed to write to clipboard: {}", e))?;

    // Add a small delay to ensure the processing notification is visible
    thread::sleep(Duration::from_millis(500));

    // Get settings state
    let state = app.state::<AppState>();
    let sound_enabled = *state.sound_enabled.lock().unwrap();
    let should_auto_paste = auto_paste.unwrap_or(false);
    let locale = state.locale.lock().unwrap().clone();

    // Build notification body with optional model and duration
    let mut body = get_translation(&locale, "notifications.corrected");
    if let Some(model_name) = model {
        let model_label = get_translation(&locale, "notifications.model");
        body.push_str(&format!("\n{}: {}", model_label, model_name));
    }
    if let Some(dur) = duration {
        let duration_label = get_translation(&locale, "notifications.duration");
        body.push_str(&format!("\n{}: {:.2}s", duration_label, dur / 1000.0));
    }

    // Show success notification and play sound
    let title = get_translation(&locale, "notifications.title");
    let _ = app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show();

    // Play completed sound
    play_sound("completed", sound_enabled);

    // If auto-paste is enabled, simulate paste using clipboard (Cmd+V/Ctrl+V)
    // Since text is already copied to clipboard, this is more reliable than typing
    if should_auto_paste {
        let _ = app.emit("auto-paste-debug", "Auto-paste enabled, checking permissions...");
        println!("[Auto-paste] Auto-paste enabled, checking permissions...");

        // Check macOS accessibility permissions before attempting auto-paste
        #[cfg(target_os = "macos")]
        {
            use std::process::Command;
            let output = Command::new("osascript")
                .arg("-e")
                .arg("tell application \"System Events\" to get name of first process")
                .output();

            let has_permission = match output {
                Ok(result) => result.status.success(),
                Err(e) => {
                    let error_msg = format!("Failed to check permissions: {:?}", e);
                    let _ = app.emit("auto-paste-debug", &error_msg);
                    eprintln!("[Auto-paste] {}", error_msg);
                    false
                }
            };

            if !has_permission {
                let _ = app.emit("auto-paste-debug", "Accessibility permission not granted");
                eprintln!("[Auto-paste] Accessibility permission not granted");
                let state = app.state::<AppState>();
                let locale = state.locale.lock().unwrap().clone();
                let title = get_translation(&locale, "notifications.permissionRequired");
                let body = get_translation(&locale, "notifications.permissionRequiredBody");
                let _ = app.notification()
                    .builder()
                    .title(&title)
                    .body(&body)
                    .show();
                return Ok(()); // Don't try to use enigo without permission
            }
            let _ = app.emit("auto-paste-debug", "Accessibility permission granted");
            println!("[Auto-paste] Accessibility permission granted");
        }

        // Clone app handle for use in thread
        let app_clone = app.clone();

        // Spawn a separate thread to avoid blocking
        thread::spawn(move || {
            use tauri_plugin_notification::NotificationExt;
            use std::panic;

            // Helper function to safely emit debug messages and write to file
            let emit_debug = |msg: &str| {
                println!("[Auto-paste] {}", msg);
                write_log_file(&app_clone, msg);
                let _ = app_clone.emit("auto-paste-debug", msg);
            };

            // Emit initial message
            emit_debug("Thread spawned, waiting before paste...");
            write_log_file(&app_clone, "CRITICAL: About to sleep for 1200ms");

            // Simple sleep without catch_unwind first to see if that's the issue
            thread::sleep(Duration::from_millis(1200));

            write_log_file(&app_clone, "CRITICAL: Sleep completed, still alive");
            emit_debug("Sleep completed, proceeding...");
            emit_debug("Attempting to create Enigo instance...");

            // Now wrap Enigo operations in catch_unwind
            write_log_file(&app_clone, "CRITICAL: About to enter catch_unwind");
            let result = panic::catch_unwind(panic::AssertUnwindSafe(|| {
                // Use AppleScript for paste on macOS - it's more reliable and doesn't crash
                #[cfg(target_os = "macos")]
                {
                    use std::process::Command;
                    emit_debug("Pasting via AppleScript...");
                    let applescript_result = Command::new("osascript")
                        .arg("-e")
                        .arg("tell application \"System Events\" to keystroke \"v\" using command down")
                        .output();

                    match applescript_result {
                        Ok(output) => {
                            if output.status.success() {
                                emit_debug("Auto-paste completed successfully");
                                let state = app_clone.state::<AppState>();
                                let locale = state.locale.lock().unwrap().clone();
                                let title = get_translation(&locale, "notifications.title");
                                let body = get_translation(&locale, "notifications.pastedSuccessfully");
                                let _ = app_clone.notification()
                                    .builder()
                                    .title(&title)
                                    .body(&body)
                                    .show();
                            } else {
                                let stderr = String::from_utf8_lossy(&output.stderr);
                                let error_msg = format!("AppleScript paste failed: {}", stderr);
                                emit_debug(&error_msg);
                                let state = app_clone.state::<AppState>();
                                let locale = state.locale.lock().unwrap().clone();
                                let title = get_translation(&locale, "notifications.autoPasteFailed");
                                let body = get_translation(&locale, "notifications.autoPasteFailedBody");
                                let _ = app_clone.notification()
                                    .builder()
                                    .title(&title)
                                    .body(&body)
                                    .show();
                            }
                        }
                        Err(e) => {
                            let error_msg = format!("AppleScript command failed: {:?}", e);
                            emit_debug(&error_msg);
                            let state = app_clone.state::<AppState>();
                            let locale = state.locale.lock().unwrap().clone();
                            let title = get_translation(&locale, "notifications.autoPasteFailed");
                            let body = get_translation(&locale, "notifications.autoPasteFailedBody");
                            let _ = app_clone.notification()
                                .builder()
                                .title(&title)
                                .body(&body)
                                .show();
                        }
                    }
                }

                #[cfg(not(target_os = "macos"))]
                {
                    // Create Enigo for non-macOS platforms
                    write_log_file(&app_clone, "CRITICAL: Inside catch_unwind, about to create Enigo");
                    let mut enigo = match Enigo::new(&Settings::default()) {
                        Ok(enigo) => {
                            write_log_file(&app_clone, "CRITICAL: Enigo created successfully");
                            enigo
                        },
                        Err(e) => {
                            let error_msg = format!("Failed to create Enigo instance: {:?}", e);
                            write_log_file(&app_clone, &format!("ERROR: {}", error_msg));
                            println!("[Auto-paste] {}", error_msg);
                            let _ = app_clone.emit("auto-paste-debug", &error_msg);
                            let state = app_clone.state::<AppState>();
                            let locale = state.locale.lock().unwrap().clone();
                            let title = get_translation(&locale, "notifications.autoPasteFailed");
                            let body = get_translation(&locale, "notifications.autoPasteFailedInit");
                            let _ = app_clone.notification()
                                .builder()
                                .title(&title)
                                .body(&body)
                                .show();
                            return;
                        }
                    };

                    // Use Enigo for non-macOS platforms
                    emit_debug("Pressing Ctrl key...");
                    match enigo.key(Key::Control, enigo::Direction::Press) {
                        Ok(_) => {
                            thread::sleep(Duration::from_millis(100));
                            emit_debug("Pressing 'v' key...");
                            match enigo.key(Key::Unicode('v'), enigo::Direction::Click) {
                                Ok(_) => {
                                    thread::sleep(Duration::from_millis(100));
                                    emit_debug("Releasing Ctrl key...");
                                    match enigo.key(Key::Control, enigo::Direction::Release) {
                                        Ok(_) => {
                                            emit_debug("Auto-paste completed successfully");
                                            let state = app_clone.state::<AppState>();
                                            let locale = state.locale.lock().unwrap().clone();
                                            let title = get_translation(&locale, "notifications.title");
                                            let body = get_translation(&locale, "notifications.pastedSuccessfully");
                                            let _ = app_clone.notification()
                                                .builder()
                                                .title(&title)
                                                .body(&body)
                                                .show();
                                        }
                                        Err(e) => {
                                            let error_msg = format!("Failed to release Control key: {:?}", e);
                                            emit_debug(&error_msg);
                                        }
                                    }
                                }
                                Err(e) => {
                                    let error_msg = format!("Failed to press 'v' key: {:?}", e);
                                    emit_debug(&error_msg);
                                    let _ = enigo.key(Key::Control, enigo::Direction::Release);
                                }
                            }
                        }
                        Err(e) => {
                            let error_msg = format!("Failed to press Control key: {:?}", e);
                            emit_debug(&error_msg);
                        }
                    }
                }
            }));

            // Handle panic result
            if let Err(panic_payload) = result {
                let error_msg = format!("Thread panicked: {:?}", panic_payload);
                eprintln!("[Auto-paste] {}", error_msg);
                // Try to emit and show notification, but don't panic if it fails
                let _ = std::panic::catch_unwind(panic::AssertUnwindSafe(|| {
                    let _ = app_clone.emit("auto-paste-debug", &error_msg);
                    let state = app_clone.state::<AppState>();
                    let locale = state.locale.lock().unwrap().clone();
                    let title = get_translation(&locale, "notifications.autoPasteFailed");
                    let body = get_translation(&locale, "notifications.autoPasteError");
                    let _ = app_clone.notification()
                        .builder()
                        .title(&title)
                        .body(&body)
                        .show();
                }));
            } else {
                emit_debug("Thread completed without panicking");
            }
        });
    }

    Ok(())
}

// Tauri command to update sound setting
#[tauri::command]
fn set_sound_enabled(enabled: bool, state: tauri::State<AppState>) -> Result<(), String> {
    let mut sound_enabled = state.sound_enabled.lock().unwrap();
    *sound_enabled = enabled;
    Ok(())
}

// Tauri command to get sound setting
#[tauri::command]
fn get_sound_enabled(state: tauri::State<AppState>) -> Result<bool, String> {
    let sound_enabled = state.sound_enabled.lock().unwrap();
    Ok(*sound_enabled)
}

// Helper function to convert modifier string to platform-specific format
// Tauri uses "Alt" for Option key on macOS, and "Alt" for Alt key on Windows/Linux
fn convert_modifier_to_platform(modifier: &str) -> String {
    #[cfg(target_os = "macos")]
    {
        modifier
            .replace("CmdOrCtrl", "Cmd")
            .replace("AltOrOption", "Alt")
    }
    #[cfg(not(target_os = "macos"))]
    {
        modifier
            .replace("CmdOrCtrl", "Ctrl")
            .replace("AltOrOption", "Alt")
    }
}

// Tauri command to update shortcut key and modifier
#[tauri::command]
fn update_shortcut(
    new_key: String,
    new_modifier: String,
    app: tauri::AppHandle,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

    // Get the current shortcut key and modifier
    let mut shortcut_key = state.shortcut_key.lock().unwrap();
    let mut shortcut_modifier = state.shortcut_modifier.lock().unwrap();

    // Convert modifiers to platform-specific format
    let old_modifier_platform = convert_modifier_to_platform(&*shortcut_modifier);
    let new_modifier_platform = convert_modifier_to_platform(&new_modifier);

    let old_shortcut_str = format!("{}+{}", old_modifier_platform, *shortcut_key);
    let new_shortcut_str = format!("{}+{}", new_modifier_platform, new_key);

    // Unregister old shortcut
    if let Ok(old_shortcut) = old_shortcut_str.parse::<Shortcut>() {
        let _ = app.global_shortcut().unregister(old_shortcut);
    }

    // Register new shortcut
    match new_shortcut_str.parse::<Shortcut>() {
        Ok(new_shortcut) => {
            match app.global_shortcut().register(new_shortcut) {
                Ok(_) => {
                    *shortcut_key = new_key.clone();
                    *shortcut_modifier = new_modifier.clone();
                    Ok(())
                }
                Err(e) => {
                    // If registration fails, re-register the old one
                    if let Ok(old_shortcut) = old_shortcut_str.parse::<Shortcut>() {
                        let _ = app.global_shortcut().register(old_shortcut);
                    }
                    Err(format!("Failed to register shortcut: {}", e))
                }
            }
        }
        Err(e) => Err(format!("Invalid shortcut format: {}", e))
    }
}

// Tauri command to get current shortcut key
#[tauri::command]
fn get_shortcut_key(state: tauri::State<AppState>) -> Result<String, String> {
    let shortcut_key = state.shortcut_key.lock().unwrap();
    Ok(shortcut_key.clone())
}

// Tauri command to get current shortcut modifier
#[tauri::command]
fn get_shortcut_modifier(state: tauri::State<AppState>) -> Result<String, String> {
    let shortcut_modifier = state.shortcut_modifier.lock().unwrap();
    Ok(shortcut_modifier.clone())
}

// Tauri command to play sound in app (respects sound_enabled setting)
#[tauri::command]
fn play_sound_in_app(sound_type: String, state: tauri::State<AppState>) -> Result<(), String> {
    let sound_enabled = *state.sound_enabled.lock().unwrap();
    play_sound(&sound_type, sound_enabled);
    Ok(())
}

// Tauri command to update auto-paste setting
#[tauri::command]
fn set_auto_paste_enabled(enabled: bool, state: tauri::State<AppState>) -> Result<(), String> {
    let mut auto_paste_enabled = state.auto_paste_enabled.lock().unwrap();
    *auto_paste_enabled = enabled;
    Ok(())
}

// Tauri command to get auto-paste setting
#[tauri::command]
fn get_auto_paste_enabled(state: tauri::State<AppState>) -> Result<bool, String> {
    let auto_paste_enabled = state.auto_paste_enabled.lock().unwrap();
    Ok(*auto_paste_enabled)
}

// Helper function to get locale JSON string
fn get_locale_json(locale: &str) -> &str {
    match locale {
        "de" => LOCALE_DE,
        "fr" => LOCALE_FR,
        "tr" => LOCALE_TR,
        _ => LOCALE_EN, // Default to English
    }
}

// Helper function to get translated string from locale JSON
fn get_translation(locale: &str, key: &str) -> String {
    let locale_json = get_locale_json(locale);
    match serde_json::from_str::<Value>(locale_json) {
        Ok(json) => {
            // Navigate through nested keys (e.g., "notifications.processing")
            let parts: Vec<&str> = key.split('.').collect();
            let mut current = &json;

            for part in parts {
                if let Some(obj) = current.as_object() {
                    if let Some(value) = obj.get(part) {
                        current = value;
                    } else {
                        // Fallback to English if key not found
                        return get_translation("en", key);
                    }
                } else {
                    return get_translation("en", key);
                }
            }

            if let Some(str_val) = current.as_str() {
                str_val.to_string()
            } else {
                get_translation("en", key)
            }
        }
        Err(_) => {
            // If parsing fails, try English
            if locale != "en" {
                get_translation("en", key)
            } else {
                key.to_string() // Last resort: return key itself
            }
        }
    }
}

// Helper function to convert style value to human-readable label (translated)
fn style_to_label(style: &str, locale: &str) -> String {
    let style_key = match style {
        "grammar" => "home.styleOptions.grammar.label",
        "formal" => "home.styleOptions.formal.label",
        "informal" => "home.styleOptions.informal.label",
        "collaborative" => "home.styleOptions.collaborative.label",
        "concise" => "home.styleOptions.concise.label",
        _ => "home.styleOptions.grammar.label",
    };
    get_translation(locale, style_key)
}

// Tauri command to update correction settings (model and style)
#[tauri::command]
fn set_correction_settings(
    model: Option<String>,
    style: Option<String>,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    if let Some(model_value) = model {
        let mut current_model = state.current_model.lock().unwrap();
        *current_model = model_value;
    }
    if let Some(style_value) = style {
        let mut current_style = state.current_style.lock().unwrap();
        *current_style = style_value;
    }
    Ok(())
}

// Tauri command to get current model
#[tauri::command]
fn get_current_model(state: tauri::State<AppState>) -> Result<String, String> {
    let current_model = state.current_model.lock().unwrap();
    Ok(current_model.clone())
}

// Tauri command to get current style
#[tauri::command]
fn get_current_style(state: tauri::State<AppState>) -> Result<String, String> {
    let current_style = state.current_style.lock().unwrap();
    Ok(current_style.clone())
}

// Tauri command to set locale
#[tauri::command]
fn set_locale(locale: String, state: tauri::State<AppState>) -> Result<(), String> {
    let mut current_locale = state.locale.lock().unwrap();
    // Validate locale
    if ["en", "de", "fr", "tr"].contains(&locale.as_str()) {
        *current_locale = locale;
        Ok(())
    } else {
        Err(format!("Invalid locale: {}", locale))
    }
}

// Tauri command to get current locale
#[tauri::command]
fn get_locale(state: tauri::State<AppState>) -> Result<String, String> {
    let current_locale = state.locale.lock().unwrap();
    Ok(current_locale.clone())
}

// Helper function to get storage file path
fn get_storage_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let keys_dir = app_data_dir.join(".keys");

    // Create the .keys directory if it doesn't exist
    fs::create_dir_all(&keys_dir)
        .map_err(|e| format!("Failed to create keys directory: {}", e))?;

    Ok(keys_dir)
}

// Helper function to write debug logs to file
fn write_log_file(app: &tauri::AppHandle, message: &str) {
    if let Ok(app_data_dir) = app.path().app_data_dir() {
        let log_file = app_data_dir.join("auto-paste-debug.log");
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs_f64())
            .unwrap_or(0.0);
        let log_line = format!("[{:.3}] {}\n", timestamp, message);

        // Try to append to log file, ignore errors - use sync write for immediate flush
        if let Ok(mut file) = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_file)
        {
            let _ = file.write_all(log_line.as_bytes());
            let _ = file.sync_all(); // Force write to disk immediately
        }
    }
}

// Secure storage commands using file-based storage
// Files are stored in app data directory with base64 encoding
#[tauri::command]
fn secure_storage_get(app: tauri::AppHandle, key: String) -> Result<String, String> {
    let storage_path = get_storage_path(&app)?;
    let key_file = storage_path.join(format!("{}.dat", key));

    if !key_file.exists() {
        return Err(format!("Key '{}' not found", key));
    }

    match fs::read_to_string(&key_file) {
        Ok(encoded) => {
            // Decode from base64
            match general_purpose::STANDARD.decode(&encoded) {
                Ok(decoded_bytes) => {
                    match String::from_utf8(decoded_bytes) {
                        Ok(value) => {
                            Ok(value)
                        },
                        Err(e) => Err(format!("Failed to decode value: {}", e))
                    }
                },
                Err(e) => Err(format!("Failed to decode base64: {}", e))
            }
        },
        Err(e) => Err(format!("Failed to read file: {}", e))
    }
}

#[tauri::command]
fn secure_storage_set(app: tauri::AppHandle, key: String, value: String) -> Result<(), String> {
    let storage_path = get_storage_path(&app)?;
    let key_file = storage_path.join(format!("{}.dat", key));

    // Encode to base64
    let encoded = general_purpose::STANDARD.encode(value.as_bytes());

    fs::write(&key_file, encoded)
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
fn secure_storage_remove(app: tauri::AppHandle, key: String) -> Result<(), String> {
    let storage_path = get_storage_path(&app)?;
    let key_file = storage_path.join(format!("{}.dat", key));

    if !key_file.exists() {
        return Ok(()); // Not an error if it doesn't exist
    }

    fs::remove_file(&key_file)
        .map_err(|e| format!("Failed to delete file: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize app state with default values
    let app_state = AppState {
        sound_enabled: Arc::new(Mutex::new(true)), // Default: sound enabled
        shortcut_key: Arc::new(Mutex::new("]".to_string())), // Default: closing bracket key
        shortcut_modifier: Arc::new(Mutex::new("CmdOrCtrl+Shift".to_string())), // Default: Cmd+Shift on Mac, Ctrl+Shift on Win/Linux
        auto_paste_enabled: Arc::new(Mutex::new(false)), // Default: auto-paste disabled
        current_model: Arc::new(Mutex::new("gpt-4o-mini".to_string())), // Default model
        current_style: Arc::new(Mutex::new("grammar".to_string())), // Default style
        locale: Arc::new(Mutex::new("en".to_string())), // Default locale: English
    };

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    use tauri_plugin_global_shortcut::ShortcutState;
                    use tauri_plugin_clipboard_manager::ClipboardExt;
                    use tauri_plugin_notification::NotificationExt;

                    if event.state == ShortcutState::Pressed {
                        // Get settings state
                        let state = app.state::<AppState>();
                        let sound_enabled = *state.sound_enabled.lock().unwrap();
                        let auto_paste_enabled = *state.auto_paste_enabled.lock().unwrap();

                        // If auto-paste is enabled, simulate Cmd+C/Ctrl+C to copy selected text
                        if auto_paste_enabled {

                            #[cfg(target_os = "macos")]
                            {
                                // Check if accessibility permissions are granted
                                use std::process::Command;
                                let output = Command::new("osascript")
                                    .arg("-e")
                                    .arg("tell application \"System Events\" to get name of first process")
                                    .output();

                                let has_permission = match output {
                                    Ok(result) => result.status.success(),
                                    Err(_) => false,
                                };

                                if !has_permission {
                                    // Show notification to user
                                    let state = app.state::<AppState>();
                                    let locale = state.locale.lock().unwrap().clone();
                                    let title = get_translation(&locale, "notifications.permissionRequired");
                                    let body = get_translation(&locale, "notifications.autoPastePermissionRequired");
                                    let _ = app.notification()
                                        .builder()
                                        .title(&title)
                                        .body(&body)
                                        .show();

                                    return; // Don't try to use enigo without permission
                                }
                            }

                            // Simulate copy shortcut
                            match Enigo::new(&Settings::default()) {
                                Ok(mut enigo) => {
                                    #[cfg(target_os = "macos")]
                                    {
                                        if enigo.key(Key::Meta, enigo::Direction::Press).is_err() {
                                            return;
                                        }
                                        let _ = enigo.key(Key::Unicode('c'), enigo::Direction::Click);
                                        let _ = enigo.key(Key::Meta, enigo::Direction::Release);
                                    }

                                    #[cfg(not(target_os = "macos"))]
                                    {
                                        let _ = enigo.key(Key::Control, enigo::Direction::Press);
                                        let _ = enigo.key(Key::Unicode('c'), enigo::Direction::Click);
                                        let _ = enigo.key(Key::Control, enigo::Direction::Release);
                                    }

                                    // Wait briefly for clipboard to populate
                                    thread::sleep(Duration::from_millis(100));
                                }
                                Err(_) => return,
                            }
                        }

                        // Read from clipboard
                        match app.clipboard().read_text() {
                            Ok(text) => {
                                if text.is_empty() {
                                    #[cfg(target_os = "macos")]
                                    let copy_instruction = "Please copy text first (Cmd+C), then use Cmd+Shift+]";

                                    #[cfg(not(target_os = "macos"))]
                                    let copy_instruction = "Please copy text first (Ctrl+C), then use Ctrl+Shift+]";

                                    let _ = app.notification()
                                        .builder()
                                        .title("Correctify")
                                        .body(copy_instruction)
                                        .show();

                                    // Play empty sound
                                    play_sound("empty", sound_enabled);
                                    return;
                                }

                                // Emit event to frontend with text to correct
                                let _ = app.emit("correct-clipboard-text", text.clone());

                                // Get current model and style from state
                                let current_model = state.current_model.lock().unwrap().clone();
                                let current_style = state.current_style.lock().unwrap().clone();
                                let locale = state.locale.lock().unwrap().clone();
                                let style_label = style_to_label(&current_style, &locale);

                                // Build notification body with model and style
                                let mut notification_body = get_translation(&locale, "notifications.processing");
                                let model_label = get_translation(&locale, "notifications.model");
                                let style_label_key = get_translation(&locale, "notifications.style");
                                notification_body.push_str(&format!("\n{}: {}", model_label, current_model));
                                notification_body.push_str(&format!("\n{}: {}", style_label_key, style_label));

                                // Show notification that we're processing
                                let title = get_translation(&locale, "notifications.title");
                                let _ = app.notification()
                                    .builder()
                                    .title(&title)
                                    .body(&notification_body)
                                    .show();

                                // Play processing sound
                                play_sound("processing", sound_enabled);
                            }
                            Err(e) => {
                                eprintln!("Failed to read clipboard: {}", e);
                            }
                        }
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            handle_corrected_text,
            set_sound_enabled,
            get_sound_enabled,
            update_shortcut,
            get_shortcut_key,
            get_shortcut_modifier,
            play_sound_in_app,
            set_auto_paste_enabled,
            get_auto_paste_enabled,
            secure_storage_get,
            secure_storage_set,
            secure_storage_remove,
            set_correction_settings,
            get_current_model,
            get_current_style,
            set_locale,
            get_locale
        ])
        .setup(|app| {
            // Set activation policy to Accessory on macOS to hide dock icon
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            // Create system tray icon (no menu - click to toggle)
            let tray_icon = Image::from_bytes(include_bytes!("../icons/tray.png"))
                .expect("Failed to load tray icon");

            let app_handle = app.app_handle().clone();
            TrayIconBuilder::new()
                .icon(tray_icon)
                .icon_as_template(true)
                .tooltip("Correctify - Click to toggle")
                .on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click { button, button_state, .. } = event {
                        if button == MouseButton::Left && button_state == MouseButtonState::Up {
                            if let Some(window) = app_handle.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                    }
                })
                .build(app)
                .expect("Failed to build tray icon");


            // Register the global shortcut with configurable modifier
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
            let state = app.state::<AppState>();
            let shortcut_modifier = state.shortcut_modifier.lock().unwrap();
            let shortcut_key = state.shortcut_key.lock().unwrap();
            let modifier_platform = convert_modifier_to_platform(&*shortcut_modifier);
            let shortcut_str = format!("{}+{}", modifier_platform, *shortcut_key);
            let shortcut = shortcut_str.parse::<Shortcut>().unwrap();
            app.global_shortcut().register(shortcut)
                .expect("Failed to register global shortcut");
            println!("Global shortcut registered: {}", shortcut_str);

            // Get window for all platforms
            let window = app.get_webview_window("main").unwrap();

            // Apply window vibrancy effects based on platform
            #[cfg(target_os = "macos")]
            {
                apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                    .expect("Failed to apply vibrancy on macOS");
                println!("Applied macOS vibrancy effect");
            }

            #[cfg(target_os = "windows")]
            {
                apply_blur(&window, Some((18, 18, 18, 125)))
                    .expect("Failed to apply blur on Windows");
                println!("Applied Windows blur effect");
            }

            #[cfg(debug_assertions)]
            {
                window.open_devtools();
            }

            // Handle close event: hide window instead of closing (all platforms for menubar behavior)
            {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        // Prevent the default close behavior
                        api.prevent_close();
                        // Hide the window instead
                        let _ = window_clone.hide();
                    }
                });
            }

            // Create application menu for all platforms
            {
                // About menu item (used in different menus per platform)
                let about_item = MenuItemBuilder::new("About Correctify")
                    .id("about")
                    .build(app)?;

                #[cfg(target_os = "macos")]
                {
                    // macOS-specific: App Menu (Correctify)
                    let hide_item = PredefinedMenuItem::hide(app, None)?;
                    let quit_item = PredefinedMenuItem::quit(app, None)?;

                    let app_menu = SubmenuBuilder::new(app, "Correctify")
                        .item(&about_item)
                        .separator()
                        .item(&hide_item)
                        .separator()
                        .item(&quit_item)
                        .build()?;

                    // File Menu with New Window
                    let new_window_item = MenuItemBuilder::new("New Window")
                        .id("new_window")
                        .accelerator("Cmd+N")
                        .build(app)?;

                    let close_window_item = PredefinedMenuItem::close_window(app, None)?;

                    let file_menu = SubmenuBuilder::new(app, "File")
                        .item(&new_window_item)
                        .item(&close_window_item)
                        .build()?;

                    // Edit Menu
                    let undo_item = PredefinedMenuItem::undo(app, None)?;
                    let redo_item = PredefinedMenuItem::redo(app, None)?;
                    let cut_item = PredefinedMenuItem::cut(app, None)?;
                    let copy_item = PredefinedMenuItem::copy(app, None)?;
                    let paste_item = PredefinedMenuItem::paste(app, None)?;
                    let select_all_item = PredefinedMenuItem::select_all(app, None)?;

                    let edit_menu = SubmenuBuilder::new(app, "Edit")
                        .item(&undo_item)
                        .item(&redo_item)
                        .separator()
                        .item(&cut_item)
                        .item(&copy_item)
                        .item(&paste_item)
                        .separator()
                        .item(&select_all_item)
                        .build()?;

                    // Window Menu
                    let minimize_item = PredefinedMenuItem::minimize(app, None)?;

                    let window_menu = SubmenuBuilder::new(app, "Window")
                        .item(&minimize_item)
                        .build()?;

                    let menu = MenuBuilder::new(app)
                        .items(&[&app_menu, &file_menu, &edit_menu, &window_menu])
                        .build()?;

                    app.set_menu(menu)?;
                }

                #[cfg(not(target_os = "macos"))]
                {
                    // Windows/Linux: File, Edit, Help menus
                    let quit_item = PredefinedMenuItem::quit(app, None)?;

                    let file_menu = SubmenuBuilder::new(app, "File")
                        .item(&quit_item)
                        .build()?;

                    // Edit Menu
                    let undo_item = PredefinedMenuItem::undo(app, None)?;
                    let redo_item = PredefinedMenuItem::redo(app, None)?;
                    let cut_item = PredefinedMenuItem::cut(app, None)?;
                    let copy_item = PredefinedMenuItem::copy(app, None)?;
                    let paste_item = PredefinedMenuItem::paste(app, None)?;
                    let select_all_item = PredefinedMenuItem::select_all(app, None)?;

                    let edit_menu = SubmenuBuilder::new(app, "Edit")
                        .item(&undo_item)
                        .item(&redo_item)
                        .separator()
                        .item(&cut_item)
                        .item(&copy_item)
                        .item(&paste_item)
                        .separator()
                        .item(&select_all_item)
                        .build()?;

                    // Help Menu with About
                    let help_menu = SubmenuBuilder::new(app, "Help")
                        .item(&about_item)
                        .build()?;

                    let menu = MenuBuilder::new(app)
                        .items(&[&file_menu, &edit_menu, &help_menu])
                        .build()?;

                    app.set_menu(menu)?;
                }

                // Handle all menu events (application menu only - no tray menu)
                app.on_menu_event(move |app, event| {
                    match event.id().as_ref() {
                        #[cfg(target_os = "macos")]
                        "new_window" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "about" => {
                            // Check if about window already exists
                            if let Some(about_window) = app.get_webview_window("about") {
                                let _ = about_window.show();
                                let _ = about_window.set_focus();
                            } else {
                                // Create new about window
                                use tauri::WebviewWindowBuilder;
                                let _ = WebviewWindowBuilder::new(
                                    app,
                                    "about",
                                    tauri::WebviewUrl::App("/about".into())
                                )
                                .title("About Correctify")
                                .inner_size(400.0, 550.0)
                                .resizable(false)
                                .center()
                                .build();
                            }
                        }
                        _ => {}
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
