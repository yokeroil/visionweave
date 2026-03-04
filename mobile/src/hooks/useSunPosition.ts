import { useState, useEffect, useRef } from 'react';
import SunCalc from 'suncalc';

export interface SunPosition {
  azimuth: number;
  altitude: number;
  isGoldenHour: boolean;
  isBlueHour: boolean;
  sceneLabel: string;
  goldenHourStart: Date;
  goldenHourEnd: Date;
  sunsetStart: Date;
  dusk: Date;
}

function getSceneLabel(altitude: number, isGoldenHour: boolean, isBlueHour: boolean): string {
  if (isGoldenHour) return 'Golden Hour';
  if (isBlueHour) return 'Blue Hour';
  if (altitude < 0) return 'Night';
  if (altitude < 6) return 'Twilight';
  if (altitude < 20) return 'Low Sun';
  if (altitude > 60) return 'Harsh Overhead';
  return 'Soft Daylight';
}

export function useSunPosition(lat: number, lng: number): SunPosition {
  const [position, setPosition] = useState<SunPosition>(() => compute(lat, lng));
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  function compute(la: number, ln: number): SunPosition {
    const now = new Date();
    const pos = SunCalc.getPosition(now, la, ln);
    const times = SunCalc.getTimes(now, la, ln);

    const azimuth = (pos.azimuth * (180 / Math.PI) + 180 + 360) % 360;
    const altitude = pos.altitude * (180 / Math.PI);
    const isGoldenHour = now >= times.goldenHour && now <= times.goldenHourEnd;
    const isBlueHour =
      (now >= times.blueHour && now <= times.blueHourEnd) ||
      (now >= times.dusk && now <= times.nauticalDusk);

    return {
      azimuth,
      altitude,
      isGoldenHour,
      isBlueHour,
      sceneLabel: getSceneLabel(altitude, isGoldenHour, isBlueHour),
      goldenHourStart: times.goldenHour,
      goldenHourEnd: times.goldenHourEnd,
      sunsetStart: times.sunsetStart,
      dusk: times.dusk,
    };
  }

  useEffect(() => {
    setPosition(compute(lat, lng));
    intervalRef.current = setInterval(() => setPosition(compute(lat, lng)), 30000);
    return () => clearInterval(intervalRef.current);
  }, [lat, lng]);

  return position;
}
