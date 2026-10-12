import { Image as ImageIcon, Link as LinkIcon, Tag, X, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Wish, WishInput } from '@/data';
import { errorText, useT } from '@/i18n';
import { fetchLinkPreview, normalizeUrl } from '@/lib/links';
import { goBack } from '@/lib/nav';
import { pickPhoto } from '@/lib/photo';
import { colors, fonts, type } from '@/theme';

import { Field } from './Field';
import { Grabber } from './Sheet';
import { WishImage } from './WishImage';

// Reading a shop's page needs a server when running in a browser, which blocks
// cross-site requests. Until there is one, the offer is only made in native builds.
const canAutoFill = Platform.OS !== 'web';

type Props = {
  // Present when editing an existing wish.
  wish?: Wish;
  onSave: (input: WishInput) => Promise<unknown>;
};

const Chip = ({ label, icon: Icon, onPress }: { label: string; icon: LucideIcon; onPress: () => void }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
    <Icon size={18} color={colors.ink} strokeWidth={1.9} />
    <Text style={styles.chipLabel}>{label}</Text>
  </Pressable>
);

export const WishForm = ({ wish, onSave }: Props) => {
  const insets = useSafeAreaInsets();
  const t = useT();
  const [title, setTitle] = useState(wish?.title ?? '');
  const [note, setNote] = useState(wish?.note ?? '');
  const [url, setUrl] = useState(wish?.url?.replace(/^https?:\/\//, '') ?? '');
  const [price, setPrice] = useState(wish?.price ?? '');
  const [imageUri, setImageUri] = useState(wish?.imageUri ?? null);
  const [showLink, setShowLink] = useState(!!wish?.url);
  const [showPrice, setShowPrice] = useState(!!wish?.price);
  const [lookingUp, setLookingUp] = useState(false);
  const [titleHeight, setTitleHeight] = useState<number>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = title.trim().length > 0 && !saving;
  const hasChips = !imageUri || !showLink || !showPrice;

  const addPhoto = async () => {
    try {
      const uri = await pickPhoto();
      if (uri) setImageUri(uri);
    } catch {
      setError(t.form.photoFailed);
    }
  };

  // Fills in only what is still empty, so nothing the person typed is overwritten.
  const lookUpLink = async () => {
    const link = normalizeUrl(url);
    if (!canAutoFill || !link || (imageUri && price.trim() && title.trim())) return;
    setLookingUp(true);
    const preview = await fetchLinkPreview(link);
    setLookingUp(false);
    if (!preview) return;
    if (preview.imageUri) setImageUri((current) => current ?? preview.imageUri);
    if (preview.price) {
      setPrice((current) => current.trim() || preview.price!);
      setShowPrice(true);
    }
    if (preview.title) setTitle((current) => current.trim() || preview.title!);
  };

  const save = async () => {
    const link = url.trim() ? normalizeUrl(url) : null;
    if (url.trim() && !link) {
      setError(t.form.badLink);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({ title, note, url: link, price, imageUri });
      goBack();
    } catch (caught) {
      setError(errorText(t, caught));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.top}>
        <Grabber />
        <View style={styles.bar}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => goBack()} style={styles.barSide}>
            <Text style={styles.cancel}>{t.common.cancel}</Text>
          </Pressable>
          <Text style={styles.barTitle}>{wish ? t.form.editTitle : t.form.newTitle}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.common.save}
            hitSlop={12}
            disabled={!canSave}
            onPress={save}
            style={[styles.barSide, styles.barRight]}>
            {saving ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={[styles.save, !canSave && styles.saveDisabled]}>{t.common.save}</Text>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {imageUri && (
          <View style={styles.photo}>
            <WishImage uri={imageUri} seed={wish?.id ?? 'new'} iconSize={24} style={styles.photoImage} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.form.removePhoto}
              hitSlop={8}
              onPress={() => setImageUri(null)}
              style={styles.removePhoto}>
              <X size={15} color={colors.white} strokeWidth={2.4} />
            </Pressable>
          </View>
        )}

        <View style={styles.group}>
          <Text style={type.label}>{wish ? t.form.wish : t.form.question}</Text>
          <View>
            {Platform.OS === 'web' && (
              // Native inputs grow with their text; a browser textarea does not, so this
              // invisible copy of the text measures the height the input needs.
              <Text
                aria-hidden
                style={[styles.title, styles.titleMirror]}
                onLayout={(event) => setTitleHeight(event.nativeEvent.layout.height)}>
                {title || ' '}
              </Text>
            )}
            <TextInput
              accessibilityLabel={t.form.wish}
              placeholder={t.form.wishPlaceholder}
              placeholderTextColor={colors.faint}
              value={title}
              onChangeText={setTitle}
              autoFocus={!wish}
              multiline
              submitBehavior="blurAndSubmit"
              style={[styles.title, titleHeight != null && { height: titleHeight }]}
            />
          </View>
        </View>

        <Field
          label={t.form.note}
          placeholder={t.form.notePlaceholder}
          value={note}
          onChangeText={setNote}
          multiline
        />

        {showLink && (
          <View style={styles.group}>
            <Field
              label={t.form.link}
              placeholder={t.form.linkPlaceholder}
              value={url}
              onChangeText={setUrl}
              onBlur={lookUpLink}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {lookingUp && <Text style={type.small}>{t.form.lookingUp}</Text>}
          </View>
        )}

        {showPrice && (
          <Field label={t.form.price} placeholder={t.form.pricePlaceholder} value={price} onChangeText={setPrice} containerStyle={styles.price} />
        )}

        {hasChips && (
          <View style={styles.group}>
            <Text style={type.label}>{t.form.addIfYouLike}</Text>
            <View style={styles.chips}>
              {!imageUri && <Chip label={t.form.photo} icon={ImageIcon} onPress={addPhoto} />}
              {!showLink && <Chip label={t.form.link} icon={LinkIcon} onPress={() => setShowLink(true)} />}
              {!showPrice && <Chip label={t.form.price} icon={Tag} onPress={() => setShowPrice(true)} />}
            </View>
            {!showLink && canAutoFill && (
              <Text style={[type.sub, styles.hint]}>{t.form.autoFillHint}</Text>
            )}
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { paddingTop: 10, paddingHorizontal: 24 },
  bar: { flexDirection: 'row', alignItems: 'center', height: 32, marginTop: -6 },
  barSide: { flex: 1 },
  barRight: { alignItems: 'flex-end' },
  barTitle: { ...fonts.semibold, fontSize: 17, color: colors.ink },
  cancel: { ...fonts.sans, fontSize: 17, color: colors.muted },
  save: { ...fonts.semibold, fontSize: 17, color: colors.accent },
  saveDisabled: { opacity: 0.4 },
  content: { paddingHorizontal: 24, paddingTop: 28, gap: 24 },
  group: { gap: 10 },
  photo: { alignSelf: 'flex-start' },
  photoImage: { width: 112, height: 112, borderRadius: 16 },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  title: {
    ...fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    paddingTop: 4,
    paddingBottom: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.ink,
    // Browsers draw their own focus ring unless the outline is solid and zero-width.
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  titleMirror: { position: 'absolute', left: 0, right: 0, opacity: 0, pointerEvents: 'none' },
  price: { width: 150 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    paddingHorizontal: 17,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CFC6B3',
  },
  chipLabel: { ...fonts.sans, fontSize: 16.5, color: colors.ink },
  pressed: { opacity: 0.6 },
  hint: { marginTop: 8 },
  error: { ...fonts.medium, fontSize: 14.5, color: colors.danger },
});
