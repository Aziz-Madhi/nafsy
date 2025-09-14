import { useCallback, useMemo, useRef, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
  MediaStream,
} from 'react-native-webrtc';

type ChatTypeServer = 'main' | 'vent' | 'companion';

interface StartOptions {
  chatType: ChatTypeServer;
  voice?: string; // optional override; server uses default otherwise
}

interface RealtimeStartResult {
  started: boolean;
  error?: string;
}

export function useRealtimeVoice() {
  const mintToken = useAction(api.chat.mintRealtimeClientSecret);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const eventsDcRef = useRef<RTCDataChannel | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (opts: StartOptions): Promise<RealtimeStartResult> => {
      setError(null);
      try {
        if (pcRef.current) {
          // Already active
          return { started: true };
        }

        // 1) Mint ephemeral token and session config from server
        const conf = await mintToken({ chatType: opts.chatType, voice: opts.voice });
        if (!conf?.client_secret || !conf?.session?.model) {
          throw new Error('Invalid token or session config');
        }

        // 2) Create RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        // 3) Create events data channel early so it exists by the time the call starts
        const dc = pc.createDataChannel('oai-events');
        eventsDcRef.current = dc;
        dc.onopen = () => {
          // Apply prompt reference after connection if provided by server
          try {
            if (conf.prompt) {
              const payload = {
                type: 'session.update',
                session: {
                  type: 'realtime',
                  // GA: prompt refs may be supported; server also injected inline instructions when applicable
                  prompt: conf.prompt,
                },
              } as any;
              dc.send(JSON.stringify(payload));
            }
          } catch {}
        };

        // 4) Capture microphone and add audio track
        const mic = await mediaDevices.getUserMedia({ audio: true });
        micRef.current = mic;
        mic.getTracks().forEach((t) => pc.addTrack(t, mic));

        // 5) Handle remote audio tracks (React Native plays audio automatically)
        pc.ontrack = (evt) => {
          // evt.streams[0] contains remote audio; nothing else required for RN
          // If needed later, integrate audio routing controls here.
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') setIsActive(true);
          if (
            pc.connectionState === 'disconnected' ||
            pc.connectionState === 'failed' ||
            pc.connectionState === 'closed'
          ) {
            setIsActive(false);
          }
        };

        // 6) Create an SDP offer and send to OpenAI Realtime Calls API
        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        await pc.setLocalDescription(offer);

        const sdpResponse = await fetch(
          `https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(
            conf.session.model
          )}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${conf.client_secret}`,
              'Content-Type': 'application/sdp',
            },
            body: offer.sdp || '',
          }
        );

        if (!sdpResponse.ok) {
          const txt = await sdpResponse.text().catch(() => '');
          throw new Error(`SDP exchange failed: ${sdpResponse.status} ${txt}`);
        }

        const answerSdp = await sdpResponse.text();
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: answerSdp })
        );

        // 7) Optionally update session voice/instructions (server already set session defaults on the secret)
        if (dc.readyState === 'open') {
          try {
            const upd = {
              type: 'session.update',
              session: {
                type: 'realtime',
                audio: conf.session?.audio,
                // instructions are already set server-side for inline prompts
              },
            } as any;
            dc.send(JSON.stringify(upd));
          } catch {}
        }

        return { started: true };
      } catch (e: any) {
        const msg = e?.message || 'Voice session failed';
        setError(msg);
        // Clean up on failure
        try {
          await stop();
        } catch {}
        return { started: false, error: msg };
      }
    },
    [mintToken]
  );

  const stop = useCallback(async () => {
    try {
      eventsDcRef.current?.close();
    } catch {}
    eventsDcRef.current = null;

    try {
      micRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    micRef.current = null;

    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    setIsActive(false);
  }, []);

  return useMemo(
    () => ({ isActive, error, start, stop }),
    [isActive, error, start, stop]
  );
}

