import React, { useCallback, useRef, useState } from "react";
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  Pressable,
  Animated,
  ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FileText,
  ClipboardList,
  Receipt,
  MessageCircle,
  Send,
  Bell,
  DollarSign,
  CreditCard,
  CheckCircle,
} from "lucide-react-native";
import { Heading, Typography, Button } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing, borderRadius, shadows } from "@/constants/spacing";
import { storage } from "@/lib/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// Slide data
// ---------------------------------------------------------------------------

interface SlideData {
  id: string;
  title: string;
  description: string;
  icons: {
    main: React.ComponentType<any>;
    left: React.ComponentType<any>;
    right: React.ComponentType<any>;
  };
}

const slides: SlideData[] = [
  {
    id: "manage",
    title: "Manage Your Freelance Business",
    description:
      "Create contracts, track tasks, and invoice clients — all from your phone.",
    icons: { main: FileText, left: ClipboardList, right: Receipt },
  },
  {
    id: "communicate",
    title: "Real-Time Communication",
    description:
      "Chat with clients per project. Stay aligned with contextual conversations.",
    icons: { main: MessageCircle, left: Send, right: Bell },
  },
  {
    id: "paid",
    title: "Get Paid Faster",
    description:
      "AI-generated invoices. Mobile money support. Professional delivery.",
    icons: { main: DollarSign, left: CreditCard, right: CheckCircle },
  },
];

// ---------------------------------------------------------------------------
// Icon composition component
// ---------------------------------------------------------------------------

function IconComposition({ icons }: { icons: SlideData["icons"] }) {
  const MainIcon = icons.main;
  const LeftIcon = icons.left;
  const RightIcon = icons.right;

  return (
    <View style={iconStyles.container}>
      {/* Left supporting icon */}
      <View style={[iconStyles.supportCircle, iconStyles.leftIcon]}>
        <LeftIcon size={28} color={colors.accent} strokeWidth={1.8} />
      </View>

      {/* Main center icon */}
      <View style={iconStyles.mainCircle}>
        <MainIcon size={48} color={colors.white} strokeWidth={1.8} />
      </View>

      {/* Right supporting icon */}
      <View style={[iconStyles.supportCircle, iconStyles.rightIcon]}>
        <RightIcon size={28} color={colors.accent} strokeWidth={1.8} />
      </View>

      {/* Decorative background rings */}
      <View style={iconStyles.ringOuter} />
      <View style={iconStyles.ringInner} />
    </View>
  );
}

const MAIN_CIRCLE = 112;
const SUPPORT_CIRCLE = 64;

const iconStyles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  mainCircle: {
    width: MAIN_CIRCLE,
    height: MAIN_CIRCLE,
    borderRadius: MAIN_CIRCLE / 2,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    ...shadows.lg,
  },
  supportCircle: {
    width: SUPPORT_CIRCLE,
    height: SUPPORT_CIRCLE,
    borderRadius: SUPPORT_CIRCLE / 2,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    zIndex: 2,
  },
  leftIcon: {
    left: SCREEN_WIDTH * 0.15,
    top: 60,
  },
  rightIcon: {
    right: SCREEN_WIDTH * 0.15,
    top: 60,
  },
  ringOuter: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.gray200,
    zIndex: 0,
  },
  ringInner: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: colors.gray100,
    zIndex: 0,
  },
});

// ---------------------------------------------------------------------------
// Single slide component
// ---------------------------------------------------------------------------

function Slide({ item }: { item: SlideData }) {
  return (
    <View style={styles.slide}>
      <View style={styles.iconArea}>
        <IconComposition icons={item.icons} />
      </View>
      <View style={styles.textArea}>
        <Heading level="h1" color={colors.gray900} style={styles.title}>
          {item.title}
        </Heading>
        <Typography
          variant="body"
          color={colors.gray500}
          style={styles.description}
        >
          {item.description}
        </Typography>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dot indicators
// ---------------------------------------------------------------------------

function DotIndicators({ activeIndex }: { activeIndex: number }) {
  return (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const isActive = index === activeIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              isActive ? styles.dotActive : styles.dotInactive,
            ]}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main welcome screen
// ---------------------------------------------------------------------------

export default function WelcomeScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const handleGetStarted = useCallback(async () => {
    await storage.setHasSeenOnboarding();
    router.replace("/(auth)/register");
  }, [router]);

  const handleSignIn = useCallback(async () => {
    await storage.setHasSeenOnboarding();
    router.replace("/(auth)/login");
  }, [router]);

  const handleSkip = useCallback(async () => {
    await storage.setHasSeenOnboarding();
    router.replace("/(auth)/register");
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: SlideData }) => <Slide item={item} />,
    []
  );

  const keyExtractor = useCallback((item: SlideData) => item.id, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Skip button */}
        <Pressable
          onPress={handleSkip}
          style={styles.skipButton}
          hitSlop={12}
        >
          <Typography variant="bodySmall" color={colors.gray400}>
            Skip
          </Typography>
        </Pressable>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <DotIndicators activeIndex={activeIndex} />

          <Button
            title="Get Started"
            onPress={handleGetStarted}
            fullWidth
            size="lg"
            style={styles.ctaButton}
            textStyle={styles.ctaButtonText}
          />

          <Pressable onPress={handleSignIn} hitSlop={8}>
            <Typography
              variant="bodySmall"
              color={colors.gray500}
              style={styles.signInText}
            >
              Already have an account?{" "}
              <Typography
                variant="bodySmall"
                color={colors.accent}
                style={styles.signInLink}
              >
                Sign in
              </Typography>
            </Typography>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    top: spacing[3],
    right: spacing[5],
    zIndex: 10,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  iconArea: {
    flex: 0.55,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    flex: 0.15,
    paddingHorizontal: spacing[8],
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: spacing[3],
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: spacing[8],
    paddingBottom: spacing[6],
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[6],
  },
  dot: {
    marginHorizontal: 5,
    borderRadius: borderRadius.full,
  },
  dotActive: {
    width: 10,
    height: 10,
    backgroundColor: colors.accent,
  },
  dotInactive: {
    width: 8,
    height: 8,
    backgroundColor: colors.gray300,
  },
  ctaButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.xl,
    marginBottom: spacing[4],
  },
  ctaButtonText: {
    fontWeight: "700",
    fontSize: 17,
  },
  signInText: {
    textAlign: "center",
  },
  signInLink: {
    fontWeight: "600",
  },
});
