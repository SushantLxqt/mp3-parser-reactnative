import React, { useState } from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { useMusic } from '../context/MusicContext';

const formatTime = (seconds = 0) => {
  const safe = Math.floor(Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;

  return `${minutes}:${String(remaining).padStart(2, '0')}`;
};

export default function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    togglePlayback,
    nextTrack,
    previousTrack,
    toggleRepeat,
    seekTo,
    stopPlayback,
  } = useMusic();

  const [barWidth, setBarWidth] = useState(1);

  if (!currentSong) return null;

  const progress = duration > 0
    ? Math.min(1, currentTime / duration)
    : 0;

  const repeatLabel = {
    off: '↻',
    all: '↻',
    one: '↻¹',
  }[repeatMode];

  const handleSeek = (event) => {
    if (!duration || !barWidth) return;

    const x = Math.max(
      0,
      Math.min(event.nativeEvent.locationX, barWidth)
    );

    seekTo((x / barWidth) * duration);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.artwork}>
          <Text style={styles.musicIcon}>♫</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.songName} numberOfLines={1}>
            {currentSong.name}
          </Text>

          <Text style={styles.artist} numberOfLines={1}>
            {currentSong.artist || 'Local Music'}
          </Text>
        </View>

        <Pressable onPress={stopPlayback} style={styles.close}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>

      <View style={styles.progressSection}>
        <Pressable
          style={styles.seekTrack}
          onLayout={(event) => {
            setBarWidth(event.nativeEvent.layout.width);
          }}
          onPress={handleSeek}
        >
          <View
            style={[
              styles.seekFill,
              { width: `${progress * 100}%` },
            ]}
          />
          <View
            style={[
              styles.seekThumb,
              { left: `${progress * 100}%` },
            ]}
          />
        </Pressable>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>
            {formatTime(currentTime)}
          </Text>

          <Text style={styles.timeText}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={toggleRepeat} style={styles.sideControl}>
          <Text
            style={[
              styles.repeatText,
              repeatMode !== 'off' && styles.activeControl,
            ]}
          >
            {repeatLabel}
          </Text>
        </Pressable>

        <Pressable onPress={previousTrack} style={styles.control}>
          <Text style={styles.controlText}>|◀</Text>
        </Pressable>

        <Pressable
          onPress={togglePlayback}
          style={styles.playButton}
        >
          <Text style={styles.playText}>
            {isPlaying ? 'Ⅱ' : '▶'}
          </Text>
        </Pressable>

        <Pressable onPress={nextTrack} style={styles.control}>
          <Text style={styles.controlText}>▶|</Text>
        </Pressable>

        <View style={styles.sideControl}>
          <Text style={styles.queueText}>♫</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 85,
    left: 12,
    right: 12,
    backgroundColor: '#202020',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    elevation: 15,
    zIndex: 999,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  artwork: {
    width: 42,
    height: 42,
    backgroundColor: '#164D30',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  musicIcon: {
    fontSize: 26,
    color: '#1DB954',
  },

  info: {
    flex: 1,
    marginLeft: 11,
  },

  songName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },

  artist: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 4,
  },

  close: {
    padding: 6,
  },

  closeText: {
    color: '#aaa',
    fontSize: 25,
  },

  progressSection: {
    marginTop: 13,
  },

  seekTrack: {
    height: 14,
    justifyContent: 'center',
    backgroundColor: '#484848',
    borderRadius: 10,
  },

  seekFill: {
    height: 4,
    backgroundColor: '#1DB954',
    borderRadius: 10,
  },

  seekThumb: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginLeft: -5,
  },

  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },

  timeText: {
    color: '#aaa',
    fontSize: 10,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },

  sideControl: {
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },

  repeatText: {
    color: '#888',
    fontSize: 21,
    fontWeight: 'bold',
  },

  activeControl: {
    color: '#1DB954',
  },

  control: {
    padding: 9,
  },

  controlText: {
    color: '#fff',
    fontSize: 19,
  },

  playButton: {
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
  },

  playText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
  },

  queueText: {
    color: '#aaa',
    fontSize: 21,
  },
});
