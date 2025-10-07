use tauri::{Manager, Emitter};
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};
use tauri::image::Image;
use std::thread;
use std::time::Duration;

// Tauri command to handle corrected text from frontend
#[tauri::command]
async fn handle_corrected_text(
    text: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    use tauri_plugin_notification::NotificationExt;

    println!("Writing corrected text to clipboard (length: {} chars)", text.len());

    // Write corrected text to clipboard
    app.clipboard().write_text(text.clone())
        .map_err(|e| format!("Failed to write to clipboard: {}", e))?;

    println!("Corrected text written to clipboard successfully");

    // Add a small delay to ensure the processing notification is visible
    thread::sleep(Duration::from_millis(500));

    // Show success notification
    let result = app.notification()
        .builder()
        .title("✅ Correctify")
        .body("Text corrected and copied to clipboard!")
        .show();

    match result {
        Ok(id) => println!("Success notification shown with id: {:?}", id),
        Err(e) => {
            eprintln!("Failed to show notification: {}", e);
            eprintln!("Error details: {:?}", e);
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    use tauri_plugin_global_shortcut::ShortcutState;
                    use tauri_plugin_clipboard_manager::ClipboardExt;
                    use tauri_plugin_notification::NotificationExt;

                    if event.state == ShortcutState::Pressed {
                        println!("🔔 Global shortcut triggered: {:?}", shortcut);

                        // Read from clipboard directly (user should have copied text with Cmd+C first)
                        match app.clipboard().read_text() {
                            Ok(text) => {
                                if text.is_empty() {
                                    println!("❌ Clipboard is empty - no text to correct");
                                    
                                    #[cfg(target_os = "macos")]
                                    let copy_instruction = "Please copy text first (Cmd+C), then use Cmd+Shift+.";
                                    
                                    #[cfg(not(target_os = "macos"))]
                                    let copy_instruction = "Please copy text first (Ctrl+C), then use Ctrl+Shift+.";
                                    
                                    let _ = app.notification()
                                        .builder()
                                        .title("⚠️ Correctify")
                                        .body(copy_instruction)
                                        .show();
                                    return;
                                }
                                
                                println!("📋 Processing clipboard text ({} chars)", text.len());
                                println!("   Preview: {}", 
                                    if text.len() > 100 { &text[..100] } else { &text });
                                
                                // Emit event to frontend with text to correct
                                match app.emit("correct-clipboard-text", text.clone()) {
                                    Ok(_) => println!("✅ Event emitted to frontend"),
                                    Err(e) => eprintln!("❌ Failed to emit event: {}", e),
                                }
                                
                                // Show notification that we're processing
                                let notification_result = app.notification()
                                    .builder()
                                    .title("⏳ Correctify")
                                    .body("Processing text correction...")
                                    .show();
                                
                                match notification_result {
                                    Ok(id) => println!("✅ Processing notification shown (id: {:?})", id),
                                    Err(e) => eprintln!("❌ Failed to show notification: {}", e),
                                }
                            }
                            Err(e) => {
                                eprintln!("❌ Failed to read clipboard: {}", e);
                            }
                        }
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![handle_corrected_text])
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
            let shortcut = "CmdOrCtrl+Shift+.".parse::<Shortcut>().unwrap();
            app.global_shortcut().register(shortcut)
                .expect("Failed to register global shortcut");
            println!("Global shortcut registered: CmdOrCtrl+Shift+.");

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
