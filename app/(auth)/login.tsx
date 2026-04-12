import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import { Button, Input, Heading, Typography, Screen } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuth } from "@/hooks/use-auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuthActions();
  const { user, isAuthenticated } = useAuth();
  const hasNavigated = useRef(false);

  // Redirect when authenticated — useEffect to avoid setState during render
  useEffect(() => {
    if (isAuthenticated && user && !hasNavigated.current) {
      hasNavigated.current = true;
      if (user.role === "freelancer") {
        router.replace("/(freelancer)/dashboard");
      } else if (user.role === "client") {
        router.replace("/(client)/dashboard");
      } else {
        router.replace("/(auth)/role-select");
      }
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");
    hasNavigated.current = false;

    try {
      const result = await signIn("password", {
        email,
        password,
        flow: "signIn",
      });

      if (!result.signingIn) {
        setError("Sign in failed. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Heading level="h1">Welcome back</Heading>
          <Typography variant="bodySmall" color={colors.gray500}>
            Sign in to continue to Flowdesk
          </Typography>
        </View>

        <View style={styles.form}>
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
            placeholder="Enter your password"
            secureTextEntry
          />

          {error ? (
            <Typography variant="bodySmall" color={colors.error} style={styles.error}>
              {error}
            </Typography>
          ) : null}

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
          />

          <TouchableOpacity onPress={() => router.push("/(auth)/legal")}>
            <Typography variant="bodySmall" color={colors.primary} style={styles.legalLink}>
              Terms & Privacy
            </Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Typography variant="bodySmall" color={colors.gray500}>
            Don't have an account?{" "}
          </Typography>
          <Link href="/(auth)/register">
            <Typography variant="bodySmall" color={colors.primary} style={styles.link}>
              Create one
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
  legalLink: {
    textAlign: "center",
    marginTop: 16,
  },
});
