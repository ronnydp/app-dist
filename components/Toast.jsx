import { useToast } from "../contexts/ToastsContext";
import { View, Text, StyleSheet } from "react-native";

export default function Toast() {
    const { toast } = useToast();

    if (!toast.visible) {
        return null;
    }

    const isError = toast.type === 'error';

    return (
        <View style={[styles.container, isError ? styles.error : styles.success]}>
            <Text style={styles.text}>
                {toast.message}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 2,
    borderRadius: 8,
    zIndex: 999,
  },
  success: {
    backgroundColor: '#16a34a',
  },
  error: {
    backgroundColor: '#ef4444',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});