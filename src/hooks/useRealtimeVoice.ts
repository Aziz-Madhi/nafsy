import { useCallback, useMemo, useRef, useState } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
  MediaStream,
} from 'react-native-webrtc';
import { useTranslation } from '~/hooks/useTranslation';

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
  const consumeTokens = useMutation(api.voiceRealtime.consumeVoiceTokens);
  const { t } = useTranslation();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const eventsDcRef = useRef<RTCDataChannel | null>(null);
  const userSpeakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiActiveResponsesRef = useRef<Set<string>>(new Set());
  const reportedUsageRef = useRef<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);

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
    setMuted(false);
    setUserSpeaking(false);
    setAiSpeaking(false);
    if (userSpeakingTimeoutRef.current) {
      clearTimeout(userSpeakingTimeoutRef.current);
      userSpeakingTimeoutRef.current = null;
    }
    aiActiveResponsesRef.current.clear();
    reportedUsageRef.current.clear();
  }, []);

  const start = useCallback(
    async (opts: StartOptions): Promise<RealtimeStartResult> => {
      setError(null);
      setMuted(false);
      reportedUsageRef.current.clear();
      try {
        if (pcRef.current) {
          const state = pcRef.current.connectionState;
          if (
            state === 'failed' ||
            state === 'closed' ||
            state === 'disconnected'
          ) {
            await stop();
          } else {
            return { started: true };
          }
        }

        // 1) Mint ephemeral token and session config from server
        const conf = await mintToken({
          chatType: opts.chatType,
          voice: opts.voice,
        });
        if (!conf?.client_secret || !conf?.session?.model) {
          throw new Error('Invalid token or session config');
        }

        // 2) Create RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        const scheduleUserSilence = (delayMs: number) => {
          if (userSpeakingTimeoutRef.current) {
            clearTimeout(userSpeakingTimeoutRef.current);
          }
          userSpeakingTimeoutRef.current = setTimeout(() => {
            setUserSpeaking(false);
            userSpeakingTimeoutRef.current = null;
          }, delayMs);
        };

        const UNKNOWN_RESPONSE_KEY = '__unknown_ai__';

        const addAiResponse = (responseId?: string) => {
          const key = responseId ?? UNKNOWN_RESPONSE_KEY;
          const active = aiActiveResponsesRef.current;
          if (!active.has(key)) {
            active.add(key);
            setAiSpeaking(true);
          }
        };

        const removeAiResponse = (responseId?: string) => {
          const key = responseId ?? UNKNOWN_RESPONSE_KEY;
          const active = aiActiveResponsesRef.current;
          if (active.delete(key) && active.size === 0) {
            setAiSpeaking(false);
          }
        };

        const extractResponseId = (payload: any): string | undefined => {
          return (
            payload?.response_id ??
            payload?.responseId ??
            payload?.response?.id ??
            payload?.response?.response_id ??
            payload?.output_item?.response_id ??
            payload?.item?.response_id ??
            payload?.id ??
            undefined
          );
        };

        const isAudioOutputItem = (payload: any): boolean => {
          const typeField =
            payload?.item?.type ??
            payload?.output_item?.type ??
            payload?.content_part?.type ??
            payload?.item_type ??
            payload?.mode;
          return typeof typeField === 'string' && typeField.includes('audio');
        };

        const bindEventsChannel = (channel: RTCDataChannel) => {
          eventsDcRef.current = channel;

          channel.onopen = () => {
            try {
              if (conf.prompt) {
                const payload = {
                  type: 'session.update',
                  session: {
                    type: 'realtime',
                    prompt: conf.prompt,
                  },
                } as any;
                channel.send(JSON.stringify(payload));
              }
              if (conf.session?.audio) {
                const upd = {
                  type: 'session.update',
                  session: {
                    type: 'realtime',
                    audio: conf.session.audio,
                  },
                } as any;
                channel.send(JSON.stringify(upd));
              }
            } catch (err) {
              console.warn('[voice] failed to send session.update', err);
            }
          };

          channel.onmessage = (event) => {
            try {
              const payload = JSON.parse(event.data);
              const type: string | undefined = payload?.type;
              if (!type) return;

              if (type === 'input_audio_buffer.speech_started') {
                setUserSpeaking(true);
                scheduleUserSilence(2000);
                return;
              }

              if (type === 'input_audio_buffer.speech_stopped') {
                setUserSpeaking(false);
                if (userSpeakingTimeoutRef.current) {
                  clearTimeout(userSpeakingTimeoutRef.current);
                  userSpeakingTimeoutRef.current = null;
                }
                return;
              }

              if (type === 'response.done') {
                const usage = payload?.response?.usage;
                if (!usage) return;

                const usageKey =
                  extractResponseId(payload) ??
                  payload?.response?.id ??
                  `usage-${Date.now()}`;
                if (reportedUsageRef.current.has(usageKey)) return;
                reportedUsageRef.current.add(usageKey);

                const inputDetails = usage?.input_token_details || {};
                const outputDetails = usage?.output_token_details || {};

                const billableTextIn = Math.max(
                  (inputDetails.text_tokens ?? 0) -
                    (inputDetails.cached_tokens ?? 0),
                  0
                );
                const billableTextOut = outputDetails.text_tokens ?? 0;
                const billableAudioIn = inputDetails.audio_tokens ?? 0;
                const billableAudioOut = outputDetails.audio_tokens ?? 0;

                const totalTokens = Math.max(
                  0,
                  Math.floor(
                    billableTextIn +
                      billableTextOut +
                      billableAudioIn +
                      billableAudioOut
                  )
                );

                if (totalTokens <= 0) return;

                const usagePayload: Record<string, any> = {};
                if (typeof usage.total_tokens === 'number') {
                  usagePayload.total_tokens = usage.total_tokens;
                }
                if (typeof usage.input_tokens === 'number') {
                  usagePayload.input_tokens = usage.input_tokens;
                }
                if (typeof usage.output_tokens === 'number') {
                  usagePayload.output_tokens = usage.output_tokens;
                }

                const inputDetailsPayload: Record<string, any> = {};
                if (typeof inputDetails.text_tokens === 'number') {
                  inputDetailsPayload.text_tokens = inputDetails.text_tokens;
                }
                if (typeof inputDetails.audio_tokens === 'number') {
                  inputDetailsPayload.audio_tokens = inputDetails.audio_tokens;
                }
                if (typeof inputDetails.cached_tokens === 'number') {
                  inputDetailsPayload.cached_tokens =
                    inputDetails.cached_tokens;
                }
                if (Object.keys(inputDetailsPayload).length > 0) {
                  usagePayload.input_token_details = inputDetailsPayload;
                }

                const outputDetailsPayload: Record<string, any> = {};
                if (typeof outputDetails.text_tokens === 'number') {
                  outputDetailsPayload.text_tokens = outputDetails.text_tokens;
                }
                if (typeof outputDetails.audio_tokens === 'number') {
                  outputDetailsPayload.audio_tokens =
                    outputDetails.audio_tokens;
                }
                if (Object.keys(outputDetailsPayload).length > 0) {
                  usagePayload.output_token_details = outputDetailsPayload;
                }

                consumeTokens({
                  totalTokens,
                  responseId: usageKey,
                  usage:
                    Object.keys(usagePayload).length > 0
                      ? usagePayload
                      : undefined,
                  billable: {
                    textIn: billableTextIn,
                    textOut: billableTextOut,
                    audioIn: billableAudioIn,
                    audioOut: billableAudioOut,
                    total: totalTokens,
                  },
                })
                  .then((result) => {
                    if (result && !result.ok) {
                      setError(
                        t(
                          'voice.limit.monthlyReached',
                          "You've reached your voice monthly limit."
                        )
                      );
                      stop().catch(() => {});
                    }
                  })
                  .catch((err) => {
                    console.warn('[voice] failed to record usage', err);
                    setError(
                      t(
                        'voice.limit.monthlyReached',
                        "You've reached your voice monthly limit."
                      )
                    );
                    stop().catch(() => {});
                  });
                removeAiResponse(usageKey);
                return;
              }

              if (type === 'response.output_item.created') {
                if (isAudioOutputItem(payload)) {
                  addAiResponse(extractResponseId(payload));
                }
                return;
              }

              if (type === 'response.content_part.added') {
                if (isAudioOutputItem(payload)) {
                  addAiResponse(extractResponseId(payload));
                }
                return;
              }

              if (type === 'response.created' || type === 'response.delta') {
                addAiResponse(extractResponseId(payload));
                return;
              }

              if (type.startsWith('response.output_audio.')) {
                const responseId = extractResponseId(payload);

                if (
                  type.endsWith('.delta') ||
                  type.endsWith('.start') ||
                  type.endsWith('.started')
                ) {
                  addAiResponse(responseId);
                  return;
                }

                if (
                  type.endsWith('.done') ||
                  type.endsWith('.completed') ||
                  type.endsWith('.complete') ||
                  type.endsWith('.stopped')
                ) {
                  // Leave response active until top-level completion events fire.
                  return;
                }

                return;
              }

              if (type.startsWith('response.audio.')) {
                const responseId = extractResponseId(payload);

                if (
                  type.endsWith('.delta') ||
                  type.endsWith('.start') ||
                  type.endsWith('.started')
                ) {
                  addAiResponse(responseId);
                  return;
                }

                if (
                  type.endsWith('.done') ||
                  type.endsWith('.completed') ||
                  type.endsWith('.complete') ||
                  type.endsWith('.stopped')
                ) {
                  // wait for top-level response completion
                  return;
                }

                return;
              }

              if (
                type === 'response.completed' ||
                type === 'response.finished' ||
                type === 'response.done' ||
                type === 'response.failed' ||
                type === 'response.cancelled'
              ) {
                removeAiResponse(extractResponseId(payload));
                return;
              }
            } catch {
              // ignore malformed payloads
            }
          };

          channel.onclose = () => {
            if (eventsDcRef.current === channel) {
              eventsDcRef.current = null;
            }
          };
        };

        // 3) Create events data channel early; OpenAI also creates one, so handle both
        const dc = pc.createDataChannel('oai-events');
        bindEventsChannel(dc);

        pc.ondatachannel = (event) => {
          const channel = event.channel;
          if (channel?.label === 'oai-events') {
            bindEventsChannel(channel);
          }
        };

        // 4) Capture microphone and add audio track
        const mic = await mediaDevices.getUserMedia({ audio: true });
        micRef.current = mic;
        mic.getTracks().forEach((t) => pc.addTrack(t, mic));

        // 5) Handle remote audio tracks (React Native plays audio automatically)
        pc.ontrack = (evt) => {
          console.log(
            '[voice] remote track received',
            evt.streams?.[0]?.id ?? 'unknown'
          );
          // evt.streams[0] contains remote audio; nothing else required for RN
        };

        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          console.log('[voice] connection state:', state);
          if (state === 'connected') {
            setIsActive(true);
          }
          if (
            state === 'disconnected' ||
            state === 'failed' ||
            state === 'closed'
          ) {
            setIsActive(false);
            if (pcRef.current === pc) {
              stop().catch(() => {});
            }
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

        return { started: true };
      } catch (e: any) {
        const raw =
          typeof e?.message === 'string' ? e.message : String(e ?? '');
        const isLimit = raw.includes('VOICE_USAGE_LIMIT_REACHED');
        const msg = isLimit
          ? t(
              'voice.limit.monthlyReached',
              "You've reached your voice monthly limit."
            )
          : raw || t('voice.errors.sessionFailed', 'Voice session failed');
        setError(msg);
        setIsActive(false);
        setMuted(false);
        setUserSpeaking(false);
        setAiSpeaking(false);
        try {
          await stop();
        } catch {}
        return { started: false, error: msg };
      }
    },
    [consumeTokens, mintToken, stop, t]
  );
  const toggleMute = useCallback(() => {
    const next = !muted;
    try {
      micRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
    } catch {}
    setMuted(next);
  }, [muted]);

  return useMemo(
    () => ({
      isActive,
      error,
      muted,
      userSpeaking,
      aiSpeaking,
      start,
      stop,
      toggleMute,
    }),
    [isActive, error, muted, userSpeaking, aiSpeaking, start, stop, toggleMute]
  );
}
