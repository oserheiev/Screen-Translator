import './capture.css';
import { ElectronAPI } from '../types';

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

class ScreenCapture {
    private isSelecting: boolean = false;
    private startPoint: Point = { x: 0, y: 0 };
    private endPoint: Point = { x: 0, y: 0 };
    private screenshotDataURL: string | null = null;
    private imageElement: HTMLImageElement | null = null;
    private retryCount: number = 0;
    private maxRetries: number = 3;
    private currentDisplay: Electron.Display | null = null;
    private allDisplays: Electron.Display[] = [];
    private displayOffset: Point = { x: 0, y: 0 };
    private cachedSources: Electron.DesktopCapturerSource[] | null = null;
    private cachedScreens: Electron.Display[] | null = null;
    private animationFrame: number | null = null;

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
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.init();
    }

    async init() {
        try {
            console.log('Initializing optimized multi-monitor screen capture');

            // Start display detection and screenshot capture in parallel for better performance
            await Promise.all([
                this.detectCurrentDisplay(),
                this.preloadScreenshotCapture()
            ]);

            // Setup UI and events immediately
            this.setupEventListeners();

            // Capture and display screenshot
            await this.captureAndDisplayScreenshot();

            this.displayInstructions();
            document.body.style.cursor = 'crosshair';

            console.log('Optimized multi-monitor screen capture initialized successfully');
        } catch (error) {
            console.error('Failed to initialize screen capture:', error);
            this.showError(`Failed to initialize screen capture: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async preloadScreenshotCapture() {
        // Pre-fetch sources and screens for faster capture
        try {
            const [sources, screens] = await Promise.all([
                this.getSources(),
                this.getScreens()
            ]);
            this.cachedSources = sources;
            this.cachedScreens = screens;
        } catch (error) {
            console.warn('Failed to preload capture data:', error);
        }
    }

    async captureAndDisplayScreenshot() {
        await this.captureScreenshot();
        this.displayScreenshot();
    }

    async detectCurrentDisplay() {
        console.log('Detecting current display for multi-monitor setup');

        // Use cached screens if available for better performance
        this.allDisplays = this.cachedScreens || await this.getScreens();
        console.log(`Found ${this.allDisplays.length} displays:`, this.allDisplays.map(d => ({ id: d.id, bounds: d.bounds })));

        // Determine which display this capture window is on
        const windowBounds = {
            x: window.screenX,
            y: window.screenY,
            width: window.innerWidth,
            height: window.innerHeight
        };

        console.log(`Window bounds: ${JSON.stringify(windowBounds)}`);

        // Find the display that contains this window
        this.currentDisplay = this.allDisplays.find(display =>
            windowBounds.x >= display.bounds.x &&
            windowBounds.x < display.bounds.x + display.bounds.width &&
            windowBounds.y >= display.bounds.y &&
            windowBounds.y < display.bounds.y + display.bounds.height
        ) || null;

        if (this.currentDisplay) {
            console.log(`Current display: ${this.currentDisplay.id}, bounds: ${JSON.stringify(this.currentDisplay.bounds)}`);
            // Calculate offset for coordinate mapping
            this.displayOffset = {
                x: this.currentDisplay.bounds.x,
                y: this.currentDisplay.bounds.y
            };
        } else {
            console.warn('Could not determine current display, using primary');
            // @ts-ignore - Electron.Display type might not match exactly with what we get back if detection fails
            this.currentDisplay = this.allDisplays.find((d: any) => d.primary) || this.allDisplays[0];
            this.displayOffset = { x: 0, y: 0 };
        }
    }

    async captureScreenshot() {
        console.log('Capturing screenshot for current display');

        // Use cached sources if available for better performance
        const sources = this.cachedSources || await this.getSources();
        const targetSource = this.findTargetSourceForCurrentDisplay(sources);

        console.log(`Using source: ${targetSource.name} (${targetSource.id}) for display ${this.currentDisplay?.id}`);

        const stream = await this.getMediaStream(targetSource);
        const dataURL = await this.streamToDataURL(stream);

        this.screenshotDataURL = dataURL;
        this.cleanupStream(stream);

        console.log('Screenshot captured successfully for current display');
    }

    async getSources(): Promise<Electron.DesktopCapturerSource[]> {
        const sources = await window.electron.capture.getSources();
        if (!sources || sources.length === 0) {
            throw new Error('No screen sources available');
        }
        return sources;
    }

    async getScreens(): Promise<Electron.Display[]> {
        const screens = await window.electron.capture.getScreens();
        console.log(`Found ${screens ? screens.length : 0} screens`);
        return screens || [];
    }

    findTargetSourceForCurrentDisplay(sources: Electron.DesktopCapturerSource[]): Electron.DesktopCapturerSource {
        const screenSources = sources.filter((source: any) => source.id.startsWith('screen:'));
        let targetSource = screenSources[0]; // Default to first screen source

        if (this.currentDisplay && screenSources.length > 0) {
            console.log(`Looking for source matching display ${this.currentDisplay.id}`);

            // Try multiple matching strategies for different platforms
            const matchingSource = screenSources.find((source: any) => {
                // Strategy 1: Direct ID match
                if (source.id.includes(this.currentDisplay!.id.toString())) {
                    console.log(`Found source by ID match: ${source.id}`);
                    return true;
                }

                // Strategy 2: Display ID format match
                // @ts-ignore - Check for display_id property which might exist
                if (source.display_id === `screen:${this.currentDisplay!.id}:0`) {
                    // @ts-ignore
                    console.log(`Found source by display_id match: ${source.display_id}`);
                    return true;
                }

                // Strategy 3: Name-based matching (for some platforms)
                if (source.name && source.name.includes(this.currentDisplay!.id.toString())) {
                    console.log(`Found source by name match: ${source.name}`);
                    return true;
                }

                return false;
            });

            if (matchingSource) {
                targetSource = matchingSource;
                console.log(`Successfully matched source for display ${this.currentDisplay.id}`);
            } else {
                console.warn(`No matching source found for display ${this.currentDisplay.id}, using default`);
            }
        }

        return targetSource;
    }

    async getMediaStream(source: Electron.DesktopCapturerSource): Promise<MediaStream> {
        // Use proper Electron desktop capture constraints format
        const constraints: any = {
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: source.id,
                    minWidth: 1280,
                    maxWidth: 3840,
                    minHeight: 720,
                    maxHeight: 2160,
                    maxFrameRate: 1
                }
            }
        };

        console.log('Getting media stream with Electron desktop constraints:', constraints);

        // Add validation before getUserMedia call
        if (!source || !source.id) {
            throw new Error('Invalid screen source provided');
        }

        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            console.error('Failed to get media stream:', error);
            throw new Error(`Screen capture failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async streamToDataURL(stream: MediaStream): Promise<string> {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.style.display = 'none';

            const timeout = setTimeout(() => {
                this.cleanupVideo(video, stream);
                reject(new Error('Video loading timeout'));
            }, 10000);

            video.onloadedmetadata = async () => {
                try {
                    clearTimeout(timeout);
                    await video.play();

                    // Wait for first frame
                    await new Promise(resolve => setTimeout(resolve, 200));

                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        throw new Error('Failed to get canvas context');
                    }

                    ctx.drawImage(video, 0, 0);
                    const dataURL = canvas.toDataURL('image/png', 1.0);

                    this.cleanupVideo(video, stream);
                    resolve(dataURL);
                } catch (error) {
                    this.cleanupVideo(video, stream);
                    reject(error);
                }
            };

            video.onerror = () => {
                clearTimeout(timeout);
                this.cleanupVideo(video, stream);
                reject(new Error('Video loading failed'));
            };

            video.srcObject = stream;
        });
    }

    cleanupVideo(video: HTMLVideoElement, stream: MediaStream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (video && video.parentNode) {
            video.remove();
        }
    }

    cleanupStream(stream: MediaStream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }

    displayScreenshot() {
        if (!this.screenshotDataURL) {
            throw new Error('No screenshot data available');
        }

        this.imageElement = document.createElement('img');
        this.imageElement.className = 'screenshot-background';
        this.imageElement.src = this.screenshotDataURL;
        document.body.appendChild(this.imageElement);
    }

    setupEventListeners() {
        console.log('Setting up optimized event listeners');

        // Use pre-bound event handlers for better performance
        this.overlay.addEventListener('mousedown', this.handleMouseDown as EventListener, { passive: false });
        this.overlay.addEventListener('mousemove', this.handleMouseMove as EventListener, { passive: true });
        this.overlay.addEventListener('mouseup', this.handleMouseUp as EventListener, { passive: false });
        document.addEventListener('keydown', this.handleKeyDown, { passive: false });

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
        const displayInfo = this.currentDisplay ?
            ` (Display ${this.currentDisplay.id})` : '';
        this.instructions.textContent = `Click and drag to select an area${displayInfo}. Press ESC to cancel.`;

        // Make instructions more visible with better styling
        this.instructions.style.opacity = '1';
        this.instructions.style.transition = 'opacity 0.2s ease-in-out';
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

    async handleMouseUp(e: MouseEvent) {
        const globalCoords = this.localToGlobalCoordinates(e.clientX, e.clientY);
        console.log(`Mouse up at local: ${e.clientX},${e.clientY}, global: ${globalCoords.x},${globalCoords.y}`);

        if (!this.isSelecting) return;
        this.isSelecting = false;

        const selection = this.getSelectionBounds();
        const globalSelection = this.getGlobalSelectionBounds();
        console.log(`Local selection: ${selection.width}x${selection.height} at ${selection.x},${selection.y}`);
        console.log(`Global selection: ${globalSelection.width}x${globalSelection.height} at ${globalSelection.x},${globalSelection.y}`);

        if (selection.width < 10 || selection.height < 10) {
            console.log('Selection too small, ignoring');
            this.selectionArea.style.display = 'none';
            return;
        }

        try {
            this.instructions.textContent = 'Processing capture...';
            const imageData = await this.captureSelectedArea(selection);
            await this.sendCaptureResult(imageData);
        } catch (error) {
            console.error('Capture failed:', error);
            this.showError(`Capture failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            this.cleanup();
            window.close();
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

        // Create high-quality canvas
        const pixelRatio = window.devicePixelRatio || 1;
        const canvas = document.createElement('canvas');
        canvas.width = selection.width * pixelRatio;
        canvas.height = selection.height * pixelRatio;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Configure high-quality rendering
        ctx.scale(pixelRatio, pixelRatio);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the selected area
        ctx.drawImage(
            this.imageElement,
            scaledSelection.x, scaledSelection.y, scaledSelection.width, scaledSelection.height,
            0, 0, selection.width, selection.height
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
        <button id="close-btn">Close</button>
        <button id="retry-btn">Try Again</button>
      </div>
    `;

        document.body.appendChild(errorElement);

        // Add event listeners
        document.getElementById('close-btn')?.addEventListener('click', () => window.close());
        document.getElementById('retry-btn')?.addEventListener('click', () => this.retry());
    }

    async retry() {
        if (this.retryCount >= this.maxRetries) {
            this.showError('Maximum retry attempts reached. Please close and try again.');
            return;
        }

        this.retryCount++;
        console.log(`Retrying capture (attempt ${this.retryCount}/${this.maxRetries})`);

        // Remove error message
        const errorElement = document.querySelector('.capture-error');
        if (errorElement) {
            errorElement.remove();
        }

        // Reset state
        this.cleanup();
        this.instructions.textContent = 'Initializing screen capture...';

        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            await this.init();
        } catch (error) {
            this.showError(`Retry failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    cleanup() {
        if (this.imageElement) {
            this.imageElement.remove();
            this.imageElement = null;
        }
        this.screenshotDataURL = null;
        this.isSelecting = false;
    }
}

// Initialize when DOM is ready
let screenCapture: ScreenCapture;
document.addEventListener('DOMContentLoaded', () => {
    screenCapture = new ScreenCapture();
});
