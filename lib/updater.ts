"use client";

import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

export interface UpdateInfo {
  version: string;
  body: string;
  update: Awaited<ReturnType<typeof check>>;
}

export type UpdateCallback = (updateInfo: UpdateInfo | null) => void;
export type UpdateProgressCallback = (state: "downloading" | "installing") => void;
export type UpdateCompleteCallback = () => Promise<boolean>; // Returns true if user wants to restart

export async function checkForUpdates(
  silent = false,
  onUpdateAvailable?: UpdateCallback,
  onProgress?: UpdateProgressCallback,
  onComplete?: UpdateCompleteCallback,
) {
  try {
    const update = await check();

    if (update) {
      // Call callback if provided (for custom modal)
      if (onUpdateAvailable) {
        onUpdateAvailable({
          version: update.version,
          body: update.body || "",
          update,
        });
        return;
      }

      // Fallback to native dialogs if no callback provided
      const { ask, message } = await import("@tauri-apps/plugin-dialog");
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

        await update.downloadAndInstall();

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
      if (onUpdateAvailable) {
        onUpdateAvailable(null);
        return;
      }

      const { message } = await import("@tauri-apps/plugin-dialog");
      await message("You are already on the latest version!", {
        title: "No Updates",
        kind: "info",
      });
    }
  } catch (error) {
    console.error("Update check failed:", error);
    if (!silent) {
      if (onUpdateAvailable) {
        onUpdateAvailable(null);
        return;
      }

      const { message } = await import("@tauri-apps/plugin-dialog");
      await message(`Failed to check for updates: ${error}`, {
        title: "Update Error",
        kind: "error",
      });
    }
  }
}

export async function installUpdate(
  update: NonNullable<Awaited<ReturnType<typeof check>>>,
  onProgress?: UpdateProgressCallback,
  onComplete?: UpdateCompleteCallback,
) {
  try {
    if (onProgress) {
      onProgress("downloading");
    }

    await update.downloadAndInstall();

    if (onProgress) {
      onProgress("installing");
    }

    if (onComplete) {
      const shouldRestart = await onComplete();
      if (shouldRestart) {
        await relaunch();
      }
    } else {
      // Fallback to native dialog
      const { ask } = await import("@tauri-apps/plugin-dialog");
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
  } catch (error) {
    console.error("Failed to install update:", error);
    throw error;
  }
}
