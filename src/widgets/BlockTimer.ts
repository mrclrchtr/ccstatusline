import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

type DisplayMode = 'time' | 'progress' | 'progress-short';
type BlockStyle = '█' | '■' | '▪';
type PrefixStyle = 'block' | 'timer' | 'none';

export class BlockTimerWidget implements Widget {
    getDefaultColor(): string { return 'yellow'; }
    getDescription(): string { return 'Shows elapsed time since beginning of current 5hr block'; }
    getDisplayName(): string { return 'Block Timer'; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const mode = item.metadata?.display ?? 'time';
        const blockStyle = item.metadata?.blockStyle ?? '█';
        const prefixStyle = item.metadata?.prefixStyle ?? 'block';
        const modifiers: string[] = [];

        if (mode === 'progress') {
            modifiers.push('progress bar');
        } else if (mode === 'progress-short') {
            modifiers.push('short bar');
        }

        if (blockStyle !== '█') {
            modifiers.push(`${blockStyle} style`);
        }

        if (prefixStyle === 'timer') {
            modifiers.push('timer prefix');
        } else if (prefixStyle === 'none') {
            modifiers.push('no prefix');
        }

        return {
            displayText: this.getDisplayName(),
            modifierText: modifiers.length > 0 ? `(${modifiers.join(', ')})` : undefined
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action === 'toggle-progress') {
            const currentMode = (item.metadata?.display ?? 'time') as DisplayMode;
            let nextMode: DisplayMode;

            if (currentMode === 'time') {
                nextMode = 'progress';
            } else if (currentMode === 'progress') {
                nextMode = 'progress-short';
            } else {
                nextMode = 'time';
            }

            return {
                ...item,
                metadata: {
                    ...item.metadata,
                    display: nextMode
                }
            };
        } else if (action === 'toggle-block-style') {
            const currentStyle = (item.metadata?.blockStyle ?? '█') as BlockStyle;
            let nextStyle: BlockStyle;

            if (currentStyle === '█') {
                nextStyle = '■';
            } else if (currentStyle === '■') {
                nextStyle = '▪';
            } else {
                nextStyle = '█';
            }

            return {
                ...item,
                metadata: {
                    ...item.metadata,
                    blockStyle: nextStyle
                }
            };
        } else if (action === 'toggle-prefix') {
            const currentPrefix = (item.metadata?.prefixStyle ?? 'block') as PrefixStyle;
            let nextPrefix: PrefixStyle;

            if (currentPrefix === 'block') {
                nextPrefix = 'timer';
            } else if (currentPrefix === 'timer') {
                nextPrefix = 'none';
            } else {
                nextPrefix = 'block';
            }

            return {
                ...item,
                metadata: {
                    ...item.metadata,
                    prefixStyle: nextPrefix
                }
            };
        }
        return null;
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const displayMode = (item.metadata?.display ?? 'time') as DisplayMode;
        const blockStyle = (item.metadata?.blockStyle ?? '█') as BlockStyle;
        const prefixStyle = (item.metadata?.prefixStyle ?? 'block') as PrefixStyle;

        if (context.isPreview) {
            let prefix = '';
            if (!item.rawValue) {
                if (prefixStyle === 'block') {
                    prefix = displayMode === 'time' ? 'Block: ' : 'Block ';
                } else if (prefixStyle === 'timer') {
                    prefix = '⏱️ 1h 15m→ ';
                }
            }

            if (displayMode === 'progress') {
                const filled = blockStyle.repeat(22);
                const empty = blockStyle === '█' ? '░'.repeat(10) : ' '.repeat(10);
                return `${prefix}[${filled}${empty}] 73.9%`;
            } else if (displayMode === 'progress-short') {
                const filled = blockStyle.repeat(11);
                const empty = blockStyle === '█' ? '░'.repeat(5) : ' '.repeat(5);
                return `${prefix}[${filled}${empty}] 73.9%`;
            }
            return `${prefix}3hr 45m`;
        }

        // Check if we have block metrics in context
        const blockMetrics = context.blockMetrics;
        if (!blockMetrics) {
            // No active session - show empty progress bar or 0hr 0m
            let prefix = '';
            if (!item.rawValue) {
                if (prefixStyle === 'block') {
                    prefix = displayMode === 'time' ? 'Block: ' : 'Block ';
                } else if (prefixStyle === 'timer') {
                    prefix = '⏱️ 5h 0m→ ';
                }
            }

            if (displayMode === 'progress' || displayMode === 'progress-short') {
                const barWidth = displayMode === 'progress' ? 32 : 16;
                const emptyBar = blockStyle === '█' ? '░'.repeat(barWidth) : ' '.repeat(barWidth);
                return `${prefix}[${emptyBar}] 0%`;
            } else {
                return `${prefix}0hr 0m`;
            }
        }

        try {
            // Calculate elapsed time and progress
            const now = new Date();
            const elapsedMs = now.getTime() - blockMetrics.startTime.getTime();
            const sessionDurationMs = 5 * 60 * 60 * 1000; // 5 hours
            const progress = Math.min(elapsedMs / sessionDurationMs, 1.0);
            const percentage = (progress * 100).toFixed(1);

            // Calculate elapsed and remaining time
            const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
            const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
            const remainingMs = Math.max(sessionDurationMs - elapsedMs, 0);
            const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
            const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

            // Build prefix
            let prefix = '';
            if (!item.rawValue) {
                if (prefixStyle === 'block') {
                    prefix = displayMode === 'time' ? 'Block: ' : 'Block ';
                } else if (prefixStyle === 'timer') {
                    let remainingString: string;
                    if (remainingMinutes === 0) {
                        remainingString = `${remainingHours}h`;
                    } else {
                        remainingString = `${remainingHours}h ${remainingMinutes}m`;
                    }
                    prefix = `⏱️ ${remainingString}→ `;
                }
            }

            if (displayMode === 'progress' || displayMode === 'progress-short') {
                const barWidth = displayMode === 'progress' ? 32 : 16;
                const filledWidth = Math.floor(progress * barWidth);
                const emptyWidth = barWidth - filledWidth;
                const emptyChar = blockStyle === '█' ? '░' : ' ';
                const progressBar = blockStyle.repeat(filledWidth) + emptyChar.repeat(emptyWidth);
                return `${prefix}[${progressBar}] ${percentage}%`;
            } else {
                // Time display mode
                let timeString: string;
                if (elapsedMinutes === 0) {
                    timeString = `${elapsedHours}hr`;
                } else {
                    timeString = `${elapsedHours}hr ${elapsedMinutes}m`;
                }
                return `${prefix}${timeString}`;
            }
        } catch {
            return null;
        }
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'p', label: '(p)rogress toggle', action: 'toggle-progress' },
            { key: 'b', label: '(b)lock style', action: 'toggle-block-style' },
            { key: 'l', label: 'prefix (l)abel', action: 'toggle-prefix' }
        ];
    }

    supportsRawValue(): boolean { return true; }
    supportsColors(item: WidgetItem): boolean { return true; }
}