# Stargate theme (terminal glass)

Custom CSS for **pear-desktop / YouTube Music** matching the Stargate gold TUI aesthetic.

## Install

1. Open YouTube Music (Pear Desktop)
2. **Options → Visual Tweaks → Themes → Import CSS file**
3. Select `ytmusicpeardesktop-stargate-theme.css`

Or copy the folder next to the app and point config at it:

```
%LocalAppData%\Programs\youtube-music\Youtube Music Stargate Theme Pear Desktop\ytmusicpeardesktop-stargate-theme.css
```

## Tuned for

- Pear Desktop **3.12.1+**
- Plugins: in-app-menu, blur-nav-bar, transparent-player, picture-in-picture,
  precise-volume, ambient-mode, video-toggle (force-hide), downloader,
  navigation, captions-selector, sponsorblock, album-color-theme, synced-lyrics

## Classes

| Class | Effect |
|-------|--------|
| `html.sg-solid` | Force opaque panels |
| `html.sg-no-crt` | Disable CRT scanlines |

Without Transparent Player, solid panels apply automatically.

## Version

See file header (`@version`).
