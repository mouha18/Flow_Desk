import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";
import { colors } from "src/constants/colors";
import { borderRadius } from "src/constants/spacing";
import { Ionicons } from "@expo/vector-icons";

// Simple HTML content for Terms and Privacy
const TERMS_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; line-height: 1.6; background: #ffffff; }
    h1 { color: #1a1a1a; font-size: 24px; }
    h2 { color: #333; margin-top: 24px; font-size: 18px; }
    p { color: #555; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Terms of Service</h1>
  <p>Last updated: April 2026</p>
  <h2>1. Acceptance</h2>
  <p>By using FlowDesk, you agree to these terms and conditions. If you do not agree to these terms, please do not use our services.</p>
  <h2>2. Services</h2>
  <p>FlowDesk provides a platform for freelancers and clients to manage contracts, tasks, and payments. We facilitate connections between service providers and clients but are not a party to any contract entered into between users.</p>
  <h2>3. User Responsibilities</h2>
  <p>Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account. Users agree to use the platform in compliance with all applicable laws and regulations.</p>
  <h2>4. Payment Terms</h2>
  <p>FlowDesk facilitates payments between freelancers and clients. We act as an intermediary and are not a payment processor or financial institution. All payment disputes should be resolved directly between parties.</p>
  <h2>5. Limitation of Liability</h2>
  <p>FlowDesk shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the services.</p>
  <h2>6. Privacy</h2>
  <p>Your use of FlowDesk is also governed by our Privacy Policy, which describes how we collect, use, and share your information.</p>
  <h2>7. Changes to Terms</h2>
  <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.</p>
  <h2>8. Contact</h2>
  <p>For questions about these terms, contact us at legal@flowdesk.app</p>
</body>
</html>
`;

const PRIVACY_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; line-height: 1.6; background: #ffffff; }
    h1 { color: #1a1a1a; font-size: 24px; }
    h2 { color: #333; margin-top: 24px; font-size: 18px; }
    p { color: #555; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p>Last updated: April 2026</p>
  <h2>1. Information We Collect</h2>
  <p>We collect information you provide directly, including your name, email address, profile information, and any content you create on the platform such as contracts, tasks, and messages.</p>
  <h2>2. How We Use Information</h2>
  <p>We use information to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your questions and concerns.</p>
  <h2>3. Information Sharing</h2>
  <p>We do not sell your personal information. We share data only with your consent, to comply with legal obligations, to protect our rights, and to facilitate contract fulfillment between users.</p>
  <h2>4. Data Security</h2>
  <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
  <h2>5. Cookies</h2>
  <p>We use cookies and similar technologies to maintain session state, authenticate users, and remember your preferences. You can control cookie preferences through your browser settings.</p>
  <h2>6. Your Rights</h2>
  <p>Depending on your location, you may have rights to access, correct, delete, or port your personal data. Contact us to exercise these rights.</p>
  <h2>7. Contact</h2>
  <p>For privacy concerns or to exercise your rights, contact us at privacy@flowdesk.app</p>
</body>
</html>
`;

export default function LegalScreen() {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "terms" && styles.activeTab]}
          onPress={() => setActiveTab("terms")}
        >
          <Text style={[styles.tabText, activeTab === "terms" && styles.activeTabText]}>Terms</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "privacy" && styles.activeTab]}
          onPress={() => setActiveTab("privacy")}
        >
          <Text style={[styles.tabText, activeTab === "privacy" && styles.activeTabText]}>Privacy</Text>
        </TouchableOpacity>
      </View>
      <WebView
        style={styles.webview}
        originWhitelist={["*"]}
        source={{ html: activeTab === "terms" ? TERMS_HTML : PRIVACY_HTML }}
        scalesPageToFit={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray900,
  },
  headerSpacer: {
    width: 40,
  },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 16, color: colors.gray500 },
  activeTabText: { color: colors.primary, fontWeight: "600" },
  webview: { flex: 1 },
});
