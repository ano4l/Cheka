import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, fontWeights, lineHeights, radii, spacing } from "../lib/theme";
import type { ConversationMessage } from "../lib/types";

interface Props {
  messages: ConversationMessage[];
}

export function ConversationThread({ messages }: Props) {
  if (messages.length === 0) return null;

  return (
    <View style={styles.container}>
      {messages.map((msg, index) => {
        const isAssistant = msg.role === "assistant";
        return (
          <View
            key={`${msg.timestamp}-${index}`}
            style={[
              styles.row,
              isAssistant ? styles.assistantRow : styles.userRow,
            ]}
          >
            <View
              style={[
                styles.avatar,
                isAssistant ? styles.assistantAvatar : styles.userAvatar,
              ]}
            >
              <Ionicons
                name={isAssistant ? "shield-checkmark" : "person"}
                size={12}
                color={isAssistant ? colors.accent : colors.textOnDark}
              />
            </View>
            <View
              style={[
                styles.bubble,
                isAssistant ? styles.assistantBubble : styles.userBubble,
              ]}
            >
              <Text
                style={[
                  styles.content,
                  {
                    color: isAssistant
                      ? colors.textPrimary
                      : colors.textOnDark,
                  },
                ]}
              >
                {msg.content}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  assistantRow: {},
  userRow: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  assistantAvatar: {
    backgroundColor: colors.accentSoft,
  },
  userAvatar: {
    backgroundColor: colors.primary,
  },
  bubble: {
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "80%",
  },
  assistantBubble: {
    backgroundColor: colors.bgSoft,
    borderBottomLeftRadius: radii.xs,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radii.xs,
  },
  content: {
    fontSize: fonts.body,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.body,
  },
});
