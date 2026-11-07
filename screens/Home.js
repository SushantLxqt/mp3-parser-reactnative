import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function Home({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.starting}>Prototype of Actual Music Parser!</Text>

      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('About')}
      >
        <Text style={styles.buttonText}>Go to Parser!</Text>
      </Pressable>


      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.buttonText}>Go to Settings</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  starting:{
    fontSize: 34,
    margin: 5,
    alignItems: 'left',
    justifyContent: 'left',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 15,
    borderRadius: 10,
    marginTop: 34,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});