import { StyleSheet } from "react-native";
import { colors } from "../../assets/theme/colors";
export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },

    topHeader: {
        padding: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    balanceRow: { flexDirection: "row", alignItems: "center" },

    totalBalanceText: {
        color: colors.text,

        fontSize: 28,
        fontWeight: "bold",
    },

    subText: {
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 4,
    },

    headerIcons: { flexDirection: "row", gap: 20 },

    iconAction: { fontSize: 22, color: colors.text },

    sectionCard: {
        backgroundColor: colors.card,
        marginHorizontal: 15,
        borderRadius: 16,
        padding: 16,
        marginTop: 15,
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
    },

    sectionTitle: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: "600",
    },

    seeAll: { color: colors.primary, fontWeight: "bold" },

    walletItem: { flexDirection: "row", alignItems: "center" },

    walletIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.walletCash,
        justifyContent: "center",
        alignItems: "center",
    },

    walletName: {
        color: colors.text,
        marginLeft: 12,
        flex: 1,
        fontSize: 16,
    },

    walletValue: { color: colors.text, fontWeight: "bold" },

    reportRow: { flexDirection: "row", marginBottom: 20 },
    reportHalf: { flex: 1, alignItems: "center" },

    reportLabel: {
        color: colors.textSecondary,
        fontSize: 13,
        marginBottom: 5,
    },

    reportValue: { fontSize: 18, fontWeight: "bold" },

    indicator: { height: 2, width: "80%", marginTop: 8 },

    chartPlaceholder: {
        height: 120,
        borderStyle: "dotted",
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: "center",
        alignItems: "center",
    },

    placeholderText: {
        color: colors.textSecondary,
        textAlign: "center",
    },

    tabToggle: {
        flexDirection: "row",
        backgroundColor: "#2C2C2E",
        borderRadius: 8,
        padding: 2,
        marginBottom: 20,
    },

    tabItem: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        borderRadius: 6,
    },

    tabActive: { backgroundColor: "#48484A" },

    tabText: { color: colors.text, fontWeight: "500" },

    spendingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },

    spendingIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },

    spendingName: {
        color: colors.textSecondary,
        marginLeft: 12,
        flex: 1,
    },

    spendingPercent: { fontWeight: "bold" },

    bottomTab: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
        backgroundColor: colors.card,
        flexDirection: "row",
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
        paddingBottom: 10,
    },

    tabBtn: { flex: 1, justifyContent: "center", alignItems: "center" },

    tabLabel: {
        color: colors.textSecondary,
        fontSize: 10,
        marginTop: 4,
    },

    fabContainer: { flex: 1, alignItems: "center", marginTop: -20 },

    fab: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        borderColor: colors.bg,
    },

    fabText: { color: "#FFF", fontSize: 30, fontWeight: "300" },

    emptyBox: { paddingVertical: 30 },
});