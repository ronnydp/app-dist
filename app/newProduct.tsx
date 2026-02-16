import { router } from 'expo-router';
import { useState } from 'react';
import { getProducts, saveProduct } from '../services/database';
import{
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NewProductScreen() {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        // Validaciones
        if (!name.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }
        if (!price.trim()) {
            Alert.alert('Error', 'El precio es obligatorio');
            return;
        }
        if (isNaN(parseFloat(price))) {
            Alert.alert('Error', 'El precio debe ser un número válido');
            return;
        }

        const productsExistentes = await getProducts();
        const nombreExiste = productsExistentes.some(
            (p) => p.name.toLowerCase() === name.trim().toLowerCase()
        );

        if (nombreExiste) {
            Alert.alert('Error', 'Ya existe un producto con ese nombre');
            return;
        }

        setLoading(true);

        try {
            await saveProduct({
                name: name.trim(),
                price: parseFloat(price),
                image_url: imageUrl.trim() || undefined,
            });

            Alert.alert('Éxito', 'Producto guardado correctamente', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar el producto');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <View style={styles.form}>
                    <View style={styles.field}>
                        <Text style={styles.label}>Nombre *</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Ej: Producto A"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Precio *</Text>
                        <TextInput
                            style={styles.input}
                            value={price}
                            onChangeText={setPrice}
                            placeholder="Ej: 99.99"
                            keyboardType="decimal-pad"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>URL de imagen (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            value={imageUrl}
                            onChangeText={setImageUrl}
                            placeholder="Ej: https://ejemplo.com/imagen.jpg"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => router.back()}
                        disabled={loading}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? 'Guardando...' : 'Guardar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingTop: 10,
    },
    form: {
        marginBottom: 24,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#fff',
    },
    textArea: {
        height: 90,
        textAlignVertical: 'top',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    submitButton: {
        backgroundColor: '#2563eb',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});