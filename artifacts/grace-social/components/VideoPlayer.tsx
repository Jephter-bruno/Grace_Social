import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface VideoPlayerProps {
  uri: string;
  isActive: boolean;
  muted?: boolean;
  style?: ViewStyle;
  loop?: boolean;
}

export function VideoPlayer({ uri, isActive, muted = true, style, loop = true }: VideoPlayerProps) {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = loop;
    p.muted = muted;
    if (isActive) p.play();
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
      player.currentTime = 0;
    }
  }, [isActive]);

  useEffect(() => {
    player.muted = muted;
  }, [muted]);

  return (
    <VideoView
      player={player}
      style={[styles.video, style]}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
  },
});
