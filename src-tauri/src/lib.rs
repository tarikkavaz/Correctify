use tauri::{Manager, Emitter};
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};
use tauri::image::Image;
use std::thread;
use std::time::Duration;
use std::sync::{Arc, Mutex};
use std::io::Cursor;
use enigo::{Enigo, Key, Keyboard, Settings};

// Application state for settings
struct AppState {
    sound_enabled: Arc<Mutex<bool>>,
    shortcut_key: Arc<Mutex<String>>,
    auto_paste_enabled: Arc<Mutex<bool>>,
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

    // Build notification body with optional model and duration
    let mut body = String::from("Text corrected and copied to clipboard!");
    if let Some(model_name) = model {
        body.push_str(&format!("\nModel: {}", model_name));
    }
    if let Some(dur) = duration {
        body.push_str(&format!("\nDuration: {:.2}s", dur / 1000.0));
    }

    // Show success notification and play sound
    let _ = app.notification()
        .builder()
        .title("Correctify")
        .body(&body)
        .show();
    
    // Play completed sound
    play_sound("completed", sound_enabled);

    // If auto-paste is enabled, directly type the corrected text
    if should_auto_paste {
        // Clone the text for the thread
        let text_to_paste = text.clone();
        
        // Spawn a separate thread to avoid blocking
        thread::spawn(move || {
            // Wait longer to ensure notification is visible and user sees feedback
            thread::sleep(Duration::from_millis(800));
            
            match Enigo::new(&Settings::default()) {
                Ok(mut enigo) => {
                    // Directly type the corrected text instead of simulating Cmd+V
                    // This is more reliable and doesn't depend on clipboard state
                    match enigo.text(&text_to_paste) {
                        Ok(_) => {
                            println!("Auto-paste completed");
                        }
                        Err(_) => {
                            // Fallback: try Cmd+V/Ctrl+V
                            #[cfg(target_os = "macos")]
                            {
                                let _ = enigo.key(Key::Meta, enigo::Direction::Press);
                                thread::sleep(Duration::from_millis(50));
                                let _ = enigo.key(Key::Unicode('v'), enigo::Direction::Click);
                                thread::sleep(Duration::from_millis(50));
                                let _ = enigo.key(Key::Meta, enigo::Direction::Release);
                            }
                            
                            #[cfg(not(target_os = "macos"))]
                            {
                                let _ = enigo.key(Key::Control, enigo::Direction::Press);
                                thread::sleep(Duration::from_millis(50));
                                let _ = enigo.key(Key::Unicode('v'), enigo::Direction::Click);
                                thread::sleep(Duration::from_millis(50));
                                let _ = enigo.key(Key::Control, enigo::Direction::Release);
                            }
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to create Enigo instance: {:?}", e);
                }
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

// Tauri command to update shortcut key
#[tauri::command]
fn update_shortcut(
    new_key: String,
    app: tauri::AppHandle,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
    
    // Get the current shortcut key
    let mut shortcut_key = state.shortcut_key.lock().unwrap();
    let old_shortcut_str = format!("CmdOrCtrl+Shift+{}", *shortcut_key);
    let new_shortcut_str = format!("CmdOrCtrl+Shift+{}", new_key);
    
    // Unregister old shortcut
    if let Ok(old_shortcut) = old_shortcut_str.parse::<Shortcut>() {
        let _ = app.global_shortcut().unregister(old_shortcut);
        println!("Unregistered old shortcut: {}", old_shortcut_str);
    }
    
    // Register new shortcut
    match new_shortcut_str.parse::<Shortcut>() {
        Ok(new_shortcut) => {
            match app.global_shortcut().register(new_shortcut) {
                Ok(_) => {
                    *shortcut_key = new_key.clone();
                    println!("Registered new shortcut: {}", new_shortcut_str);
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize app state with default values
    let app_state = AppState {
        sound_enabled: Arc::new(Mutex::new(true)), // Default: sound enabled
        shortcut_key: Arc::new(Mutex::new("]".to_string())), // Default: closing bracket key
        auto_paste_enabled: Arc::new(Mutex::new(false)), // Default: auto-paste disabled
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
        .plugin(tauri_plugin_secure_storage::init())
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
                                    let _ = app.notification()
                                        .builder()
                                        .title("Correctify - Permission Required")
                                        .body("Auto copy/paste requires Accessibility permission. Please enable it in System Settings > Privacy & Security > Accessibility, then restart the app.")
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
                                
                                // Show notification that we're processing
                                let _ = app.notification()
                                    .builder()
                                    .title("Correctify")
                                    .body("Processing text correction...")
                                    .show();
                                
                                // Play processing sound
                                play_sound("processing", sound_enabled);
                            }
                            Err(e) => {
                                eprintln!("❌ Failed to read clipboard: {}", e);
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
            play_sound_in_app,
            set_auto_paste_enabled,
            get_auto_paste_enabled
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


            // Register the global shortcut
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
            let shortcut = "CmdOrCtrl+Shift+]".parse::<Shortcut>().unwrap();
            app.global_shortcut().register(shortcut)
                .expect("Failed to register global shortcut");
            println!("Global shortcut registered: CmdOrCtrl+Shift+]");

            // Get window for all platforms
            let window = app.get_webview_window("main").unwrap();
            
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
