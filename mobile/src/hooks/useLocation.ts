import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  lat: number;
  lng: number;
  granted: boolean;
  loading: boolean;
}

const DEFAULT: LocationState = { lat: 51.505, lng: -0.09, granted: false, loading: true };

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>(DEFAULT);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ ...DEFAULT, granted: false, loading: false });
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setState({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          granted: true,
          loading: false,
        });
      } catch {
        setState({ ...DEFAULT, granted: true, loading: false });
      }
    })();
  }, []);

  return state;
}
