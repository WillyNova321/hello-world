import { useColorScheme } from "react-native";
import colors, { ThemeColors } from "../constants/colors";

export function useColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === "dark" ? colors.dark : colors.light;
}

export default useColors;
