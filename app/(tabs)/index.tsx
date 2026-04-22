import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

const App = () => {
  return (
    <View style={styles.container}>
      <ImageBackground 
        resizeMode='cover'
        style={styles.ImageBackground}
      >
        <Text style={styles.Text}>Balance Shop</Text>


      </ImageBackground>
    </View>
  );
}

export default App;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',

  } 
  ,
  Text: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
      fontFamily: 'Arial',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  ImageBackground: {
    width: '100%',
    height: '100%',
     justifyContent: 'center',
    alignItems: 'center',
  }
}
)