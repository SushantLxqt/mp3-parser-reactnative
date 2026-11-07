import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function Settings({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.starting}>Still under construction!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starting:{
    fontWeight: 'bold',
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
    margin: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});