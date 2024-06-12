import React, {useCallback, useEffect, useRef, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  FlatList,
  ListRenderItem,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import UnityView from '@azesmway/react-native-unity';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

enum RootRoutes {
  HOME = 'Home',
  UNITY = 'Unity',
}

type RootStackParamList = {
  [RootRoutes.HOME]: {score?: Score};
  [RootRoutes.UNITY]: {messageToUnity: string}; // added messageToUnity
};

type RootStackScreenProps<RN extends keyof RootStackParamList = RootRoutes> =
  NativeStackScreenProps<RootStackParamList, RN>;

const Stack = createNativeStackNavigator<RootStackParamList>();

// score data type
type Score = {
  date: string;
  score: number;
};

const HomeScreen: React.FC<RootStackScreenProps<RootRoutes.HOME>> = ({
  navigation,
  route,
}) => {
  const [scores, setScores] = useState<Score[]>([]); // scores to display in list

  const insets = useSafeAreaInsets();

  //func to setup scores from async storage on app open (we have no scores)
  const setupScores = async () => {
    const scoresJSON = await AsyncStorage.getItem('scores');

    if (scoresJSON) {
      setScores(JSON.parse(scoresJSON) as Score[]);
    }
  };

  //setting up existed scores
  useEffect(() => {
    if (!scores.length) {
      setupScores();
    }
  });

  const setNewScores = async (score: Score) => {
    //creating new scores with new one, includes filter & sort to show only 10 best results
    const newScores = [...scores, score]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    //setting new scores to async storage
    await AsyncStorage.setItem('scores', JSON.stringify(newScores));

    //setting new scores to scores' state
    setScores(newScores);

    //clean navigation score param
    navigation.setParams({score: undefined});
  };

  useEffect(() => {
    if (route.params?.score) {
      setNewScores(route.params.score);
    }
  }, [route.params]);

  const goUnity = () => {
    let messageToUnity = '0';
    if (scores.length) {
      messageToUnity = scores[0].score.toString();
    }
    navigation.navigate(RootRoutes.UNITY, {messageToUnity});
  };

  //List item to render
  const renderScore: ListRenderItem<Score> = useCallback(({item, index}) => {
    return (
      <View style={styles.score}>
        <Text style={styles.scoreText}>{index + 1}.</Text>
        <Text style={[styles.scoreText, styles.flex]}>{item.score}</Text>
        <Text style={styles.scoreDate}>
          {new Date(item.date).toLocaleString()}
        </Text>
      </View>
    );
  }, []);

  return (
    <View style={[styles.screen, {paddingBottom: Math.max(insets.bottom, 15)}]}>
      <Text style={styles.welcomeText}>
        Hello, from{' '}
        <Text style={[styles.welcomeText, styles.purple]}>dev.family</Text> team
      </Text>
      {/** scoreboard */}
      <Text style={styles.welcomeText}>Scores 🏆:</Text>
      {!!scores.length && (
        <View style={[styles.row, styles.scoreInfo]}>
          <Text style={[styles.scoreText, styles.flex]}>Score</Text>
          <Text style={styles.scoreText}>Date</Text>
        </View>
      )}
      <FlatList
        data={scores}
        renderItem={renderScore}
        keyExtractor={i => i.date}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text>You have no scoreboard yet</Text>}
      />
      <TouchableOpacity style={styles.button} onPress={goUnity}>
        <Text style={styles.buttonText}>Go Unity</Text>
      </TouchableOpacity>
    </View>
  );
};

const UnityScreen: React.FC<RootStackScreenProps<RootRoutes.UNITY>> = ({
  route,
  navigation,
}) => {
  // Start
  const unityRef = useRef<UnityView>(null);

  const {messageToUnity} = route.params;

  const message = {
    gameObject: 'LogicManager',
    method: 'SetBestScore',
    message: messageToUnity,
  };

  useEffect(() => {
    if (messageToUnity) {
      unityRef.current?.postMessage(
        message.gameObject,
        message.method,
        message.message,
      );
    }
  }, [messageToUnity]);

  const handleUnityMessage = (json: string) => {
    //alert to show Unity message data
    const score = JSON.parse(json) as Score;
    if (score) {
      // unityRef.current?.unloadUnity();
      navigation.navigate(RootRoutes.HOME, {score});
      unityRef.current?.unloadUnity();
    }
  };

  //End

  return (
    <View style={styles.flex}>
      <UnityView
        ref={unityRef}
        //@ts-expect-error UnityView needs a 'flex: 1' style to show full screen view
        style={styles.flex}
        onUnityMessage={e => handleUnityMessage(e.nativeEvent.message)} // and this line
      />
    </View>
  );
};

const App = () => {
  return (
    <View style={styles.flex}>
      <StatusBar backgroundColor={'#FFF'} barStyle="dark-content" />

      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerTintColor: 'purple',
              headerTitleStyle: {color: 'black'},
            }}>
            <Stack.Screen name={RootRoutes.HOME} component={HomeScreen} />
            <Stack.Screen name={RootRoutes.UNITY} component={UnityScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 30,
    paddingTop: 25,
  },
  button: {
    width: '100%',
    backgroundColor: 'purple',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 16,
    marginTop: 'auto',
  },
  purple: {color: 'purple'},
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  welcomeText: {
    fontSize: 24,
    color: 'black',
    fontWeight: '600',
  },
  flex: {
    flex: 1,
  },
  row: {flexDirection: 'row'},
  scoreInfo: {paddingHorizontal: 14},

  score: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderColor: '#bcbcbc',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'black',
  },
  scoreDate: {
    color: '#262626',
    fontSize: 16,
    fontWeight: '400',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
    gap: 12,
  },
});

export default App;
