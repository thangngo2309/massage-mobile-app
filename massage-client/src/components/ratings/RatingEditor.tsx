import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AppButton from '@/components/ui/AppButton';
import type { Rating } from '@/types';
import { APP_COLOR } from '@/utils/constant';

interface RatingEditorProps {
  value?: Rating | null;
  saving?: boolean;
  onSubmit: (payload: { rating: number; comment: string }) => void;
}

const RatingEditor = ({ value, saving = false, onSubmit }: RatingEditorProps) => {
  const [rating, setRating] = useState(value?.rating ?? 5);
  const [comment, setComment] = useState(value?.comment ?? '');

  useEffect(() => {
    setRating(value?.rating ?? 5);
    setComment(value?.comment ?? '');
  }, [value?.id, value?.rating, value?.comment]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{value ? 'Đánh giá của bạn' : 'Đánh giá dịch vụ'}</Text>
      <Text style={styles.subtitle}>
        Chia sẻ trải nghiệm sau khi booking đã hoàn thành.
      </Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            activeOpacity={0.7}
            onPress={() => setRating(star)}
            style={styles.starButton}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={31}
              color={APP_COLOR.ACCENT}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        placeholder="Nhận xét về kỹ thuật viên và dịch vụ..."
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />

      <AppButton
        title={value ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
        loading={saving}
        disabled={rating < 1 || rating > 5}
        onPress={() => onSubmit({ rating, comment: comment.trim() })}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: APP_COLOR.SURFACE,
  },
  title: {
    color: APP_COLOR.TEXT,
    fontSize: 17,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 5,
    color: APP_COLOR.MUTED,
    fontSize: 13,
    lineHeight: 19,
  },
  stars: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 13,
  },
  starButton: {
    paddingRight: 8,
    paddingVertical: 2,
  },
  input: {
    minHeight: 104,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLOR.BORDER,
    backgroundColor: '#F8FAFC',
    color: APP_COLOR.TEXT,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 14,
  },
});

export default RatingEditor;
