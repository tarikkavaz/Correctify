use tauri::Manager;
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(any(debug_assertions, target_os = "macos"))]
            let window = app.get_webview_window("main").unwrap();
            
            #[cfg(debug_assertions)]
            {
                window.open_devtools();
            }

            // Handle close event: hide window instead of closing on macOS
            #[cfg(target_os = "macos")]
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

                // Handle menu events (all platforms)
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
