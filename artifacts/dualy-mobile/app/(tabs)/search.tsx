import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/lib/i18n';
import { useColors } from '@/hooks/useColors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Feather } from '@expo/vector-icons';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { lang } = useLanguage();
  const c = useColors();
  const router = useRouter();

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/analysis/${encodeURIComponent(query.trim().toUpperCase())}`);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: c.background }]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="search" size={48} color={c.primary} />
        </View>
        
        <Text style={[styles.title, { color: c.foreground }]}>
          {lang === 'es' ? 'Buscar Acción' : 'Search Stock'}
        </Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          {lang === 'es' 
            ? 'Ingresa un ticker (ej. AAPL) o el nombre de la empresa (ej. Apple)'
            : 'Enter a ticker (e.g. AAPL) or company name (e.g. Apple)'}
        </Text>

        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={lang === 'es' ? 'Ticker o Empresa...' : 'Ticker or Company...'}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          style={styles.input}
        />

        <Button 
          title={lang === 'es' ? 'Analizar' : 'Analyze'} 
          onPress={handleSearch} 
          disabled={!query.trim()}
          size="lg"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
});