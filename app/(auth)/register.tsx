import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Link, useRouter } from "expo-router";
import { Button, Input, Heading, Typography, Screen } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { useAuthActions } from "@convex-dev/auth/react";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuthActions();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("password", {
        email,
        password,
        name,
        flow: "signUp",
      });

      // If signIn throws, we won't reach here — catch handles it
      // On success, redirect to role-select to choose freelancer/client
      router.replace("/(auth)/role-select");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Heading level="h1">Create account</Heading>
          <Typography variant="bodySmall" color={colors.gray500}>
            Join Flowdesk and start working
          </Typography>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            autoCapitalize="words"
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry
          />

          {error ? (
            <Typography variant="bodySmall" color={colors.error} style={styles.error}>
              {error}
            </Typography>
          ) : null}

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
          />
        </View>

        <View style={styles.footer}>
          <Typography variant="bodySmall" color={colors.gray500}>
            Already have an account?{" "}
          </Typography>
          <Link href="/(auth)/login">
            <Typography variant="bodySmall" color={colors.primary} style={styles.link}>
              Sign in
            </Typography>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing[6],
  },
  header: {
    marginBottom: spacing[8],
  },
  form: {
    marginBottom: spacing[6],
  },
  error: {
    marginBottom: spacing[4],
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  link: {
    fontWeight: "600",
  },
});
