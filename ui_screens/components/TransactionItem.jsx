import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function TransactionItem({ item }) {
  const isIncome = item.type === "income";

  return (
    <View style={styles.container}>
      <View style={styles.leftSide}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>
        <View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
      </View>
      <Text
        style={[
          styles.amount,
          { color: isIncome ? colors.success : colors.danger },
        ]}
      >
        {item.amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  leftSide: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 45,
    height: 45,
    backgroundColor: colors.grayBg,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  iconText: {
    fontSize: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  date: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
