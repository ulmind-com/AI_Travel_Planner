import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImagePlus, X } from 'lucide-react-native';
import { AppText, Button, Input, SelectChip } from '../../components/ui';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, spacing } from '../../theme';
import { createPost } from '../../services/communityService';
import { pickImages, PickedImage } from '../../lib/imagePicker';
import { apiErrorMessage } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import type { MainStackScreenProps } from '../../navigation/types';

const CATEGORIES = ['Story', 'Tips', 'Question', 'Guide', 'Review', 'Meetup'];

export function CreatePostScreen({ navigation }: MainStackScreenProps<'CreatePost'>) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Story');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<PickedImage[]>([]);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);

  const pick = async () => {
    const picked = await pickImages(5);
    if (picked.length) setImages(prev => [...prev, ...picked].slice(0, 5));
  };

  const submit = async () => {
    setError('');
    if (!content.trim()) return setError('Write something to share.');
    setPosting(true);
    try {
      await createPost({
        title: title.trim() || undefined,
        content: content.trim(),
        category,
        tags: tags.trim() || undefined,
        images,
      });
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
      navigation.goBack();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <X size={20} color={colors.ink700} />
        </Pressable>
        <AppText variant="h3">New post</AppText>
        <View style={styles.circle} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding">
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Input
            label="Title (optional)"
            placeholder="A catchy title"
            value={title}
            onChangeText={setTitle}
          />
          <View style={{ height: spacing.lg }} />
          <AppText variant="label" color={colors.ink600} style={styles.lbl}>
            WHAT'S ON YOUR MIND?
          </AppText>
          <TextInput
            style={styles.textarea}
            placeholder="Share a travel story, tip or question…"
            placeholderTextColor={colors.ink400}
            value={content}
            onChangeText={setContent}
            multiline
            selectionColor={colors.brand}
          />

          <AppText variant="label" color={colors.ink600} style={styles.lbl}>
            CATEGORY
          </AppText>
          <View style={styles.wrapRow}>
            {CATEGORIES.map(c => (
              <SelectChip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>

          <View style={{ height: spacing.lg }} />
          <Input
            label="Tags (comma separated)"
            placeholder="japan, budget, solo"
            autoCapitalize="none"
            value={tags}
            onChangeText={setTags}
          />

          <AppText variant="label" color={colors.ink600} style={styles.lbl}>
            PHOTOS
          </AppText>
          <View style={styles.imagesRow}>
            {images.map((img, i) => (
              <View key={i} style={styles.thumb}>
                <Image source={{ uri: img.uri }} style={styles.thumbImg} />
                <Pressable
                  style={styles.removeThumb}
                  onPress={() => setImages(prev => prev.filter((_, idx) => idx !== i))}>
                  <X size={12} color={colors.white} />
                </Pressable>
              </View>
            ))}
            {images.length < 5 ? (
              <Pressable style={styles.addImage} onPress={pick}>
                <ImagePlus size={22} color={colors.ink400} />
              </Pressable>
            ) : null}
          </View>

          {error ? (
            <AppText variant="caption" color={colors.danger} style={{ marginTop: spacing.md }}>
              {error}
            </AppText>
          ) : null}

          <View style={{ height: spacing.xl }} />
          <Button label="Publish post" loading={posting} onPress={submit} />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  lbl: { marginTop: spacing.xl, marginBottom: spacing.md, marginLeft: 4, letterSpacing: 1 },
  textarea: {
    minHeight: 130,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink900,
    textAlignVertical: 'top',
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  thumb: { width: 76, height: 76, borderRadius: radius.md, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  removeThumb: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImage: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
