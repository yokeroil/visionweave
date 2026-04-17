import React from 'react';
import Svg, { Circle, Ellipse, Path, Line, Rect } from 'react-native-svg';

interface Props {
  genre: string;
  size?: number;
  color?: string;
}

export function GenreIcon({ genre, size = 56, color = '#B8A898' }: Props) {
  const w = 2;
  const s = { stroke: color, fill: 'none', strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const dot = { fill: color, stroke: 'none' };
  const thin = { ...s, strokeWidth: 1.4 };

  const icons: Record<string, React.ReactNode> = {

    // Saturn with rings + stars
    astro: (
      <>
        {/* Planet body */}
        <Circle cx="30" cy="30" r="11" {...s} />
        {/* Ring - back half (behind planet, drawn first) */}
        <Path d="M9 27 Q14 20 30 20 Q46 20 51 27" {...thin} strokeDasharray="0" opacity={0.4} />
        {/* Ring - front half */}
        <Path d="M9 27 Q14 34 30 34 Q46 34 51 27" {...s} />
        {/* Stars */}
        <Circle cx="8"  cy="10" r="1.5" {...dot} />
        <Circle cx="53" cy="9"  r="1"   {...dot} />
        <Circle cx="51" cy="50" r="1.5" {...dot} />
        <Circle cx="7"  cy="49" r="1"   {...dot} />
        <Circle cx="14" cy="52" r="1"   {...dot} />
        <Circle cx="48" cy="14" r="1"   {...dot} />
      </>
    ),

    // Mountain peaks + sun peeking over horizon
    landscape: (
      <>
        {/* Sun */}
        <Circle cx="47" cy="22" r="7" {...s} />
        {/* Far mountain (lighter) */}
        <Path d="M22 50 L36 24 L50 50" {...thin} opacity={0.5} />
        {/* Near mountain */}
        <Path d="M4 50 L20 22 L36 50" {...s} />
        {/* Snow cap */}
        <Path d="M16 30 L20 22 L24 30" {...thin} />
        {/* Ground line */}
        <Line x1="4" y1="50" x2="56" y2="50" {...thin} />
      </>
    ),

    // Head + shoulders silhouette
    portrait: (
      <>
        {/* Head */}
        <Circle cx="30" cy="20" r="12" {...s} />
        {/* Shoulders / neckline */}
        <Path d="M8 58 Q8 40 20 38 Q25 37 30 37 Q35 37 40 38 Q52 40 52 58" {...s} />
        {/* Neck */}
        <Path d="M26 32 L26 38 M34 32 L34 38" {...thin} />
      </>
    ),

    // City skyline with windows
    street: (
      <>
        {/* Buildings */}
        <Rect x="5"  y="30" width="10" height="24" rx="1" {...s} />
        <Rect x="17" y="18" width="12" height="36" rx="1" {...s} />
        <Rect x="31" y="24" width="10" height="30" rx="1" {...s} />
        <Rect x="43" y="12" width="11" height="42" rx="1" {...s} />
        {/* Windows */}
        <Rect x="8"  y="36" width="4" height="4" rx="0.5" {...dot} />
        <Rect x="8"  y="44" width="4" height="4" rx="0.5" {...dot} />
        <Rect x="20" y="24" width="3" height="3" rx="0.5" {...dot} />
        <Rect x="25" y="24" width="3" height="3" rx="0.5" {...dot} />
        <Rect x="20" y="32" width="3" height="3" rx="0.5" {...dot} />
        <Rect x="34" y="30" width="3" height="3" rx="0.5" {...dot} />
        <Rect x="46" y="18" width="3" height="3" rx="0.5" {...dot} />
        <Rect x="51" y="18" width="3" height="3" rx="0.5" {...dot} />
        <Rect x="46" y="26" width="3" height="3" rx="0.5" {...dot} />
        {/* Ground */}
        <Line x1="4" y1="54" x2="56" y2="54" {...thin} />
      </>
    ),

    // Classical arch with columns
    architecture: (
      <>
        {/* Arch opening */}
        <Path d="M18 54 L18 32 Q18 12 30 12 Q42 12 42 32 L42 54" {...s} />
        {/* Inner arch */}
        <Path d="M22 54 L22 33 Q22 18 30 18 Q38 18 38 33 L38 54" {...thin} />
        {/* Steps */}
        <Line x1="14" y1="54" x2="46" y2="54" {...s} />
        <Line x1="10" y1="57" x2="50" y2="57" {...thin} />
        {/* Door keystone */}
        <Path d="M27 12 Q30 8 33 12" {...thin} />
      </>
    ),

    // Airplane angled upward
    travel: (
      <>
        {/* Fuselage */}
        <Path d="M10 38 Q16 34 30 30 Q46 26 53 28 Q55 32 52 34 Q42 38 30 40 Z" {...s} />
        {/* Left wing */}
        <Path d="M24 40 L10 52 L36 42" {...s} />
        {/* Right winglet */}
        <Path d="M46 30 L52 22 L56 28" {...thin} />
        {/* Tail fin */}
        <Path d="M12 40 L6 52 L18 44" {...thin} />
        {/* Portholes */}
        <Circle cx="38" cy="31" r="2" {...dot} />
        <Circle cx="44" cy="30" r="1.5" {...dot} />
      </>
    ),

    // Leaf with veins
    nature: (
      <>
        {/* Leaf blade */}
        <Path d="M30 6 Q54 8 54 34 Q54 56 30 56 Q6 56 6 34 Q6 8 30 6 Z" {...s} />
        {/* Main vein */}
        <Line x1="30" y1="6" x2="30" y2="56" {...thin} />
        {/* Left veins */}
        <Path d="M30 22 Q20 26 17 34" {...thin} />
        <Path d="M30 34 Q21 37 19 44" {...thin} />
        {/* Right veins */}
        <Path d="M30 22 Q40 26 43 34" {...thin} />
        <Path d="M30 34 Q39 37 41 44" {...thin} />
        {/* Stem */}
        <Path d="M30 56 Q28 60 26 62" {...thin} />
      </>
    ),

    // Magnifying glass with flower inside
    macro: (
      <>
        {/* Outer lens ring */}
        <Circle cx="25" cy="25" r="18" {...s} />
        {/* Handle */}
        <Line x1="38" y1="38" x2="54" y2="54" stroke={color} strokeWidth={3.5} strokeLinecap="round" />
        {/* Flower center */}
        <Circle cx="25" cy="25" r="4" {...thin} />
        {/* Petals */}
        <Circle cx="25" cy="17" r="4" {...thin} />
        <Circle cx="25" cy="33" r="4" {...thin} />
        <Circle cx="17" cy="25" r="4" {...thin} />
        <Circle cx="33" cy="25" r="4" {...thin} />
      </>
    ),
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      {icons[genre] ?? <Circle cx="30" cy="30" r="20" stroke={color} fill="none" strokeWidth={2} />}
    </Svg>
  );
}
