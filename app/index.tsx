import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to auth screen first
  return <Redirect href="/auth" />;
}

