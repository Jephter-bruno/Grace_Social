import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface VideoPlayerProps {
  uri: string;
  isActive: boolean;
  muted?: boolean;
  style?: ViewStyle;
  loop?: boolean;
}

export function VideoPlayer({ uri, isActive, muted = true, style, loop = true }: VideoPlayerProps) {
  const videoRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  return (
    <View style={[styles.container, style]}>
      {React.createElement('video', {
        ref: videoRef,
        src: uri,
        muted: true,
        loop,
        playsInline: true,
        autoPlay: isActive,
        style: {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          backgroundColor: '#000',
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});
