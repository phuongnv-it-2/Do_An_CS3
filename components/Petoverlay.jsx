import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  TouchableOpacity,
  Modal,
} from "react-native";
import PetChatScreen from "../app/screens/Petchatscreen";

const SPRITESHEET = require("../assets/images/spritesheet.webp");

const FRAME_W = 192;
const FRAME_H = 208;

const ROWS = {
  idle: 0,
  runRight: 1,
  runLeft: 2,
  wave: 3,
  jump: 4,
  failed: 5,
  wait: 6,
  running: 7,
  review: 8,
};

const ROW_FRAMES = {
  idle: 8,
  runRight: 8,
  runLeft: 8,
  wave: 8,
  jump: 8,
  failed: 8,
  wait: 8,
  running: 8,
  review: 8,
};

const PET_SIZE = 80;
const SCALE = PET_SIZE / FRAME_W;
const SHEET_W = FRAME_W * 8 * SCALE;
const SHEET_H = FRAME_H * Object.keys(ROWS).length * SCALE;

const MOVE_SPEED = 1.5;
const FRAME_MS = 120;
const WANDER_MS = 3000;

export default function PetOverlay() {
  const { width: SW, height: SH } = Dimensions.get("window");
  const [chatOpen, setChatOpen] = useState(false);
  const modalAnim = useRef(new Animated.Value(0)).current;

  // ── Open / close chat ──────────────────────────────────────
  const openChat = useCallback(() => {
    triggerState("wave", 400);
    setTimeout(() => {
      setChatOpen(true);
      Animated.spring(modalAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }).start();
    }, 420);
  }, []);

  const closeChat = useCallback(() => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setChatOpen(false));
  }, []);

  // ── Sprite state ───────────────────────────────────────────
  const posX = useRef(SW / 2 - PET_SIZE / 2);
  const posY = useRef(SH / 2 - PET_SIZE / 2);
  const posAnim = useRef(
    new Animated.ValueXY({ x: posX.current, y: posY.current })
  ).current;

  const spriteX = useRef(new Animated.Value(0)).current;
  const spriteY = useRef(new Animated.Value(0)).current;

  const velX = useRef(1.2);
  const velY = useRef(0.6);
  const isDragging = useRef(false);
  const overrideTimer = useRef(null);
  const animStateRef = useRef("runRight");
  const frameIdx = useRef(0);

  const updateSprite = useCallback(
    (state, col) => {
      spriteX.setValue(-(col * FRAME_W * SCALE));
      spriteY.setValue(-(ROWS[state] * FRAME_H * SCALE));
    },
    [spriteX, spriteY]
  );

  const changeState = useCallback(
    (s) => {
      animStateRef.current = s;
      frameIdx.current = 0;
      updateSprite(s, 0);
    },
    [updateSprite]
  );

  const triggerState = useCallback(
    (s, dur) => {
      if (overrideTimer.current) clearTimeout(overrideTimer.current);
      velX.current = 0;
      velY.current = 0;
      changeState(s);
      const ms = dur ?? ROW_FRAMES[s] * FRAME_MS * 2.5;
      overrideTimer.current = setTimeout(() => {
        overrideTimer.current = null;
        if (!isDragging.current) changeState("idle");
      }, ms);
    },
    [changeState]
  );

  // ── Animation loops ────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      const state = animStateRef.current;
      const max = ROW_FRAMES[state] ?? 8;
      frameIdx.current = (frameIdx.current + 1) % max;
      updateSprite(state, frameIdx.current);
    }, FRAME_MS);
    return () => clearInterval(t);
  }, [updateSprite]);

  useEffect(() => {
    const t = setInterval(() => {
      if (isDragging.current || chatOpen) return;
      posX.current += velX.current;
      posY.current += velY.current;

      let bounced = false;
      if (posX.current < 0) {
        posX.current = 0;
        velX.current = Math.abs(velX.current);
        bounced = true;
      } else if (posX.current > SW - PET_SIZE) {
        posX.current = SW - PET_SIZE;
        velX.current = -Math.abs(velX.current);
        bounced = true;
      }
      if (posY.current < 0) {
        posY.current = 0;
        velY.current = Math.abs(velY.current);
        bounced = true;
      } else if (posY.current > SH - PET_SIZE) {
        posY.current = SH - PET_SIZE;
        velY.current = -Math.abs(velY.current);
        bounced = true;
      }
      if (bounced && !overrideTimer.current) {
        changeState(velX.current > 0 ? "runRight" : "runLeft");
      }
      posAnim.setValue({ x: posX.current, y: posY.current });
    }, 16);
    return () => clearInterval(t);
  }, [SW, SH, changeState, posAnim, chatOpen]);

  // Wander AI
  useEffect(() => {
    const wander = () => {
      if (isDragging.current || overrideTimer.current || chatOpen) return;
      if (Math.random() < 0.22) {
        velX.current = 0;
        velY.current = 0;
        changeState(Math.random() < 0.5 ? "idle" : "wait");
      } else {
        const angle = Math.random() * Math.PI * 2;
        velX.current = Math.cos(angle) * MOVE_SPEED;
        velY.current = Math.sin(angle) * MOVE_SPEED;
        changeState(velX.current > 0 ? "runRight" : "runLeft");
      }
    };
    wander();
    const t = setInterval(wander, WANDER_MS);
    return () => clearInterval(t);
  }, [changeState, chatOpen]);

  // ── PanResponder ───────────────────────────────────────────
  const dragBase = useRef({ x: 0, y: 0 });
  const vxSample = useRef(0);
  const vySample = useRef(0);
  const lastDrag = useRef({ x: 0, y: 0, t: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = true;
        if (overrideTimer.current) {
          clearTimeout(overrideTimer.current);
          overrideTimer.current = null;
        }
        velX.current = 0;
        velY.current = 0;
        dragBase.current = { x: posX.current, y: posY.current };
        lastDrag.current = { x: posX.current, y: posY.current, t: Date.now() };
        changeState("jump");
      },
      onPanResponderMove: (_, g) => {
        const now = Date.now();
        const nx = Math.max(
          0,
          Math.min(SW - PET_SIZE, dragBase.current.x + g.dx)
        );
        const ny = Math.max(
          0,
          Math.min(SH - PET_SIZE, dragBase.current.y + g.dy)
        );
        const dt = now - lastDrag.current.t;
        if (dt > 0) {
          vxSample.current = ((nx - lastDrag.current.x) / dt) * 16;
          vySample.current = ((ny - lastDrag.current.y) / dt) * 16;
        }
        lastDrag.current = { x: nx, y: ny, t: now };
        posX.current = nx;
        posY.current = ny;
        posAnim.setValue({ x: nx, y: ny });
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        const speed = Math.sqrt(vxSample.current ** 2 + vySample.current ** 2);
        if (speed > 0.3) {
          const cap = MOVE_SPEED * 4;
          velX.current = Math.max(-cap, Math.min(cap, vxSample.current));
          velY.current = Math.max(-cap, Math.min(cap, vySample.current));
          changeState(velX.current > 0 ? "runRight" : "runLeft");
          const dec = setInterval(() => {
            velX.current *= 0.92;
            velY.current *= 0.92;
            if (Math.abs(velX.current) < 0.1 && Math.abs(velY.current) < 0.1) {
              velX.current = 0;
              velY.current = 0;
              clearInterval(dec);
            }
          }, 50);
        } else {
          changeState("idle");
        }
        vxSample.current = 0;
        vySample.current = 0;
      },
    })
  ).current;

  return (
    <>
      {/* ── Pet sprite ── */}
      <Animated.View
        style={[styles.petWrap, { transform: posAnim.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        {/* Tap → open chat */}
        <TouchableOpacity onPress={openChat} activeOpacity={0.9}>
          <View style={styles.clip}>
            <Animated.Image
              source={SPRITESHEET}
              style={[
                styles.sheet,
                {
                  transform: [{ translateX: spriteX }, { translateY: spriteY }],
                },
              ]}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Chat modal ── */}
      <Modal
        visible={chatOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeChat}
      >
        <PetChatScreen onClose={closeChat} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  petWrap: {
    position: "absolute",
    width: PET_SIZE,
    height: PET_SIZE,
    zIndex: 9999,
    elevation: 9999,
  },
  clip: {
    width: PET_SIZE,
    height: PET_SIZE,
    overflow: "hidden",
  },
  sheet: {
    width: SHEET_W,
    height: SHEET_H,
    position: "absolute",
    top: 0,
    left: 0,
  },
});
