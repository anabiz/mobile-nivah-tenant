import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';
import { LoadingState } from '@/components/ui/LoadingState';
import { MaintenanceTimeline } from '@/components/MaintenanceTimeline';
import { apiErrorMessage } from '@/lib/api';
import { formatDateTime, formatNaira } from '@/lib/format';
import { toast } from '@/lib/toast';
import {
  AttachmentDto,
  COST_PAID_BY,
  COST_TYPE,
  MaintenanceCommentDto,
  MaintenanceCostItemDto,
  MaintenanceRequestDto,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  RNFile,
  STATUS_COLORS,
  STATUS_LABELS,
  TimelineStageDto,
  getSlaStatus,
  maintenanceService,
} from '@/services/maintenanceService';

type Tab = 'details' | 'timeline' | 'costs' | 'comments';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState<MaintenanceRequestDto | null>(null);
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [costItems, setCostItems] = useState<MaintenanceCostItemDto[]>([]);
  const [comments, setComments] = useState<MaintenanceCommentDto[]>([]);
  const [timelineStages, setTimelineStages] = useState<TimelineStageDto[]>([]);
  const [tab, setTab] = useState<Tab>('details');

  const [showInvestigation, setShowInvestigation] = useState(false);
  const [rootCause, setRootCause] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [materialsRequired, setMaterialsRequired] = useState('');
  const [estimatedCompletionHours, setEstimatedCompletionHours] = useState('');
  const [investigationFile, setInvestigationFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmittingInvestigation, setIsSubmittingInvestigation] = useState(false);

  const [showCompletion, setShowCompletion] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  const [costDesc, setCostDesc] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [costPaidBy, setCostPaidBy] = useState(1);
  const [costTypeVal, setCostTypeVal] = useState(1);
  const [isAddingCost, setIsAddingCost] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await maintenanceService.getById(id);
      if (res.success) setJob(res.data);
      const [attachmentsRes, costRes, commentsRes, timelineRes] = await Promise.all([
        maintenanceService.getAttachments(id),
        maintenanceService.getCostItems(id),
        maintenanceService.getComments(id),
        maintenanceService.getTimeline(id),
      ]);
      if (attachmentsRes.success) setAttachments(attachmentsRes.data);
      if (costRes.success) setCostItems(costRes.data);
      if (commentsRes.success) setComments(commentsRes.data);
      if (timelineRes.success) setTimelineStages(timelineRes.data.stages || []);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toRNFile(asset: ImagePicker.ImagePickerAsset): Promise<RNFile> {
    return { uri: asset.uri, name: asset.fileName || `photo-${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' };
  }

  async function pickImage(onPicked: (asset: ImagePicker.ImagePickerAsset) => void) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('Photo library permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) onPicked(result.assets[0]);
  }

  async function handleSubmitInvestigation() {
    const hours = parseInt(estimatedCompletionHours, 10);
    if (!hours || hours <= 0) {
      toast.error('Enter an estimated completion time in hours');
      return;
    }
    setIsSubmittingInvestigation(true);
    try {
      const file = investigationFile ? await toRNFile(investigationFile) : undefined;
      await maintenanceService.submitInvestigation(
        id,
        { rootCause: rootCause || undefined, recommendations: recommendations || undefined, materialsRequired: materialsRequired || undefined, estimatedCompletionHours: hours },
        file,
      );
      toast.success('Investigation submitted, awaiting manager review');
      setRootCause('');
      setRecommendations('');
      setMaterialsRequired('');
      setEstimatedCompletionHours('');
      setInvestigationFile(null);
      setShowInvestigation(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to submit investigation'));
    } finally {
      setIsSubmittingInvestigation(false);
    }
  }

  async function handleSubmitCompletion() {
    if (completionPhotos.length === 0) {
      toast.error('At least one completion photo is required');
      return;
    }
    setIsSubmittingCompletion(true);
    try {
      const files = await Promise.all(completionPhotos.map(toRNFile));
      await maintenanceService.submitCompletion(id, { completionNotes: completionNotes || undefined }, files);
      toast.success('Marked complete, awaiting verification');
      setCompletionNotes('');
      setCompletionPhotos([]);
      setShowCompletion(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to submit completion'));
    } finally {
      setIsSubmittingCompletion(false);
    }
  }

  async function handleAddCost() {
    if (!costDesc || !costAmount) {
      toast.error('Description and amount required');
      return;
    }
    setIsAddingCost(true);
    try {
      await maintenanceService.addCostItem(id, { description: costDesc, amount: parseFloat(costAmount), paidBy: costPaidBy, costType: costTypeVal });
      setCostDesc('');
      setCostAmount('');
      setCostPaidBy(1);
      setCostTypeVal(1);
      const res = await maintenanceService.getCostItems(id);
      if (res.success) setCostItems(res.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to add cost item'));
    } finally {
      setIsAddingCost(false);
    }
  }

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setIsSendingComment(true);
    try {
      await maintenanceService.addComment(id, newComment.trim());
      setNewComment('');
      const res = await maintenanceService.getComments(id);
      if (res.success) setComments(res.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to add comment'));
    } finally {
      setIsSendingComment(false);
    }
  }

  if (isLoading && !job) return <LoadingState />;
  if (!job) return <LoadingState label="Job not found" />;

  const canInvestigate = job.status === 2 || job.status === 9;
  const canDoFieldWork = job.status === 5 || job.status === 9;
  // Cost items can only be added up through Manager Review (1-3), or again while reworking (9)
  const costDisabled = !(job.status <= 3 || job.status === 9);

  return (
    <SafeAreaView className="flex-1 bg-[#e8f5f0]" edges={['bottom']}>
      <View className="gap-2 border-b border-gray-200 bg-white p-4">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="font-mono text-xs text-[#025F30]">{job.ticketNumber}</Text>
          <Badge label={STATUS_LABELS[job.status]} color={STATUS_COLORS[job.status]} />
        </View>
        <Text className="text-base font-semibold text-gray-900">{job.title}</Text>
        <Text className="text-xs text-gray-500">{job.unitCatalogCode}</Text>
      </View>

      <View className="flex-row border-b border-gray-200 bg-white">
        {(['details', 'timeline', 'costs', 'comments'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} className="flex-1 items-center py-3" style={{ borderBottomWidth: tab === t ? 2 : 0, borderBottomColor: '#025F30' }}>
            <Text style={{ color: tab === t ? '#025F30' : '#6b7280', fontWeight: tab === t ? '500' : '400' }} className="text-sm capitalize">{t}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4">
        {tab === 'details' && (
          <>
            <Card className="gap-1.5">
              <Row label="Description" value={job.description} />
              <Row label="Priority" value={PRIORITY_LABELS[job.priority]} />
              <Row label="Category" value={job.categoryName || '—'} />
              <Row label="Reported By" value={job.reportedByName} />
              <Row label="Created" value={formatDateTime(job.createdAt)} />
              {job.totalCost > 0 && <Row label="Total Cost" value={formatNaira(job.totalCost)} />}
              {job.rootCause && <Row label="Root Cause" value={job.rootCause} />}
              {job.recommendations && <Row label="Recommendations" value={job.recommendations} />}
              {job.completionNotes && <Row label="Completion Notes" value={job.completionNotes} />}
            </Card>

            {attachments.length > 0 && (
              <Card className="gap-2">
                <Text className="text-sm font-medium text-gray-900">Attachments</Text>
                <View className="flex-row flex-wrap gap-2">
                  {attachments.map((a) => (
                    <Image key={a.id} source={{ uri: a.fileUrl }} className="h-20 w-20 rounded-lg bg-gray-100" />
                  ))}
                </View>
              </Card>
            )}

            {canInvestigate && (
              <Card className="gap-3">
                <Text className="text-sm font-medium text-gray-900">Submit Investigation</Text>
                {showInvestigation ? (
                  <>
                    <FormInput placeholder="Root cause" value={rootCause} onChangeText={setRootCause} multiline />
                    <FormInput placeholder="Recommendations" value={recommendations} onChangeText={setRecommendations} multiline />
                    <FormInput placeholder="Materials required (optional)" value={materialsRequired} onChangeText={setMaterialsRequired} multiline />
                    <FormInput placeholder="Estimated completion time (hours)" value={estimatedCompletionHours} onChangeText={setEstimatedCompletionHours} keyboardType="numeric" />
                    {investigationFile ? (
                      <Image source={{ uri: investigationFile.uri }} className="h-24 w-24 rounded-lg" />
                    ) : (
                      <Button label="Attach Photo" variant="secondary" onPress={() => pickImage(setInvestigationFile)} />
                    )}
                    <Button
                      label={isSubmittingInvestigation ? 'Submitting...' : 'Submit Findings'}
                      onPress={handleSubmitInvestigation}
                      loading={isSubmittingInvestigation}
                    />
                  </>
                ) : (
                  <Button label="Submit Investigation" onPress={() => setShowInvestigation(true)} />
                )}
              </Card>
            )}

            {canDoFieldWork && (
              <Card className="gap-3">
                <Text className="text-sm font-medium text-gray-900">Work Completion</Text>
                {showCompletion ? (
                  <>
                    <FormInput placeholder="Completion notes" value={completionNotes} onChangeText={setCompletionNotes} multiline />
                    <Text className="text-xs text-gray-500">At least one evidence photo is required.</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {completionPhotos.map((p, idx) => (
                        <Image key={idx} source={{ uri: p.uri }} className="h-20 w-20 rounded-lg" />
                      ))}
                      <Pressable
                        onPress={() => pickImage((asset) => setCompletionPhotos((prev) => [...prev, asset]))}
                        className="h-20 w-20 items-center justify-center rounded-lg border border-dashed border-gray-300"
                      >
                        <Text className="text-xs text-gray-500">+ Add</Text>
                      </Pressable>
                    </View>
                    <Button
                      label={isSubmittingCompletion ? 'Submitting...' : 'Submit & Mark Complete'}
                      onPress={handleSubmitCompletion}
                      loading={isSubmittingCompletion}
                    />
                  </>
                ) : (
                  <Button label="Mark Complete" variant="secondary" onPress={() => setShowCompletion(true)} />
                )}
              </Card>
            )}
          </>
        )}

        {tab === 'timeline' && (
          <Card>
            {timelineStages.length === 0 ? (
              <Text className="text-sm text-gray-500">No timeline available.</Text>
            ) : (
              <MaintenanceTimeline stages={timelineStages} sla={getSlaStatus(job)} slaResolutionDueAt={job.slaResolutionDueAt} />
            )}
          </Card>
        )}

        {tab === 'costs' && (
          <Card className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-gray-900">Cost Items</Text>
              <Text className="text-sm font-semibold text-gray-900">{formatNaira(job.totalCost)}</Text>
            </View>
            {costItems.length === 0 ? (
              <Text className="text-sm text-gray-500">No cost items recorded.</Text>
            ) : (
              costItems.map((item) => (
                <View key={item.id} className="rounded-lg bg-gray-50 px-3 py-2 gap-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-gray-700">{item.description}</Text>
                    <Text className="text-sm font-medium text-gray-900">{formatNaira(item.amount)}</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <View className="rounded bg-gray-200 px-1.5 py-0.5">
                      <Text className="text-[10px] text-gray-600">{COST_TYPE[item.costType] || 'Other'}</Text>
                    </View>
                    <View className="rounded bg-blue-50 px-1.5 py-0.5">
                      <Text className="text-[10px] text-blue-700">{COST_PAID_BY[item.paidBy] || 'Management'}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
            {!costDisabled && (
              <View className="gap-2 border-t border-gray-100 pt-2">
                <FormInput placeholder="Description" value={costDesc} onChangeText={setCostDesc} />
                <FormInput placeholder="Amount" value={costAmount} onChangeText={setCostAmount} keyboardType="numeric" />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Paid By</Text>
                    <View className="flex-row gap-1">
                      <Pressable onPress={() => setCostPaidBy(1)} style={{ backgroundColor: costPaidBy === 1 ? '#025F30' : '#f3f4f6' }} className="flex-1 py-2 rounded-lg items-center">
                        <Text style={{ color: costPaidBy === 1 ? '#fff' : '#4b5563' }} className="text-xs font-medium">Management</Text>
                      </Pressable>
                      <Pressable onPress={() => setCostPaidBy(2)} style={{ backgroundColor: costPaidBy === 2 ? '#025F30' : '#f3f4f6' }} className="flex-1 py-2 rounded-lg items-center">
                        <Text style={{ color: costPaidBy === 2 ? '#fff' : '#4b5563' }} className="text-xs font-medium">Tenant</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Type</Text>
                    <View className="flex-row gap-1">
                      <Pressable onPress={() => setCostTypeVal(1)} style={{ backgroundColor: costTypeVal === 1 ? '#025F30' : '#f3f4f6' }} className="flex-1 py-2 rounded-lg items-center">
                        <Text style={{ color: costTypeVal === 1 ? '#fff' : '#4b5563' }} className="text-xs font-medium">Material</Text>
                      </Pressable>
                      <Pressable onPress={() => setCostTypeVal(2)} style={{ backgroundColor: costTypeVal === 2 ? '#025F30' : '#f3f4f6' }} className="flex-1 py-2 rounded-lg items-center">
                        <Text style={{ color: costTypeVal === 2 ? '#fff' : '#4b5563' }} className="text-xs font-medium">Labour</Text>
                      </Pressable>
                      <Pressable onPress={() => setCostTypeVal(3)} style={{ backgroundColor: costTypeVal === 3 ? '#025F30' : '#f3f4f6' }} className="flex-1 py-2 rounded-lg items-center">
                        <Text style={{ color: costTypeVal === 3 ? '#fff' : '#4b5563' }} className="text-xs font-medium">Other</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
                <Button label={isAddingCost ? 'Adding...' : 'Add'} onPress={handleAddCost} loading={isAddingCost} />
              </View>
            )}
          </Card>
        )}

        {tab === 'comments' && (
          <Card className="gap-3">
            {comments.length === 0 ? (
              <Text className="text-sm text-gray-500">No comments yet.</Text>
            ) : (
              comments.map((c) => (
                <View key={c.id} className="rounded-lg bg-gray-50 px-3 py-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-medium text-gray-900">{c.userName}</Text>
                    <Text className="text-[10px] text-gray-500">{formatDateTime(c.createdAt)}</Text>
                  </View>
                  <Text className="mt-0.5 text-sm text-gray-700">{c.comment}</Text>
                </View>
              ))
            )}
            <View className="flex-row items-center gap-2">
              <FormInput className="flex-1" value={newComment} onChangeText={setNewComment} placeholder="Write a comment..." />
              <Pressable
                onPress={handleAddComment}
                disabled={isSendingComment || !newComment.trim()}
                className="rounded-lg bg-brand px-4 py-2.5"
              >
                <Text className="text-sm font-medium text-white">Send</Text>
              </Pressable>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-xs text-gray-500">{label}</Text>
      <Text className="flex-1 text-right text-sm text-gray-900">{value}</Text>
    </View>
  );
}
