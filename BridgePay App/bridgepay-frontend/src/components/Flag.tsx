import { View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Currency } from "../domain/data";
/** Vector flags render consistently on Android, iOS, and Linux web previews. */
export function Flag({
  currency,
  size = 24,
}: {
  currency: Currency;
  size?: number;
}) {
  return (
    <View
      accessibilityLabel={`${currency} flag`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {currency === "JPY" && (
          <>
            <Rect width="24" height="24" fill="#fff" />
            <Circle cx="12" cy="12" r="5" fill="#BD2339" />
          </>
        )}
        {currency === "INR" && (
          <>
            <Rect width="24" height="8" fill="#ED9949" />
            <Rect y="8" width="24" height="8" fill="#fff" />
            <Rect y="16" width="24" height="8" fill="#348454" />
            <Circle
              cx="12"
              cy="12"
              r="2.6"
              stroke="#344B8C"
              strokeWidth="1"
              fill="none"
            />
            <Circle cx="12" cy="12" r=".8" fill="#344B8C" />
          </>
        )}
        {currency === "USD" && (
          <>
            <Rect width="24" height="24" fill="#fff" />
            {[0, 4, 8, 12, 16, 20].map((y) => (
              <Rect key={y} y={y} width="24" height="2" fill="#C45E6C" />
            ))}
            <Rect width="12" height="12" fill="#425D91" />
            {[3, 6, 9].map((x) =>
              [3, 6, 9].map((y) => (
                <Circle key={`${x}-${y}`} cx={x} cy={y} r=".65" fill="#fff" />
              )),
            )}
          </>
        )}
        {currency === "EUR" && (
          <>
            <Rect width="24" height="24" fill="#315BA7" />
            {Array.from({ length: 12 }, (_, i) => (
              <Circle
                key={i}
                cx={12 + 6 * Math.cos((i * Math.PI) / 6)}
                cy={12 + 6 * Math.sin((i * Math.PI) / 6)}
                r=".8"
                fill="#F4D76D"
              />
            ))}
          </>
        )}
        {currency === "GBP" && (
          <>
            <Rect width="24" height="24" fill="#364F80" />
            <Path d="M0 0L24 24M24 0L0 24" stroke="#fff" strokeWidth="5" />
            <Path d="M0 0L24 24M24 0L0 24" stroke="#C75669" strokeWidth="2" />
            <Path d="M12 0V24M0 12H24" stroke="#fff" strokeWidth="8" />
            <Path d="M12 0V24M0 12H24" stroke="#C75669" strokeWidth="4" />
          </>
        )}
      </Svg>
    </View>
  );
}
