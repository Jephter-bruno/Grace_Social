import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  uri: string;
  paused: boolean;
  muted: boolean;
}

// Video playback via expo-video is native-only. On web we render a
// tasteful gradient placeholder so the viewer still opens without crashing.
export default function VideoStoryPlayer({ uri: _uri, paused: _p, muted: _m }: Props) {
  return (
    <LinearGradient colors={['#0D1B2A', '#1B263B']} style={StyleSheet.absoluteFill}>
      <View style={styles.center}>
        <Feather name="video" size={40} color="rgba(255,255,255,0.25)" />
        <Text style={styles.label}>Video preview on device</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
