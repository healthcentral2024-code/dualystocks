import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        // console.log(`${key} was used 🔐 \n`);
      } else {
        // console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      // console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Polyfill for web
export const webTokenCache = {
  async getToken(key: string) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      return;
    }
  },
};

export const cache = Platform.OS === 'web' ? webTokenCache : tokenCache;