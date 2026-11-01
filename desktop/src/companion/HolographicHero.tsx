import { HOLO_AVATAR_CORTANA, HOLO_AVATAR_IRIDESCENT } from './avatarAssets';
import { useState, useEffect, useRef } from 'react';
import './HolographicHero.css';

export type CompanionState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface HolographicHeroProps {
  state?: CompanionState;
  isDocked?: boolean;
  onToggleDock?: () => void;
  onClose?: () => void;
  latestReply?: string;
  onSendPrompt?: (text: string) => void;
}

export default function HolographicHero({
  state = 'idle',
  isDocked = false,
  onToggleDock,
  onClose,
  latestReply,
  onSendPrompt,
}: HolographicHeroProps) {
  // Interactive Human Gaze Tracking (Head & Eye orientation following cursor)
  const [gaze, setGaze] = useState({ rotY: 0, rotX: 0, eyeX: 0, eyeY: 0 });

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const deltaX = (e.clientX - centerX) / centerX; // -1 to 1
      const deltaY = (e.clientY - centerY) / centerY; // -1 to 1

      // Gentle organic human angles (not stiff mechanical robot snap)
      const rotY = Math.max(-12, Math.min(12, deltaX * 12));
      const rotX = Math.max(-8, Math.min(8, -deltaY * 8));
      const eyeX = Math.max(-4, Math.min(4, deltaX * 4));
      const eyeY = Math.max(-3, Math.min(3, deltaY * 3));

      setGaze({ rotY, rotX, eyeX, eyeY });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);
  // Avatars switchable: cortana (blue neon wireframe) vs iridescent (anime cyber-glow)
  const [activeModel, setActiveModel] = useState<'cortana' | 'iridescent'>('cortana');
  // Dynamic Animated Scenario: matrix (cyber code rain), aurora (cosmic nebula & stars), or minimal (projector only)
  const [activeTheme, setActiveTheme] = useState<'matrix' | 'aurora' | 'minimal'>('matrix');
  const [internalState, setInternalState] = useState<CompanionState>(state);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Digital Matrix Rain Animation Engine
  useEffect(() => {
    if (activeTheme !== 'matrix') return;
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resizeCanvas();

    const chars = '0123456789ABCDEFΣΠΩΨΔΞλμθφSUPREMEAI';
    const fontSize = 13;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));

    const drawMatrix = () => {
      ctx.fillStyle = 'rgba(2, 4, 8, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Leading bright cyan spark, trailed by neon blue-green
        if (Math.random() > 0.85) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = '#00c3ff';
          ctx.shadowColor = '#0066ff';
          ctx.shadowBlur = 4;
        }

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(drawMatrix);
    };

    drawMatrix();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [activeTheme]);

  // Drag state for floating mode
  const [position, setPosition] = useState({ x: 30, y: window.innerHeight - 480 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setInternalState(state);
  }, [state]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDocked) return;
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const newX = Math.max(10, Math.min(window.innerWidth - 340, e.clientX - dragOffsetRef.current.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 460, e.clientY - dragOffsetRef.current.y));
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  // Setup Web Speech recognition if supported in WebView
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setInternalState('listening');
      };

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setTranscript(text);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInternalState('thinking');
        if (transcript.trim() && onSendPrompt) {
          onSendPrompt(transcript.trim());
        } else {
          setInternalState('idle');
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setInternalState('idle');
      };

      recognitionRef.current = recognition;
    }
  }, [transcript, onSendPrompt]);

  const handleMicToggle = () => {
    if (!recognitionRef.current) {
      if (!isListening) {
        setIsListening(true);
        setInternalState('listening');
        setTranscript('Listening to your voice command...');
        setTimeout(() => {
          setIsListening(false);
          setInternalState('thinking');
          setTranscript('Analyzing system diagnostics...');
          setTimeout(() => {
            setInternalState('speaking');
          }, 1200);
        }, 2200);
      } else {
        setIsListening(false);
        setInternalState('idle');
      }
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const avatarSrc = activeModel === 'cortana' ? HOLO_AVATAR_CORTANA : HOLO_AVATAR_IRIDESCENT;

  const floatingStyle: React.CSSProperties = isDocked
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
      }
    : {};

  return (
    <div
      style={floatingStyle}
      className={`holo-container ${
        isDocked ? 'holo-container--floating' : 'holo-container--immersive'
      }`}
    >
      {/* Background Animated Scenarios (Matrix Rain or Cosmic Aurora Nebula) */}
      {activeTheme === 'matrix' && (
        <canvas ref={matrixCanvasRef} className="holo-matrix-canvas" />
      )}

      {activeTheme === 'aurora' && (
        <>
          <div className="holo-nebula-scenery" />
          <div className="holo-nebula-stars" />
        </>
      )}

      {/* Background Cyber Floor Projector (visible in 90% full immersive view) */}
      {!isDocked && (
        <>
          <div className="holo-projector-floor" />
          <div className="holo-projector-rings" />
          <div className="holo-beam-sweep" />
        </>
      )}

      {/* Floating Header / Drag Handle */}
      <div
        className={isDocked ? 'holo-drag-handle' : 'holo-controls-bar'}
        onMouseDown={handleMouseDown}
        title={isDocked ? 'Click & Drag to move hologram anywhere' : ''}
      >
        <div className="holo-badge">
          <span className="holo-status-dot" />
          <span>{isDocked ? '⠿ DRAG ME' : `HOLO-AI // ${internalState.toUpperCase()}`}</span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Backdrop Scenery Animation Switcher */}
          <button
            className="holo-btn-action"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTheme((t) => (t === 'matrix' ? 'aurora' : t === 'aurora' ? 'minimal' : 'matrix'));
            }}
            title="Switch Background Animation Scenario (Matrix / Aurora Nebula / Clean)"
          >
            {activeTheme === 'matrix' ? '💻 Matrix' : activeTheme === 'aurora' ? '🌌 Nebula' : '🌀 Clean'}
          </button>

          {/* Avatar Switcher */}
          <button
            className="holo-btn-action"
            onClick={(e) => {
              e.stopPropagation();
              setActiveModel((m) => (m === 'cortana' ? 'iridescent' : 'cortana'));
            }}
            title="Switch Holographic Model"
          >
            {activeModel === 'cortana' ? '⚡ Cyber' : '✨ Glow'}
          </button>

          {/* Dock / Expand Toggle */}
          {onToggleDock && (
            <button
              className="holo-btn-action"
              onClick={(e) => {
                e.stopPropagation();
                onToggleDock();
              }}
            >
              {isDocked ? '⤢ 90%' : '◨ Mini'}
            </button>
          )}

          {/* Close */}
          {onClose && (
            <button
              className="holo-btn-action"
              style={{ color: '#ff7b7b' }}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Holographic Avatar Stage with Human Gaze & Eye/Lip Sync */}
      <div
        className={`holo-avatar-wrapper holo-avatar-wrapper--${internalState}`}
        style={{
          transform: `perspective(1000px) rotateY(${gaze.rotY}deg) rotateX(${gaze.rotX}deg)`,
        }}
      >
        <img src={avatarSrc} alt="Holographic AI Companion" className="holo-avatar-img" />

        {/* Dynamic Human Eye Tracking Overlay */}
        <div className="holo-eyes-tracker">
          <div
            className="holo-eye"
            style={{ transform: `translate(${gaze.eyeX}px, ${gaze.eyeY}px)` }}
          />
          <div
            className="holo-eye"
            style={{ transform: `translate(${gaze.eyeX}px, ${gaze.eyeY}px)` }}
          />
        </div>

        {/* Dynamic Human Lip-Sync Overlay */}
        <div className="holo-lips-sync" />

        <div className="holo-scanlines" />
      </div>

      {/* Bottom Dialogue & Voice Controls */}
      <div className="holo-speech-hud">
        <div className="holo-dialogue-bubble">
          {latestReply ||
            transcript ||
            (internalState === 'listening'
              ? 'Listening... Speak your command clearly.'
              : internalState === 'thinking'
              ? 'Synthesizing neural telemetry...'
              : internalState === 'speaking'
              ? 'Broadcasting response across system channels.'
              : 'SupremeAI Neural Hologram online. Tap the mic or type.')}
        </div>

        {/* Microphone Push-to-Talk */}
        <button
          className={`holo-mic-btn ${isListening ? 'holo-mic-btn--active' : ''}`}
          onClick={handleMicToggle}
          title="Push to Talk"
        >
          {isListening ? (
            <span style={{ fontSize: '18px' }}>⏹</span>
          ) : (
            <span style={{ fontSize: '20px' }}>🎙️</span>
          )}
        </button>
      </div>
    </div>
  );
}
