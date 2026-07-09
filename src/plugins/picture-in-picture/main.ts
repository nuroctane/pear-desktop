import { app } from 'electron';

import type { PictureInPicturePluginConfig } from './index';
import type { BackendContext } from '@/types/contexts';

let config: PictureInPicturePluginConfig;

export const onMainLoad = async ({
  window,
  getConfig,
  setConfig,
  ipc: { send, on },
}: BackendContext<PictureInPicturePluginConfig>) => {
  let isInPiP = false;
  let originalPosition: number[];
  let originalSize: number[];
  let originalFullScreen: boolean;
  let originalMaximized: boolean;

  /** Guard against config arrays corrupted by array-concatenating merges. */
  const asPair = (
    value: unknown,
    fallback: [number, number],
  ): [number, number] => {
    if (!Array.isArray(value) || value.length < 2) {
      return fallback;
    }
    // Prefer the most recently saved pair (last two numbers)
    const x = Number(value[value.length - 2]);
    const y = Number(value[value.length - 1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return fallback;
    }
    return [x, y];
  };

  const pipPosition = (): [number, number] =>
    config.savePosition
      ? asPair(config['pip-position'], [10, 10])
      : [10, 10];
  const pipSize = (): [number, number] =>
    config.saveSize ? asPair(config['pip-size'], [450, 275]) : [450, 275];

  const togglePiP = () => {
    isInPiP = !isInPiP;
    setConfig({ isInPiP });

    if (isInPiP) {
      originalFullScreen = window.isFullScreen();
      if (originalFullScreen) {
        window.setFullScreen(false);
      }

      originalMaximized = window.isMaximized();
      if (originalMaximized) {
        window.unmaximize();
      }

      originalPosition = window.getPosition();
      originalSize = window.getSize();

      window.webContents.addListener('before-input-event', blockShortcutsInPiP);

      window.setMaximizable(false);
      window.setFullScreenable(false);

      send('peard:pip-toggle', true);

      app.dock?.hide();
      window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
      });
      app.dock?.show();
      if (config.alwaysOnTop) {
        window.setAlwaysOnTop(true, 'screen-saver', 1);
      }
    } else {
      window.webContents.removeListener(
        'before-input-event',
        blockShortcutsInPiP,
      );
      window.setMaximizable(true);
      window.setFullScreenable(true);

      send('peard:pip-toggle', false);

      window.setVisibleOnAllWorkspaces(false);
      window.setAlwaysOnTop(false);

      if (originalFullScreen) {
        window.setFullScreen(true);
      }

      if (originalMaximized) {
        window.maximize();
      }
    }

    const [x, y] = isInPiP ? pipPosition() : originalPosition;
    const [w, h] = isInPiP ? pipSize() : originalSize;
    window.setPosition(x, y);
    window.setSize(w, h);

    window.setWindowButtonVisibility?.(!isInPiP);
  };

  const blockShortcutsInPiP = (
    event: Electron.Event,
    input: Electron.Input,
  ) => {
    const key = input.key.toLowerCase();

    if (key === 'f') {
      event.preventDefault();
    } else if (key === 'escape') {
      togglePiP();
      event.preventDefault();
    }
  };

  config ??= await getConfig();
  setConfig({ isInPiP });
  on('plugin:toggle-picture-in-picture', () => {
    togglePiP();
  });

  // Debounce geometry saves — move/resize fire very frequently and used to
  // bloat pip-position / pip-size arrays under the old deepmerge behavior.
  let geometrySaveTimer: ReturnType<typeof setTimeout> | undefined;
  const scheduleGeometrySave = () => {
    if (geometrySaveTimer) {
      clearTimeout(geometrySaveTimer);
    }
    geometrySaveTimer = setTimeout(() => {
      if (!config.isInPiP || config.useNativePiP) {
        return;
      }
      const [x, y] = window.getPosition();
      const [width, height] = window.getSize();
      setConfig({
        'pip-position': [x, y],
        'pip-size': [width, height],
      });
    }, 150);
  };

  window.on('move', () => {
    if (config.isInPiP && !config.useNativePiP) {
      scheduleGeometrySave();
    }
  });

  window.on('resize', () => {
    if (config.isInPiP && !config.useNativePiP) {
      scheduleGeometrySave();
    }
  });
};

export const onConfigChange = (newConfig: PictureInPicturePluginConfig) => {
  config = newConfig;
};
