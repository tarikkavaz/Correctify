"use client";

import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

export async function checkForUpdates(silent = false) {
  try {
    const update = await check();

    if (update) {
      // New version available
      const yes = await ask(
        `Update to ${update.version} is available!\n\nRelease notes: ${update.body}\n\nWould you like to install it now?`,
        {
          title: "Update Available",
          kind: "info",
        },
      );

      if (yes) {
        await message("Downloading update...", {
          title: "Updating",
          kind: "info",
        });

        // Download and install the update
        await update.downloadAndInstall();

        // Ask to restart
        const restart = await ask(
          "Update installed successfully! Would you like to restart the app now?",
          {
            title: "Update Complete",
            kind: "info",
          },
        );

        if (restart) {
          await relaunch();
        }
      }
    } else if (!silent) {
      // Only show "up to date" message if user manually checked
      await message("You are already on the latest version!", {
        title: "No Updates",
        kind: "info",
      });
    }
  } catch (error) {
    console.error("Update check failed:", error);
    if (!silent) {
      await message(`Failed to check for updates: ${error}`, {
        title: "Update Error",
        kind: "error",
      });
    }
  }
}
