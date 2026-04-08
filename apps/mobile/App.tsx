import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const pillars = [
  "Upload or share contracts from your phone.",
  "See summaries, red flags, and a plain-language risk score.",
  "Continue follow-up questions after the initial result.",
];

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Cheka mobile</Text>
          <Text style={styles.title}>Know before you sign.</Text>
          <Text style={styles.body}>
            This starter app mirrors the product direction from the launch PRD and
            gives us a mobile surface to connect to the API next.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What ships first</Text>
          {pillars.map((pillar) => (
            <View key={pillar} style={styles.pillarRow}>
              <View style={styles.pillarDot} />
              <Text style={styles.pillarText}>{pillar}</Text>
            </View>
          ))}
        </View>

        <View style={styles.accentCard}>
          <Text style={styles.accentLabel}>Launch markets</Text>
          <Text style={styles.accentValue}>South Africa + Kenya</Text>
          <Text style={styles.accentBody}>
            WhatsApp remains the primary low-friction access channel, with mobile
            focused on document sharing, saved history, and future subscriptions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6efe2",
  },
  container: {
    padding: 24,
    gap: 20,
  },
  hero: {
    paddingTop: 16,
    gap: 12,
  },
  kicker: {
    color: "#8f5f47",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: "#183127",
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 42,
  },
  body: {
    color: "#29473b",
    fontSize: 16,
    lineHeight: 26,
  },
  card: {
    backgroundColor: "#fffaf4",
    borderColor: "rgba(24, 49, 39, 0.08)",
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    color: "#183127",
    fontSize: 22,
    fontWeight: "700",
  },
  pillarRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  pillarDot: {
    backgroundColor: "#d17755",
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  pillarText: {
    color: "#29473b",
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
  },
  accentCard: {
    backgroundColor: "#183127",
    borderRadius: 28,
    padding: 20,
    gap: 10,
  },
  accentLabel: {
    color: "#eab89e",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  accentValue: {
    color: "#fff9f1",
    fontSize: 28,
    fontWeight: "700",
  },
  accentBody: {
    color: "#d8e2dc",
    fontSize: 15,
    lineHeight: 24,
  },
});

