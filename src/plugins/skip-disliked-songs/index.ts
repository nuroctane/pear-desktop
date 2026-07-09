import { t } from '@/i18n';
import { createPlugin } from '@/utils';
import { waitForElement } from '@/utils/wait-for-element';

const getCurrentVideoId = (): string | null => {
  try {
    return new URLSearchParams(window.location.search).get('v');
  } catch {
    return null;
  }
};

export default createPlugin<
  unknown,
  unknown,
  {
    observer?: MutationObserver;
    skipTimer?: ReturnType<typeof setTimeout>;
    lastSkippedVideoId?: string | null;
    start(): void;
    stop(): void;
  }
>({
  name: () => t('plugins.skip-disliked-songs.name'),
  description: () => t('plugins.skip-disliked-songs.description'),
  restartNeeded: false,
  config: {
    enabled: false,
  },
  renderer: {
    lastSkippedVideoId: null,
    start() {
      waitForElement<HTMLElement>('#like-button-renderer').then(
        (dislikeBtn) => {
          this.observer = new MutationObserver(() => {
            if (dislikeBtn?.getAttribute('like-status') !== 'DISLIKE') {
              return;
            }

            const videoId = getCurrentVideoId();
            // Avoid re-triggering on the same track (attribute can churn)
            if (videoId && videoId === this.lastSkippedVideoId) {
              return;
            }

            // YouTube Music sometimes auto-advances on dislike. Wait briefly;
            // only click next if we're still on the same video (fixes double-skip).
            if (this.skipTimer) {
              clearTimeout(this.skipTimer);
            }
            this.skipTimer = setTimeout(() => {
              const stillSame =
                videoId === null || getCurrentVideoId() === videoId;
              if (!stillSame) {
                // Native player already advanced — do not skip again
                this.lastSkippedVideoId = getCurrentVideoId();
                return;
              }

              this.lastSkippedVideoId = videoId;
              document
                .querySelector<HTMLButtonElement>('yt-icon-button.next-button')
                ?.click();
            }, 350);
          });
          this.observer.observe(dislikeBtn, {
            attributes: true,
            attributeFilter: ['like-status'],
            childList: false,
            subtree: false,
          });
        },
      );
    },
    stop() {
      this.observer?.disconnect();
      if (this.skipTimer) {
        clearTimeout(this.skipTimer);
      }
    },
  },
});
