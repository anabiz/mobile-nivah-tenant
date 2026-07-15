import { Alert, Platform, ToastAndroid } from 'react-native';

// Minimal cross-platform toast: native Android toast where available, a simple alert elsewhere.
// A proper in-app toast/snackbar component is a reasonable follow-up once the core flows are proven out.
function show(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(message);
  }
}

export const toast = {
  success: show,
  error: show,
};
