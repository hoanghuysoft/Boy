import { COLLECTIONS, GalleryCollection, SPECIAL_MEMORIES } from "@/constants/app";
import { Image } from "expo-image";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const MEMORY_LABELS = ["Golden Hour", "City Lights", "Solitude", "Wanderlust"];

const THUMB_SIZE = 84;
const THUMB_GAP = 10;
function GalleryScreen() {
    const insets = useSafeAreaInsets();

    return (
        <>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: insets.top * 2, paddingBottom: 150, backgroundColor: "#FFFFFF" },
                ]}
            >
                <View style={styles.root1}>
                    <View style={styles.info}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>GV</Text>
                        </View>
                        <View style={styles.subtitleRow}>
                            <Text style={styles.badge}>VIP</Text>
                            <View style={styles.dot} />
                            <Text style={styles.subtitle}>
                                1,234 Shots
                            </Text>
                        </View>
                    </View>

                    <Image
                        source={{ uri: "https://images.unsplash.com/photo-1682685794700-1f3e5c7b6d8e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80" }}
                        style={styles.avatar}
                        contentFit="cover"
                        transition={200}
                    />
                </View>

                <View style={styles.sections}>
                    {COLLECTIONS.map((collection) => (
                        <CollectionSection key={collection.title} collection={collection} />
                    ))}
                </View>

                <View style={styles.root}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.titleRow}>
                                <Text style={styles.title}>Special Memories</Text>
                            </View>
                            <Text style={styles.subtitle}>Moments worth keeping</Text>
                        </View>
                        <View style={styles.count}>
                            <Text style={styles.countText}>{SPECIAL_MEMORIES.length}</Text>
                        </View>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.cards}
                        snapToInterval={244 + 14}
                        decelerationRate="fast"
                    >
                        {SPECIAL_MEMORIES.map((uri, i) => (
                            <Pressable
                                key={uri}
                                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                            >
                                <Image
                                    source={{ uri }}
                                    style={StyleSheet.absoluteFill}
                                    contentFit="cover"
                                    transition={250}
                                />
                                <View style={[StyleSheet.absoluteFill, styles.overlay]} />
                                <View style={styles.cardText}>
                                    <Text style={styles.cardTitle}>
                                        {MEMORY_LABELS[i % MEMORY_LABELS.length]}
                                    </Text>
                                    <Text style={styles.cardMeta}>Memory · 2025</Text>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
        </>
    );
}

export default GalleryScreen;

function ActionButton({
  icon,
  active,
}: {
  icon: "share" | "bookmark";
  active?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
      hitSlop={6}
    >
    </Pressable>
  );
}

function CollectionSection({ collection }: { collection: GalleryCollection }) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft2}>
          <View style={styles.titleRow2}>
            <Text style={styles.title}>{collection.title}</Text>
          </View>
          <Text style={styles.meta}>
            {collection.images} Images · {collection.videos} Videos
          </Text>
        </View>
        <View style={styles.actions}>
          <ActionButton icon="share" />
          <ActionButton icon="bookmark" active={collection.saved} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbs}
      >
        {collection.thumbnails.map((uri, i) => (
          <Image
            key={`${uri}-${i}`}
            source={{ uri }}
            style={styles.thumb}
            contentFit="cover"
            transition={200}
          />
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    content: {
        gap: 28,
    },
    sections: {
        gap: 28,
    },
    root1: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 22,
    },
    info: {
        gap: 4,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
    },
    name: {
        fontWeight: "700",
        fontSize: 30,
        color: "#0E0E0E",
        letterSpacing: -0.5,
    },
    subtitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    subtitle: {
        fontWeight: "600",
        fontSize: 14,
        color: "#1d1d1d",
    },
    badge: {
        fontWeight: "600",
        color: "#FF7A1A",
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: "#000000",
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#DDEFFB",
    },
    root3: {
        gap: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 22,
    },
    headerLeft: {
        gap: 3,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
    },
    title: {
        fontWeight: "700",
        fontSize: 20,
        color: "#111",
    },
    subtitle1: {
        fontWeight: "500",
        fontSize: 13,
        color: "#9A9A9A",
    },
    count: {
        minWidth: 28,
        height: 28,
        paddingHorizontal: 9,
        borderRadius: 14,
        backgroundColor: "#111",
        alignItems: "center",
        justifyContent: "center",
    },
    countText: {
        fontWeight: "700",
        fontSize: 13,
        color: "#fff",
    },
    cards: {
        paddingHorizontal: 22,
        gap: 14,
    },
    card: {
        width: 244,
        height: 320,
        borderRadius: 28,
        overflow: "hidden",
        backgroundColor: "#EFEFEF",
        justifyContent: "flex-end",
    },
    cardPressed: {
        opacity: 0.92,
    },
    overlay: {
        backgroundColor: "rgba(0,0,0,0.22)",
    },
    badge1: {
        position: "absolute",
        top: 14,
        right: 14,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "rgba(0,0,0,0.35)",
        alignItems: "center",
        justifyContent: "center",
    },
    cardText: {
        padding: 18,
        gap: 3,
    },
    cardTitle: {
        fontWeight: "700",
        fontSize: 22,
        color: "#fff",
    },
    cardMeta: {
        fontWeight: "500",
        fontSize: 13,
        color: "rgba(255,255,255,0.85)",
    },
    section: {
    gap: 14,
  },
  header1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  headerLeft2: {
    gap: 3,
  },
  titleRow2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title2: {
    fontSize: 18,
    color: "#111",
  },
  meta: {
    fontSize: 13,
    color: "#9A9A9A",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnPressed: {
    backgroundColor: "#E8E8E8",
  },
  thumbs: {
    paddingHorizontal: 22,
    gap: THUMB_GAP,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 18,
    backgroundColor: "#EFEFEF",
  },
});

export { GalleryScreen };

