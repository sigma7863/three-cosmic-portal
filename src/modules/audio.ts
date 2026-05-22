/**
 * Audio Reaction Controller for Cosmic Particle Portal Visualizer
 * Connects Web Audio API FFT analyzer or synthesizes ambient sound pulse data.
 */

export class AudioController {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: any = null;
  private isMicActiveState = false;
  private waveBars: NodeListOf<HTMLDivElement>;

  constructor() {
    this.waveBars = document.querySelectorAll('.wave-bar') as NodeListOf<HTMLDivElement>;
  }

  /**
   * Getter to expose current microphone sync status
   */
  public get isMicActive(): boolean {
    return this.isMicActiveState;
  }

  /**
   * Request microphone stream permissions and establish connection nodes
   */
  public async setupAudio(): Promise<boolean> {
    const btn = document.getElementById('btn-audio-reactive');
    if (!btn) return false;

    if (this.isMicActiveState) {
      // Disable active mic sync
      this.isMicActiveState = false;
      btn.innerHTML = '📯 MIC SYNC MODE: OFF';
      btn.classList.remove('active');
      if (this.audioCtx) {
        await this.audioCtx.close();
        this.audioCtx = null;
      }
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64; // Small fast FFT for particles

      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      this.isMicActiveState = true;
      btn.innerHTML = '📯 MIC SYNC MODE: ACTIVE';
      btn.classList.add('active');
      return true;
    } catch (err) {
      alert('マイクのアクセス許可が必要です！マイク入力で共鳴させるため、許可してください。');
      console.error('Mic access denied or unsupported', err);
      return false;
    }
  }

  /**
   * Frame tick calculation. Updates analytical UI indicators and returns normalized frequency pulse.
   */
  public update(time: number, audioPulseScale: number): number {
    let finalPulseVal = 0;

    if (this.isMicActiveState && this.analyser && this.dataArray) {
      // Extract actual microphone volume frequencies
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Average low-mid frequencies representing volume beats
      let sum = 0;
      const binsToAverage = 10;
      for (let i = 0; i < binsToAverage; i++) {
        sum += this.dataArray[i];
        
        // Update HTML diagnostic bars in real-time
        if (this.waveBars[i]) {
          const heightPct = Math.max(10, Math.min(100, (this.dataArray[i] / 255) * 100));
          this.waveBars[i].style.height = `${heightPct}%`;
        }
      }
      const avg = sum / binsToAverage;
      finalPulseVal = avg / 255; // Normalize 0 to 1
    } else {
      // Microphone inactive: Synthesize dummy ambient audio wave frequencies
      finalPulseVal = Math.max(0, Math.sin(time * 6.0) * 0.12 + Math.cos(time * 2.5) * 0.08 + 0.05);
      
      // Animate mock HTML wave columns
      for (let i = 0; i < this.waveBars.length; i++) {
        if (this.waveBars[i]) {
          const mockHeight = 10 + Math.sin(time * 8.0 + i * 0.5) * 20 + Math.cos(time * 3.0 + i) * 15;
          this.waveBars[i].style.height = `${Math.max(10, mockHeight)}%`;
        }
      }
    }

    return finalPulseVal * audioPulseScale;
  }
}
