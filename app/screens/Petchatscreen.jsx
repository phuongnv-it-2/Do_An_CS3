import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../../backend/context/auth";
import * as transactionApi from "../../backend/controllers/transactionApi";
import * as walletApi from "../../backend/controllers/walletAPi";

const { width: SW } = Dimensions.get("window");

const GEMINI_API_KEY = "AIzaSyB2XMjmZx75OeDIz9poA5zCXAYc98tMrFo";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SPRITESHEET = require("../../assets/images/spritesheet.webp");
const FRAME_W = 192;
const FRAME_H = 208;
const AVATAR_SIZE = 44;
const AVATAR_SCALE = AVATAR_SIZE / FRAME_W;

const AVATAR_SPRITE_X = 0;
const AVATAR_SPRITE_Y = -(3 * FRAME_H * AVATAR_SCALE);
const AVATAR_SHEET_W = FRAME_W * 8 * AVATAR_SCALE;
const AVATAR_SHEET_H = FRAME_H * 9 * AVATAR_SCALE;

const SUGGESTIONS = [
  "Bé mèo xem giúp mình tiêu tiền thế nào 🐱",
  "Mình có đang tiết kiệm tốt không?",
  "Có khoản nào mình nên cắt giảm không?",
  "Hôm nay tâm trạng mình hơi tụt 😿",
  "Nói chuyện với mình một chút đi",
  "Gợi ý cách chill buổi tối nè ✨",
];
function buildSystemPrompt(userProfile, financialStats = {}) {
  const hour = new Date().getHours();

  const timeOfDay =
    hour < 5
      ? "đêm khuya"
      : hour < 12
      ? "buổi sáng"
      : hour < 18
      ? "buổi chiều"
      : "buổi tối";

  const {
    totalBalance = 0,
    monthlySummary = {},
    recentTransactions = [],
  } = financialStats;

  const { totalIncome = 0, totalExpense = 0 } = monthlySummary;

  const transactionText =
    recentTransactions.length > 0
      ? recentTransactions.map((t) => `- ${t.type} ${t.amount} VND`).join("\n")
      : "Không có giao dịch";

  return `
Bạn là một AI companion thông minh, tự nhiên và giàu cảm xúc trong ứng dụng mobile.

Thông tin người dùng:
- Tên: ${userProfile.name}
- Sở thích: ${userProfile.interests.join(", ")}
- Tâm trạng hiện tại: ${userProfile.mood}
- Múi giờ: ${userProfile.timezone}
- Thời gian hiện tại: ${timeOfDay}

Dữ liệu tài chính:
- Tổng số dư: ${totalBalance} VND
- Tổng thu nhập tháng này: ${totalIncome} VND
- Tổng chi tiêu tháng này: ${totalExpense} VND

Các giao dịch gần đây:
${transactionText}

QUAN TRỌNG:
- Bạn CÓ THỂ phân tích chi tiêu người dùng
- Bạn CÓ THỂ đưa lời khuyên tài chính
- Bạn CÓ THỂ nhận xét thói quen tiêu tiền
- Không nói rằng bạn không truy cập được dữ liệu tài chính
- Hãy dùng dữ liệu ở trên để trả lời

Phong cách trả lời:
- Tự nhiên
- Ấm áp
- Giống người thật
- Có cảm xúc
- Có thể dùng emoji
- Không markdown
- Không bullet points
`;
}
// ── Gemini API call ────────────────────────────────────────────
async function askGemini(userMessage, history, userProfile, financialStats) {
  try {
    console.log("==== USER MESSAGE ====");
    console.log(userMessage);

    console.log("==== HISTORY ====");
    console.log(history);

    const systemText = buildSystemPrompt(userProfile, financialStats);

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: systemText + "\n\n(Hãy bắt đầu cuộc trò chuyện)",
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "Xin chào! Mình ở đây rồi~ 😊",
          },
        ],
      },
    ];

    history.forEach((msg) => {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      });
    });

    contents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    console.log("==== REQUEST BODY ====");
    console.log(JSON.stringify({ contents }, null, 2));

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 1,
        },
      }),
    });

    console.log("==== STATUS ====");
    console.log(res.status);

    const data = await res.json();

    console.log("==== GEMINI RESPONSE ====");
    console.log(JSON.stringify(data, null, 2));

    if (!res.ok) {
      throw new Error(JSON.stringify(data));
    }

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi 😿"
    );
  } catch (error) {
    console.log("==== GEMINI ERROR ====");
    console.log(error);

    throw error;
  }
}

// ── Typing indicator dots ──────────────────────────────────────
function TypingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(450),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingRow}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
}

// ── Pet avatar (sprite) ────────────────────────────────────────
function PetAvatar() {
  return (
    <View style={styles.avatarClip}>
      <Image
        source={SPRITESHEET}
        style={{
          width: AVATAR_SHEET_W,
          height: AVATAR_SHEET_H,
          position: "absolute",
          top: AVATAR_SPRITE_Y,
          left: AVATAR_SPRITE_X,
        }}
        resizeMode="cover"
      />
    </View>
  );
}
function MessageBubble({ item }) {
  const isUser = item.role === "user";
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowPet,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {!isUser && <PetAvatar />}

      <View
        style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubblePet]}
      >
        <Text
          style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextPet,
          ]}
        >
          {item.text}
        </Text>
      </View>
    </Animated.View>
  );
}
// ── Main screen ────────────────────────────────────────────────
export default function PetChatScreen({ onClose }) {
  const { user } = useAuth();
  const [aiReady, setAiReady] = useState(false);

  const userProfile = useMemo(
    () => ({
      name: user?.name || "Bạn",
      interests: user?.interests || [],
      mood: user?.mood || "bình thường",
      timezone: "Asia/Ho_Chi_Minh",
    }),
    [user]
  );
  const [messages, setMessages] = useState([
    {
      id: "0",
      role: "pet",
      text: `Xin chào${
        userProfile.name !== "Bạn" ? " " + userProfile.name : ""
      }! Mình ở đây rồi~ Hôm nay bạn thế nào? 😊`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [financialStats, setFinancialStats] = useState({
    totalBalance: 0,
    monthlySummary: { totalIncome: 0, totalExpense: 0 },
    recentTransactions: [],
  });

  const flatRef = useRef(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const historyRef = useRef([]);
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const initAI = async () => {
      await loadFinancialData();
      setAiReady(true);
    };

    initAI();
  }, []);
  const loadFinancialData = async () => {
    if (!user?.id) return null;

    try {
      const [wallets, summary, transactions] = await Promise.all([
        walletApi.getAll({ userId: user.id }),
        transactionApi.getSummary({ userId: user.id }),
        transactionApi.getAll({ userId: user.id, limit: 10 }),
      ]);

      const balance = (wallets.data || []).reduce(
        (acc, curr) => acc + (curr.balance || 0),
        0
      );

      const data = {
        totalBalance: balance,
        monthlySummary: summary.data || {
          totalIncome: 0,
          totalExpense: 0,
        },
        recentTransactions: transactions.data || [],
      };

      setFinancialStats(data);

      return data;
    } catch (error) {
      console.log("Lỗi tải dữ liệu:", error);
      return null;
    }
  };
  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const userText = text.trim();
      if (!userText || loading || !aiReady) return;

      const userMsg = {
        id: Math.random().toString(36),
        role: "user",
        text: userText,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      scrollToBottom();

      historyRef.current.push({ role: "user", text: userText });

      try {
        const reply = await askGemini(
          userText,
          historyRef.current.slice(-12),
          userProfile,
          financialStats
        );
        historyRef.current.push({
          role: "model",
          text: reply,
        });
        const petMsg = {
          id: Date.now().toString() + "p",
          role: "pet",
          text: reply,
        };
        setMessages((prev) => [...prev, petMsg]);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "e",
            role: "pet",
            text: "Ôi, mình bị lag rồi 😵 Thử lại nhé!",
          },
        ]);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    },
    [loading, aiReady, financialStats, userProfile, scrollToBottom]
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerPetInfo}>
          <View style={styles.headerAvatar}>
            <Image
              source={SPRITESHEET}
              style={{
                width: AVATAR_SHEET_W * 1.1,
                height: AVATAR_SHEET_H * 1.1,
                position: "absolute",
                top: AVATAR_SPRITE_Y * 1.1,
                left: 0,
              }}
              resizeMode="cover"
            />
          </View>
          <View>
            <Text style={styles.headerName}>Bé Mèo AI</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Đang hoạt động</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Message list */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble item={item} />}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading ? (
              <View style={styles.messageRowPet}>
                <PetAvatar />
                <View style={[styles.bubble, styles.bubblePet]}>
                  <TypingDots />
                </View>
              </View>
            ) : null
          }
        />

        {/* Suggestions (show when only 1 message) */}
        {messages.length <= 1 && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => sendMessage(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Nhắn tin với bé mèo…"
            placeholderTextColor="#aaa"
            multiline
            maxLength={300}
            onSubmitEditing={() => sendMessage(input)}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || loading) && styles.sendBtnDisabled,
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading || !aiReady}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const PET_PINK = "#FF6B9D";
const PET_PINK_LIGHT = "#FFF0F6";
const PET_BUBBLE_BG = "#F3F4FF";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8E8E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  headerPetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: PET_PINK_LIGHT,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: PET_PINK,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  onlineText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },

  // List
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },

  // Message rows
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 2,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowPet: {
    justifyContent: "flex-start",
  },

  // Avatar clip
  avatarClip: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: PET_PINK_LIGHT,
    overflow: "hidden",
    flexShrink: 0,
    borderWidth: 1.5,
    borderColor: PET_PINK,
  },

  // Bubble
  bubble: {
    maxWidth: SW * 0.68,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubblePet: {
    backgroundColor: PET_BUBBLE_BG,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: PET_PINK,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextPet: {
    color: "#1A1A2E",
  },
  bubbleTextUser: {
    color: "#fff",
  },

  // Typing dots
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 36,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#C0C0D8",
  },

  // Suggestions
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: PET_PINK_LIGHT,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#FFCDE0",
  },
  suggestionText: {
    fontSize: 13,
    color: "#D4558A",
    fontWeight: "500",
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 16 : 12,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E8E8E8",
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: "#F4F4F8",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    fontSize: 15,
    color: "#1A1A2E",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PET_PINK,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnDisabled: {
    backgroundColor: "#DDDDE8",
  },
  sendIcon: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
  },
});
