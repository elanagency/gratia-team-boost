/// <reference types="vite/client" />

interface GrowSumoData {
  name: string;
  email: string;
  customer_key: string;
}

interface GrowSumo {
  data: GrowSumoData;
  createSignup: (callback?: (error: any, result: any) => void) => void;
  _initialize: (publicKey: string) => void;
}

declare var growsumo: GrowSumo | undefined;
