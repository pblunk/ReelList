import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface StarRatingProps {
    rating: number; // 0 to 5
    onRate?: (rating: number) => void;
    readonly?: boolean;
    size?: number;
    color?: string;
}

export function StarRating({
    rating,
    onRate,
    readonly = false,
    size = 24,
    color
}: StarRatingProps) {
    // Cinematic Gold for stars, or fallback to theme tint if provided
    const starColor = color || '#FFC107';

    const handlePress = (value: number) => {
        if (!readonly && onRate) {
            if (value === rating) {
                onRate(0); // Clear rating
            } else {
                onRate(value);
            }
        }
    };

    return (
        <View style={styles.container}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => handlePress(star)}
                    disabled={readonly}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={size}
                        color={starColor}
                        style={styles.star}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        marginRight: 4,
    },
});
