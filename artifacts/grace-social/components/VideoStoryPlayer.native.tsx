import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

interface Props {
  uri: string;
  paused: boolean;
  muted: boolean;
}

export default function VideoStoryPlayer({ uri, paused, muted }: Props) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = muted;
    if (!paused) p.play();
  });

  useEffect(() => {
    try { if (paused) player.pause(); else player.play(); } catch {}
  }, [paused]);

  useEffect(() => {
    try { player.muted = muted; } catch {}
  }, [muted]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}
