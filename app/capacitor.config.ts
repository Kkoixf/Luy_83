import { CapacitorConfig } from '@capacitor/cli';

const config: any = {
  appId: 'io.ionic.starter',
  appName: 'Luy83',
  webDir: 'www',
  plugins: {
    FirebaseAuthentication: {
      providers: ["google.com"],
      skipNativeAuth: false,
      googleIdToken: "566013437219-m5fdi6mvrudcgehajhb98vmvqj7rknuu.apps.googleusercontent.com",
    },
  },
};

export default config;