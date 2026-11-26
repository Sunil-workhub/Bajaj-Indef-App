import React, { JSX } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import CustomHeader from "../components/CustomHeader";

interface SearchParams {
  title: string;
  cardId: string;
  route: string;
}

export default function CardDetailScreen(): JSX.Element {
  const { title, cardId, route } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <CustomHeader
        title={(title as any) || "Detail"}
        showBackButton={true}
        onBackPress={() => router.back()}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to {title}</Text>
        <Text style={styles.subtitle}>Card ID: {cardId}</Text>
        <Text style={styles.subtitle}>Route: {route}</Text>
        <Text style={styles.description}>
          This is the detail page for {title}. You can add your specific content
          here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },
});
