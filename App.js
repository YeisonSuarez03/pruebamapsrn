import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, AppState, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView from 'react-native-maps';
import {getCurrentPositionAsync, useForegroundPermissions, watchPositionAsync, useBackgroundPermissions, getBackgroundPermissionsAsync, startLocationUpdatesAsync, stopLocationUpdatesAsync} from 'expo-location'

import * as TaskManager from 'expo-task-manager'




export default function App() {
  const [mapRegion, setmapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [loading, setLoading] = useState(true)

  const [status, requestPermission] = useForegroundPermissions();
  const [statusBg, requestPermissionBg] = useBackgroundPermissions();

  const [historyCoords, setHistoryCoords] = useState([]);

  const watcherId = useRef()
  const taskName = "TASK_GETUSERLOCATION_BG"


 /*  useEffect(async() => {
    try {
      const requestPermissionForeground = await requestPermission();
      console.log(requestPermissionForeground)
      if (
        Platform.OS === "android" ? 
        requestPermissionForeground?.status !== "granted" :
        requestPermissionForeground?.ios.scope !== "whenInUse" 
        ) return;
        const response = await getCurrentPositionAsync()
        console.log(response)
        setmapRegion(v => ({...v, latitude: response.coords.latitude, longitude: response.coords.longitude}))
        setLoading(false)
        //OBTENEMOS COORDS PARA LA REGION, AHORA CREAMOS WATCHER PARA OBTENER POSICION
        //GENERACION DE WATCHER
        const watcher = await watchPositionAsync({}, (location) => {
          console.log("watcher location: ", location)
          setHistoryCoords(v => ([...v, {...location.coords}]))
        });
        console.log("watcher: ", watcher);
        
      } catch (error) {
        console.log(error)
      }
    }, []) */
    
    TaskManager.defineTask(taskName, async ({ data: { locations }, error }) => {
      if (error) {
        console.error(error);
        return;
      }
      console.log("TASKlocations UPDATE: ", locations[0])
      const {coords:{latitude, longitude}} = locations[0]
      setHistoryCoords(v => ([...v, {latitude, longitude}]))
    
    });

  useEffect(async() => {
      const statusBgPermissions = await requestPermissionBg();
      console.log(statusBgPermissions)
      if (Platform.OS === "android" ? 
      statusBgPermissions?.status !== "granted" :
      statusBgPermissions?.ios.scope !== "always" 
      ) return;  
      console.log("tenemos permisos en segundo plano SIUUUU")
      const {coords:{latitude, longitude}} = await getCurrentPositionAsync()
      setmapRegion(v => ({...v, latitude, longitude}))
      setLoading(false)
  }, [])

  const interval = useRef();

  AppState.addEventListener("change", (e) => {
    console.log(e);
    if (e === "background") {
      if (interval.current !== null) return; 
      interval.current = setInterval(() => {
        console.log("LOG BACKGROUND")
      }, 1000);
    }else{
      clearInterval(interval.current);
    }
  })

  const startLocationUpdateshandler = async() => {
     //EJECUTAMOS TASK MANAGER DE UPDATES ASYNC
    console.log('CLICK START')
     try {
        
      await startLocationUpdatesAsync(taskName, {
        distanceInterval: 1, // minimum change (in meters) betweens updates
        deferredUpdatesInterval: 1000, // minimum interval (in milliseconds) between updates
        foregroundService: {
          notificationTitle: 'Using your location in background',
          notificationBody: 'Do not turn it off in case you are doing a following',
        }
      })
      console.log("SE HA REGISTRADO TASK LOCATIONS")
      
    } catch (error) {
      console.log("ERROR AL REGISTRAR TASK LOCATIONS: ", error)
    }
  }

  const stopLocationUpdatesHandler = async() => {
    console.log('CLICK STOP')
    try {
      const stopUpdatesResponse = await stopLocationUpdatesAsync(taskName);
      console.log("stopUpdatesResponse: ", stopUpdatesResponse)
    } catch (error) {
      console.log("stopUpdatesResponse ERROR: ", error)
    }
  }


  
  
  

  return (
    <View style={{flex: 1}}>
      {
        loading 
        ? <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        : <View style={styles.container}>
            <MapView 
            style={{ alignSelf: 'stretch', height: '100%' }}
            showsUserLocation
            region={mapRegion} />

            <ScrollView  style={styles.floatingMessage}>
              <Text style={{fontSize: 15, textAlign: "center", marginBottom: 20}}>Actualizaciones de Posicion:</Text>
              <Text style={{color: "#333333"}}> {JSON.stringify(historyCoords, null, 5)} </Text>
            </ScrollView>

            <TouchableOpacity 
            onPress={stopLocationUpdatesHandler}
            activeOpacity={.8} 
            style={styles.floatingButton}>
              <Text style={{color: "white", fontSize: 16, fontWeight: "bold", textAlign: "center"}}>Detener Seguimiento</Text>
            </TouchableOpacity>

            <TouchableOpacity 
            onPress={startLocationUpdateshandler}
            activeOpacity={.8} 
            style={{...styles.floatingButton, backgroundColor: "#1797DF", right: 0, left: "5%"}}>
              <Text style={{color: "white", fontSize: 16, fontWeight: "bold", textAlign: "center"}}>Iniciar Seguimiento</Text>
            </TouchableOpacity>

          </View>
      }
      

      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButton : {
    width: 150,
    // height: 100, 
    backgroundColor: "#C4460A", 
    padding: 20,
    borderRadius: 40,
    position: "absolute",
    right: "5%",
    bottom: "5%",
  },
  floatingMessage: {
    width: 210,
    height: 250,
    backgroundColor: "#EEEEEE", 
    borderRadius: 15,
    padding: 20,
    position: 'absolute',
    top: "5%",
    left: "5%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,

    elevation: 7,
  }
});
