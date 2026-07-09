import './capture.css';
import { ElectronAPI, ScreenshotPayload } from '../types';
import { CaptureLocale, getCaptureLocale } from './captureLocales';

// Add types for the window object
declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

interface Point {
    x: number;
    y: number;
}

interface SelectionBounds extends Point {
    width: number;
    height: number;
}

export class ScreenCapture {
    private isSelecting: boolean = false;
    private isCompleting: boolean = false;
    private startPoint: Point = { x: 0, y: 0 };
    private endPoint: Point = { x: 0, y: 0 };
    private imageElement: HTMLImageElement | null = null;
    private objectUrl: string | null = null;
    private displayId: number = 0;
    private displayOffset: Point = { x: 0, y: 0 };
    private animationFrame: number | null = null;
    private locale: CaptureLocale = getCaptureLocale('English');

    private overlay: HTMLElement;
    private selectionArea: HTMLElement;
    private instructions: HTMLElement;

    constructor() {
        this.overlay = document.getElementById('captureOverlay')!;
        this.selectionArea = document.getElementById('selectionArea')!;
        this.instructions = document.getElementById('instructions')!;

        if (!this.overlay || !this.selectionArea || !this.instructions) {
            throw new Error('Required DOM elements not found');
        }

        // Optimize event handlers by binding them once
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseMoveProximity = this.handleMouseMoveProximity.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.init();
    }

    init() {
        console.log('Initializing screen capture');

        this.setupEventListeners();

        // Persistent listeners: this window is pooled and reused across captures
        window.electron.capture.onScreenshotReady((payload: ScreenshotPayload) => {
            this.handleScreenshot(payload);
        });
        window.electron.capture.onCaptureReset(() => this.reset());

        // Locale resolves long before the first capture (window is pre-created at startup)
        window.electron.settings.get().then(
            s => { this.locale = getCaptureLocale(s.appLanguage ?? 'English'); },
            () => { /* fallback to English */ }
        );
    }

    handleScreenshot(payload: ScreenshotPayload) {
        try {
            this.reset();

            this.displayId = payload.displayId;
            this.displayOffset = { x: payload.displayX, y: payload.displayY };

            const blob = new Blob([payload.buffer as unknown as BlobPart], { type: 'image/png' });
            this.objectUrl = URL.createObjectURL(blob);

            this.imageElement = document.createElement('img');
            this.imageElement.className = 'screenshot-background';
            this.imageElement.src = this.objectUrl;
            document.body.appendChild(this.imageElement);

            this.displayInstructions();
            document.body.style.cursor = 'crosshair';

            console.log(`Screen capture ready for display ${this.displayId}`);
        } catch (error) {
            console.error('Failed to display screenshot:', error);
            this.showError(`Failed to initialize screen capture: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    reset() {
        if (this.imageElement) {
            this.imageElement.remove();
            this.imageElement = null;
        }
        if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }
        const existingError = document.querySelector('.capture-error');
        if (existingError) {
            existingError.remove();
        }
        this.selectionArea.style.display = 'none';
        this.isSelecting = false;
        this.isCompleting = false;
    }

    setupEventListeners() {
        console.log('Setting up event listeners');

        // Use pre-bound event handlers for better performance
        this.overlay.addEventListener('mousedown', this.handleMouseDown as EventListener, { passive: false });
        this.overlay.addEventListener('mousemove', this.handleMouseMove as EventListener, { passive: true });
        this.overlay.addEventListener('mousemove', this.handleMouseMoveProximity as EventListener, { passive: true });
        this.overlay.addEventListener('mouseup', (this.handleMouseUp as unknown) as EventListener, { passive: false });
        document.addEventListener('keydown', (this.handleKeyDown as unknown) as EventListener, { passive: false });

        // Ensure overlay can receive events
        this.overlay.style.pointerEvents = 'auto';
        document.body.style.pointerEvents = 'auto';

        // Optimize overlay for better responsiveness
        this.overlay.style.willChange = 'transform';
        this.selectionArea.style.willChange = 'transform, width, height';
    }

    localToGlobalCoordinates(x: number, y: number): Point {
        return {
            x: x + this.displayOffset.x,
            y: y + this.displayOffset.y
        };
    }

    getGlobalSelectionBounds(): SelectionBounds {
        const localBounds = this.getSelectionBounds();
        return {
            x: localBounds.x + this.displayOffset.x,
            y: localBounds.y + this.displayOffset.y,
            width: localBounds.width,
            height: localBounds.height
        };
    }

    displayInstructions() {
        const displayInfo = this.displayId ? ` (Display ${this.displayId})` : '';
        this.instructions.textContent = this.locale.instruction + displayInfo;
        this.instructions.style.opacity = '1';
        this.instructions.style.display = '';
    }

    handleMouseDown(e: MouseEvent) {
        const globalCoords = this.localToGlobalCoordinates(e.clientX, e.clientY);
        console.log(`Mouse down at local: ${e.clientX},${e.clientY}, global: ${globalCoords.x},${globalCoords.y}`);

        this.isSelecting = true;
        this.startPoint = { x: e.clientX, y: e.clientY };
        this.endPoint = { x: e.clientX, y: e.clientY };
        this.updateSelectionArea();
    }

    handleMouseMove(e: MouseEvent) {
        if (!this.isSelecting) return;

        this.endPoint = { x: e.clientX, y: e.clientY };
        this.updateSelectionArea();
    }

    handleMouseMoveProximity(e: MouseEvent) {
        const rect = this.instructions.getBoundingClientRect();
        const near =
            e.clientX >= rect.left - 20 && e.clientX <= rect.right + 20 &&
            e.clientY >= rect.top - 20 && e.clientY <= rect.bottom + 20;
        this.instructions.style.opacity = near ? '0' : '1';
    }

    async handleMouseUp(e: MouseEvent) {
        const globalCoords = this.localToGlobalCoordinates(e.clientX, e.clientY);
        console.log(`Mouse up at local: ${e.clientX},${e.clientY}, global: ${globalCoords.x},${globalCoords.y}`);

        if (!this.isSelecting || this.isCompleting) return;
        this.isSelecting = false;
        this.isCompleting = true;

        const selection = this.getSelectionBounds();
        const globalSelection = this.getGlobalSelectionBounds();
        console.log(`Local selection: ${selection.width}x${selection.height} at ${selection.x},${selection.y}`);
        console.log(`Global selection: ${globalSelection.width}x${globalSelection.height} at ${globalSelection.x},${globalSelection.y}`);

        if (selection.width < 10 || selection.height < 10) {
            console.log('Selection too small, ignoring');
            this.selectionArea.style.display = 'none';
            this.isCompleting = false;
            return;
        }

        try {
            this.instructions.textContent = this.locale.processing;
            const imageData = await this.captureSelectedArea(selection);
            await this.sendCaptureResult(imageData);
        } catch (error) {
            console.error('Capture failed:', error);
            this.showError(`Capture failed: ${error instanceof Error ? error.message : String(error)}`);
            this.isCompleting = false;
        }
    }

    handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            this.reset();
            // Window will be closed by main process on Escape
        }
    }

    getSelectionBounds(): SelectionBounds {
        return {
            x: Math.min(this.startPoint.x, this.endPoint.x),
            y: Math.min(this.startPoint.y, this.endPoint.y),
            width: Math.abs(this.endPoint.x - this.startPoint.x),
            height: Math.abs(this.endPoint.y - this.startPoint.y)
        };
    }

    updateSelectionArea() {
        const bounds = this.getSelectionBounds();

        // Use transform for better performance instead of changing left/top
        this.selectionArea.style.transform = `translate(${bounds.x}px, ${bounds.y}px)`;
        this.selectionArea.style.width = bounds.width + 'px';
        this.selectionArea.style.height = bounds.height + 'px';
        this.selectionArea.style.display = 'block';

        // Use requestAnimationFrame for smoother updates during dragging
        if (this.isSelecting && !this.animationFrame) {
            this.animationFrame = requestAnimationFrame(() => {
                this.animationFrame = null;
            });
        }
    }

    async captureSelectedArea(selection: SelectionBounds): Promise<string> {
        console.log('Capturing selected area');

        if (!this.imageElement || !this.imageElement.complete) {
            throw new Error('Screenshot image not ready');
        }

        const { naturalWidth, naturalHeight } = this.imageElement;
        if (naturalWidth === 0 || naturalHeight === 0) {
            throw new Error('Invalid image dimensions');
        }

        // Calculate scaling factors
        const scaleX = naturalWidth / window.innerWidth;
        const scaleY = naturalHeight / window.innerHeight;

        // Scale coordinates to match image resolution
        const scaledSelection = {
            x: Math.max(0, selection.x * scaleX),
            y: Math.max(0, selection.y * scaleY),
            width: Math.min(selection.width * scaleX, naturalWidth),
            height: Math.min(selection.height * scaleY, naturalHeight)
        };

        console.log(`Scaled selection: ${scaledSelection.width}x${scaledSelection.height} at ${scaledSelection.x},${scaledSelection.y}`);

        // Create canvas sized to the source image pixels (not CSS pixels)
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(scaledSelection.width);
        canvas.height = Math.round(scaledSelection.height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            this.imageElement,
            scaledSelection.x, scaledSelection.y, scaledSelection.width, scaledSelection.height,
            0, 0, Math.round(scaledSelection.width), Math.round(scaledSelection.height)
        );

        const dataURL = canvas.toDataURL('image/png', 1.0);

        if (!dataURL || dataURL.length < 1000) {
            throw new Error('Generated image data is too small');
        }

        return dataURL;
    }

    async sendCaptureResult(imageData: string) {
        console.log('Sending capture result to main process');

        if (!window.electron?.capture?.complete) {
            throw new Error('Electron capture API not available');
        }

        await window.electron.capture.complete(imageData);
        console.log('Capture result sent successfully');
    }

    showError(message: string) {
        console.error(message);

        // Remove existing error
        const existingError = document.querySelector('.capture-error');
        if (existingError) {
            existingError.remove();
        }

        const errorElement = document.createElement('div');
        errorElement.className = 'capture-error';
        errorElement.innerHTML = `
      <p>${message}</p>
      <div>
        <button id="close-btn">${this.locale.close}</button>
      </div>
    `;

        document.body.appendChild(errorElement);

        document.getElementById('close-btn')?.addEventListener('click', () => {
            this.reset();
        });
    }
}

// Initialize when DOM is ready
let screenCapture: ScreenCapture;
document.addEventListener('DOMContentLoaded', () => {
    screenCapture = new ScreenCapture();
});
