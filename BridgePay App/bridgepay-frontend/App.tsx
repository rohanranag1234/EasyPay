import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Button, C, T } from "./src/components/ui";
import { Routes } from "./src/navigation";
import {
  AboutScreen,
  HelpScreen,
  IdentityScreen,
  MenuScreen,
  ProfileScreen,
  SettingsScreen,
} from "./src/screens/Account";
import {
  HistoryScreen,
  RatesScreen,
  TransferDetailScreen,
} from "./src/screens/Activity";
import {
  LoginScreen,
  SignupScreen,
  SplashScreen,
  VerifyScreen,
  WelcomeScreen,
} from "./src/screens/Auth";
import { HomeScreen } from "./src/screens/Home";
import {
  RecipientScreen,
  ReviewScreen,
  SendScreen,
  SuccessScreen,
} from "./src/screens/Send";
import { AppProvider } from "./src/store";
const Stack = createNativeStackNavigator<Routes>();
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: C.bg,
            padding: 32,
            justifyContent: "center",
            gap: 22,
          }}
        >
          <T style={{ fontSize: 28 }}>Something went wrong.</T>
          <T>Please restart the demo. Your bank has not been charged.</T>
          <Button onPress={() => this.setState({ failed: false })}>
            Try again
          </Button>
        </View>
      );
    return this.props.children;
  }
}
export default function App() {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  if (!loaded && !error)
    return (
      <View
        style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center" }}
      >
        <ActivityIndicator color={C.purple} />
      </View>
    );
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <StatusBar style="light" />
          <NavigationContainer
            theme={{
              ...DarkTheme,
              colors: {
                ...DarkTheme.colors,
                background: C.bg,
                card: C.card,
                primary: C.purple,
                border: C.border,
              },
            }}
          >
            <Stack.Navigator
              initialRouteName="Splash"
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: C.bg },
                animation: "fade",
                animationDuration: 160,
              }}
            >
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Verify" component={VerifyScreen} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Send" component={SendScreen} />
              <Stack.Screen name="Recipient" component={RecipientScreen} />
              <Stack.Screen name="Review" component={ReviewScreen} />
              <Stack.Screen name="Success" component={SuccessScreen} />
              <Stack.Screen name="Rates" component={RatesScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen
                name="TransferDetail"
                component={TransferDetailScreen}
              />
              <Stack.Screen name="Menu" component={MenuScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Help" component={HelpScreen} />
              <Stack.Screen name="About" component={AboutScreen} />
              <Stack.Screen name="Identity" component={IdentityScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
