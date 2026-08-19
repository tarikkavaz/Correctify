# Changelog

## [1.0.3] - 2026-08-19

### Changed

- Replaced the legacy model list with GPT-5.4 Nano, GPT-5.4 Mini, Claude Haiku 4.5, Ministral 3B, and the OpenRouter Free fallback.
- Expanded the OpenAI selection with GPT-5.4 and GPT-5.5, and corrected the GPT-5.4 Nano and Mini context-window metadata.
- Moved desktop API keys from base64 files to the operating system credential vault, with one-time migration and consolidation into a single credential record.
- Removed browser correction and API-key handling. Browser builds are now non-interactive.
- Added correction model validation, request timeout/cancellation, actual token usage accounting, and retry classification.
- Added signed updater artifacts with required key checks, plus signed and notarized macOS distribution builds.
- Updated the frontend, Tauri, AI SDK, Rust, linting, and build-tool dependency baseline.
- Added first-run onboarding with provider selection, API-key validation before secure storage, and copy-only shortcut guidance.
- Replaced the static correction output with an accept/reject review workflow, including copy accepted text, replace input, and restore original actions.
- Added local language detection and override, reusable presets, metadata-only recent activity, and CSV export.
- Made GPT-5.4 Mini the recommended OpenAI default, labeled Nano as the fastest option, and added model-quality badges and API-key test actions.
- Updated the tray interaction: left-click opens Correctify, while the right-click menu exposes status, settings, and quit controls.

### Fixed

- Migrated stale saved model selections to the current default before inline or global-shortcut correction.
- Fixed duplicate global-shortcut listeners and added a native auto-paste guard, preventing duplicate paste operations.
- Removed unsupported temperature requests for GPT-5 models.
- Fixed Turkish auto-detection incorrectly treating ordinary English `i` as a Turkish-specific character.
- Protected inline and fenced Markdown code during correction, preserving original command text exactly.
- Fixed correction-review diff offsets that could corrupt accepted output around insertions or code spans.
- Tightened Grammar Only guidance to correct clear typos, verb forms, articles, and required prepositions without broad stylistic rewrites.

## [1.0.2] - 2026-01-22

### Fixed

- **Fixed global shortcut wake on macOS**: Prevented the app from idling when triggered via the global shortcut so corrections continue in the background without opening the UI.


## [1.0.1] - 2026-01-06

### Fixed

#### Newline Preservation
- **Fixed newline preservation in corrected output**: Added explicit instruction in the system prompt to preserve all line breaks and newlines exactly as they appear in the input text. The system now maintains the exact same line structure and spacing as the original text.
- **Fixed newline display in output window**: Resolved an issue where newlines were preserved in the copied text but not displayed correctly in the output window. The output area now properly displays line breaks and paragraph breaks, matching what you see when copying the text.
- **Improved ReactMarkdown rendering**: Updated the output rendering to properly handle newlines by converting single newlines to markdown line breaks before processing, ensuring consistent display on first and subsequent corrections.

#### Custom Rules
- **Fixed custom rules not being applied**: Custom rules are now properly recognized as system-level instructions rather than user input. The prompt structure has been improved to clearly distinguish between:
  - **USER INPUT TEXT**: The text to be corrected (not treated as commands)
  - **SYSTEM INSTRUCTIONS**: Custom rules and other system directives (must be followed)
- **Enhanced custom rules formatting**: Custom rules are now displayed with clear headers (`=== SYSTEM INSTRUCTIONS: Additional Custom Rules ===`) to ensure the LLM correctly interprets and applies them.
- **Fixed clarification request issue**: Resolved an issue where adding custom rules like "Always convert to uppercase" would cause the LLM to return clarification requests instead of processing the text. Custom rules are now correctly applied to all corrections.

### Technical Changes
- Updated `lib/prompts.ts`:
  - Added explicit newline preservation rule (#6) to `BASE_SYSTEM_PROMPT`
  - Clarified the distinction between user input and system instructions in the CRITICAL note
  - Enhanced `getSystemPrompt()` function with better custom rules formatting
- Updated `app/page.tsx`:
  - Modified output rendering to preserve newlines using markdown line break conversion
  - Added `key` prop to ReactMarkdown component to ensure proper re-rendering
  - Improved paragraph component styling for consistent line spacing

### Notes
- Both shortcut workflow and inline text area workflow use the same correction logic, so all fixes apply to both methods
- Newline preservation works correctly across all models (tested with GPT-4o and other models)

---

## [1.0.0] - Initial Release

Initial release of Correctify.
