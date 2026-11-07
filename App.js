import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import AppNavigator from './navigation/AppNavigator';
import { MusicProvider } from './context/MusicContext';
import MiniPlayer from './components/MiniPlayer';

export default function App() {
  return (
    <MusicProvider>
      <View style={styles.root}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>

        <MiniPlayer />
      </View>
    </MusicProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});