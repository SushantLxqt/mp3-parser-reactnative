import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from 'expo-audio';

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueueState] = useState([]);
  const [repeatMode, setRepeatMode] = useState('all');
  const [audioReady, setAudioReady] = useState(false);

  const queueRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const repeatRef = useRef('all');
  const finishedRef = useRef(false);

  // Set up audio playback.
  useEffect(() => {
    let mounted = true;

    async function setupAudio() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });

        if (mounted) {
          setAudioReady(true);
        }
      } catch (error) {
        console.log('Audio setup error:', error);
      }
    }

    setupAudio();

    return () => {
      mounted = false;
    };
  }, []);

  // Keep the repeat-mode ref updated.
  useEffect(() => {
    repeatRef.current = repeatMode;
  }, [repeatMode]);

  // THE ONLY setQueue FUNCTION IN THIS FILE.
  const setQueue = useCallback(
    (songs) => {
      const newQueue = Array.isArray(songs) ? songs : [];

      queueRef.current = newQueue;
      setQueueState(newQueue);

      if (currentSong) {
        const index = newQueue.findIndex(
          (song) => song.uri === currentSong.uri
        );

        currentIndexRef.current = index;
      } else {
        currentIndexRef.current = -1;
      }
    },
    [currentSong]
  );

  // Update Android lock-screen information.
  const updateLockScreen = useCallback(
    (song) => {
      if (!song || !player.setActiveForLockScreen) return;

      try {
        player.setActiveForLockScreen(
          true,
          {
            title: song.name || song.filename || 'Unknown Track',
            artist: song.artist || 'Unknown Artist',
            albumTitle: song.album || 'Parser',
          },
          {
            showNextTrack: true,
            showPreviousTrack: true,
            showSeekForward: true,
            showSeekBackward: true,
          }
        );
      } catch (error) {
        console.log('Lock screen update error:', error);
      }
    },
    [player]
  );

  // Load and play one song.
  const loadTrack = useCallback(
    async (song, index) => {
      if (!song || !song.uri) return;

      try {
        finishedRef.current = false;

        currentIndexRef.current = index;
        setCurrentSong(song);

        updateLockScreen(song);

        player.replace({ uri: song.uri });
        player.play();
      } catch (error) {
        console.log('Track playback error:', error);
      }
    },
    [player, updateLockScreen]
  );

  // Play a selected song.
  const playTrack = useCallback(
    (song, songs) => {
      if (!song || !song.uri) return;

      let activeQueue = queueRef.current;

      if (Array.isArray(songs) && songs.length > 0) {
        activeQueue = songs;
        queueRef.current = songs;
        setQueueState(songs);
      }

      let index = activeQueue.findIndex(
        (item) => item.uri === song.uri
      );

      if (index === -1) {
        activeQueue = [song];
        queueRef.current = activeQueue;
        setQueueState(activeQueue);
        index = 0;
      }

      loadTrack(song, index);
    },
    [loadTrack]
  );

  // Play the next song.
  const nextTrack = useCallback(() => {
    const activeQueue = queueRef.current;

    if (activeQueue.length === 0) return;

    let nextIndex = currentIndexRef.current + 1;

    if (nextIndex >= activeQueue.length) {
      if (repeatRef.current === 'all') {
        nextIndex = 0;
      } else {
        player.pause();
        return;
      }
    }

    loadTrack(activeQueue[nextIndex], nextIndex);
  }, [loadTrack, player]);

  // Play the previous song.
  const previousTrack = useCallback(() => {
    const activeQueue = queueRef.current;

    if (activeQueue.length === 0) return;

    const currentTime = status?.currentTime || 0;

    if (currentTime > 3) {
      player.seekTo(0);
      return;
    }

    let previousIndex = currentIndexRef.current - 1;

    if (previousIndex < 0) {
      previousIndex = repeatRef.current === 'all'
        ? activeQueue.length - 1
        : 0;
    }

    loadTrack(activeQueue[previousIndex], previousIndex);
  }, [loadTrack, player, status]);

  // Play or pause.
  const togglePlayback = useCallback(() => {
    if (!currentSong) return;

    if (status?.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [currentSong, player, status]);

  const pausePlayback = useCallback(() => {
    player.pause();
  }, [player]);

  const resumePlayback = useCallback(() => {
    if (currentSong) {
      player.play();
    }
  }, [currentSong, player]);

  // Cycle repeat: all -> one -> off -> all.
  const toggleRepeat = useCallback(() => {
    setRepeatMode((previous) => {
      if (previous === 'all') return 'one';
      if (previous === 'one') return 'off';
      return 'all';
    });
  }, []);

  // Seek to a position in seconds.
  const seekTo = useCallback(
    (seconds) => {
      const target = Number(seconds);

      if (Number.isFinite(target) && target >= 0) {
        player.seekTo(target);
      }
    },
    [player]
  );

  const setVolume = useCallback(
    (volume) => {
      player.volume = Math.max(0, Math.min(1, volume));
    },
    [player]
  );

  const stopPlayback = useCallback(() => {
    player.pause();

    try {
      player.clearLockScreenControls?.();
    } catch (error) {
      console.log('Lock screen cleanup error:', error);
    }

    setCurrentSong(null);
    currentIndexRef.current = -1;
    finishedRef.current = false;
  }, [player]);

  // Handle the end of a track.
  useEffect(() => {
    if (status?.didJustFinish && !finishedRef.current) {
      finishedRef.current = true;

      if (repeatRef.current === 'one') {
        player.seekTo(0);
        player.play();
      } else {
        nextTrack();
      }
    }

    if (!status?.didJustFinish) {
      finishedRef.current = false;
    }
  }, [status?.didJustFinish, player, nextTrack]);

  const value = {
    player,
    status,

    currentSong,
    queue,
    repeatMode,
    audioReady,

    isPlaying: status?.playing || false,
    currentTime: status?.currentTime || 0,
    duration: status?.duration || 0,

    setQueue,
    playTrack,
    loadTrack,
    nextTrack,
    previousTrack,

    togglePlayback,
    pausePlayback,
    resumePlayback,
    toggleRepeat,

    seekTo,
    setVolume,
    stopPlayback,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);

  if (!context) {
    throw new Error(
      'useMusic must be used inside a MusicProvider'
    );
  }

  return context;
}