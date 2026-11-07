// Not written fully by Me, I am not that experienced yet.
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';

import * as MediaLibrary from 'expo-media-library/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMusic } from '../context/MusicContext';

const LIBRARY_KEY = '@parser_saved_music_library';

export default function About() {
  const { playTrack, currentSong, isPlaying } = useMusic();

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [lastScanned, setLastScanned] = useState(null);

  // Restore the saved library when this screen opens.
  const restoreLibrary = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(LIBRARY_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setSongs(parsed);
        }
      }
    } catch (error) {
      console.log('Library restore error:', error);
    } finally {
      setRestoring(false);
    }
  }, []);

  useEffect(() => {
    restoreLibrary();
  }, [restoreLibrary]);

  // Request Android audio permission.
  const requestAudioPermission = async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(
        false,
        ['audio']
      );

      return permission.granted;
    } catch (error) {
      console.log('Permission request error:', error);
      Alert.alert(
        'Permission Error',
        'Could not request audio permission. Check your app permissions and rebuild the APK.'
      );
      return false;
    }
  };

  // Scan the device audio library.
  const scanMusic = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Not supported',
        'This scanner is currently configured for Android.'
      );
      return;
    }

    setLoading(true);

    try {
      const granted = await requestAudioPermission();

      if (!granted) {
        Alert.alert(
          'Permission required',
          'Allow Parser to access audio files in Android settings, then try again.'
        );
        return;
      }

      let allSongs = [];
      let nextPage = true;
      let after = undefined;

      while (nextPage) {
        const result = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          first: 500,
          after,
          sortBy: [MediaLibrary.SortBy.creationTime],
        });

        const pageSongs = result.assets.map((asset) => ({
          id: asset.id,
          uri: asset.uri,
          name: asset.filename
            ? asset.filename.replace(/\.[^/.]+$/, '')
            : 'Unknown Track',
          filename: asset.filename || 'Unknown Track',
          artist: asset.artist || 'Unknown Artist',
          album: asset.album || 'Unknown Album',
          duration: asset.duration || 0,
        }));

        allSongs = allSongs.concat(pageSongs);

        nextPage = result.hasNextPage;
        after = result.endCursor;

        if (!after) {
          nextPage = false;
        }
      }

      // Remove duplicate files by URI.
      const uniqueSongs = Array.from(
        new Map(allSongs.map((song) => [song.uri, song])).values()
      );

      setSongs(uniqueSongs);

      await AsyncStorage.setItem(
        LIBRARY_KEY,
        JSON.stringify(uniqueSongs)
      );

      setLastScanned(new Date().toLocaleString());

      Alert.alert(
        'Scan complete',
        `Found ${uniqueSongs.length} audio files.`
      );
    } catch (error) {
      console.log('Music Scan Error:', error);

      Alert.alert(
        'Music Scan Error',
        error?.message || 'Something went wrong while scanning your music.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Play selected song with the complete library as its queue.
  const handlePlay = (song) => {
    if (!song?.uri) {
      Alert.alert('Playback error', 'This audio file has no valid URI.');
      return;
    }

    playTrack(song, songs);
  };

  const formatDuration = (seconds) => {
    const total = Math.floor(seconds || 0);
    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const renderSong = ({ item, index }) => {
    const selected = currentSong?.uri === item.uri;

    return (
      <Pressable
        style={styles.songRow}
        onPress={() => handlePlay(item)}
      >
        <View style={styles.songNumber}>
          <Text style={styles.numberText}>
            {selected && isPlaying ? '♫' : index + 1}
          </Text>
        </View>

        <View style={styles.songInfo}>
          <Text
            style={[
              styles.songTitle,
              selected && styles.selectedText,
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <Text style={styles.artist} numberOfLines={1}>
            {item.artist || 'Unknown Artist'}
          </Text>
        </View>

        <Text style={styles.duration}>
          {formatDuration(item.duration)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Parser Library</Text>
        <Text style={styles.subtitle}>
          Your music, all in one place.
        </Text>
      </View>

      <Pressable
        style={styles.scanButton}
        onPress={scanMusic}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.scanButtonText}>
            ↻  Scan Music
          </Text>
        )}
      </Pressable>

      <View style={styles.libraryHeader}>
        <Text style={styles.sectionTitle}>Your Songs</Text>
        <Text style={styles.songCount}>
          {songs.length} tracks
        </Text>
      </View>

      {restoring ? (
        <ActivityIndicator
          size="large"
          color="#1ed760"
          style={styles.loader}
        />
      ) : songs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>♫</Text>
          <Text style={styles.emptyTitle}>No music found</Text>
          <Text style={styles.emptyText}>
            Tap Scan Music to find audio files on your device.
          </Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item, index) =>
            item.id?.toString() || item.uri || index.toString()
          }
          renderItem={renderSong}
          contentContainerStyle={styles.songList}
        />
      )}

      {lastScanned && (
        <Text style={styles.lastScanned}>
          Last scanned: {lastScanned}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
    paddingHorizontal: 18,
    paddingTop: 55,
  },

  header: {
    marginBottom: 24,
  },

  heading: {
    color: '#ffffff',
    fontSize: 29,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#999999',
    fontSize: 14,
    marginTop: 5,
  },

  scanButton: {
    height: 52,
    backgroundColor: '#1ed760',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },

  scanButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },

  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  songCount: {
    color: '#999999',
    fontSize: 13,
  },

  songList: {
    paddingBottom: 120,
  },

  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },

  songNumber: {
    width: 35,
    alignItems: 'center',
  },

  numberText: {
    color: '#999999',
    fontSize: 14,
  },

  songInfo: {
    flex: 1,
    marginLeft: 8,
    marginRight: 10,
  },

  songTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  selectedText: {
    color: '#1ed760',
  },

  artist: {
    color: '#999999',
    fontSize: 12,
    marginTop: 4,
  },

  duration: {
    color: '#999999',
    fontSize: 12,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 65,
  },

  emptyIcon: {
    color: '#1ed760',
    fontSize: 48,
    marginBottom: 12,
  },

  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  emptyText: {
    color: '#999999',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  loader: {
    marginTop: 50,
  },

  lastScanned: {
    color: '#777777',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
