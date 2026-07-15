import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';
import { SelectField, type SelectOption } from '@/components/ui/SelectField';
import { useAuth } from '@/contexts/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  MaintenanceCategoryDto,
  PRIORITY_LABELS,
  RNFile,
  UnitDto,
  maintenanceService,
} from '@/services/maintenanceService';

const PRIORITY_OPTIONS: SelectOption[] = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));

export default function CreateRequestScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [units, setUnits] = useState<UnitDto[]>([]);
  const [categories, setCategories] = useState<MaintenanceCategoryDto[]>([]);
  const [unitId, setUnitId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('2');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    maintenanceService.getMyUnits().then((res) => {
      if (res.success) setUnits(res.data);
    });
    if (user?.clusterAccountId) {
      maintenanceService.getCategories(user.clusterAccountId).then((res) => {
        if (res.success) setCategories(res.data);
      });
    }
  }, [user?.clusterAccountId]);

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('Photo library permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0]);
    }
  }

  async function handleSubmit() {
    if (!unitId || !title || !description) {
      toast.error('Unit, title, and description are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await maintenanceService.create({
        unitId,
        categoryId: categoryId || undefined,
        title,
        description,
        priority: parseInt(priority, 10),
        reportedByName: user?.name || 'Tenant',
        reportedByPhone: phone || undefined,
      });
      if (created.success && photo) {
        const file: RNFile = {
          uri: photo.uri,
          name: photo.fileName || `photo-${Date.now()}.jpg`,
          type: photo.mimeType || 'image/jpeg',
        };
        await maintenanceService.uploadAttachments(created.data.id, [file], 'General');
      }
      toast.success('Maintenance request submitted');
      router.back();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to submit request'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const unitOptions: SelectOption[] = units.map((u) => ({ value: u.id, label: u.catalogCode }));
  const categoryOptions: SelectOption[] = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-3 p-4">
        <SelectField label="Unit" placeholder="Select unit" value={unitId} options={unitOptions} onChange={setUnitId} />
        <SelectField
          label="Category (optional)"
          placeholder="Select category"
          value={categoryId}
          options={categoryOptions}
          onChange={setCategoryId}
        />
        <FormInput label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Leaking kitchen tap" />
        <FormInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue"
          multiline
          numberOfLines={4}
          className="min-h-24"
        />
        <SelectField label="Priority" value={priority} options={PRIORITY_OPTIONS} onChange={setPriority} />
        <FormInput label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <View>
          <Text className="mb-1 text-xs text-gray-500">Photo (optional)</Text>
          {photo ? (
            <Pressable onPress={handlePickPhoto}>
              <Image source={{ uri: photo.uri }} className="h-40 w-full rounded-lg" resizeMode="cover" />
            </Pressable>
          ) : (
            <Button label="Add Photo" variant="secondary" onPress={handlePickPhoto} />
          )}
        </View>

        <Button label={isSubmitting ? 'Submitting...' : 'Submit Complaint'} loading={isSubmitting} onPress={handleSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}
