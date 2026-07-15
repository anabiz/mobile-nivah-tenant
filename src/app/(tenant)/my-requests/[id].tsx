import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormInput } from '@/components/ui/FormInput';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { apiErrorMessage } from '@/lib/api';
import { formatDateTime, formatNaira } from '@/lib/format';
import { toast } from '@/lib/toast';
import {
  AttachmentDto,
  CANCELLABLE_STATUSES,
  MaintenanceCommentDto,
  MaintenanceRequestDto,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  getSlaStatus,
  SLA_COLORS,
  SLA_LABELS,
  maintenanceService,
} from '@/services/maintenanceService';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [request, setRequest] = useState<MaintenanceRequestDto | null>(null);
  const [comments, setComments] = useState<MaintenanceCommentDto[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);

  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await maintenanceService.getById(id);
      if (res.success) setRequest(res.data);
      const [commentsRes, attachmentsRes] = await Promise.all([
        maintenanceService.getComments(id),
        maintenanceService.getAttachments(id),
      ]);
      if (commentsRes.success) setComments(commentsRes.data);
      if (attachmentsRes.success) setAttachments(attachmentsRes.data);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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

  async function handleCancel() {
    setIsCancelling(true);
    try {
      await maintenanceService.cancel(id);
      toast.success('Request cancelled');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to cancel'));
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleVerify(approved: boolean) {
    setIsVerifying(true);
    try {
      await maintenanceService.verify(id, { approved, feedback: verifyFeedback || undefined });
      toast.success(approved ? 'Request approved & closed' : 'Sent back for rework');
      setVerifyFeedback('');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to verify'));
    } finally {
      setIsVerifying(false);
    }
  }

  if (isLoading && !request) return <LoadingState />;
  if (!request) return <EmptyState message="Request not found." />;

  const sla = getSlaStatus(request);
  const canCancel = request.createdByUserId === user?.id && CANCELLABLE_STATUSES.includes(request.status);
  const canVerify = request.status === 6;

  return (
    <SafeAreaView className="flex-1 bg-[#e8f5f0]" edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-4 p-4">
        <Card className="gap-2">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="font-mono text-xs text-[#025F30]">{request.ticketNumber}</Text>
            <Badge label={STATUS_LABELS[request.status]} color={STATUS_COLORS[request.status]} />
            <Badge label={PRIORITY_LABELS[request.priority]} color={PRIORITY_COLORS[request.priority]} />
            {sla ? <Badge label={SLA_LABELS[sla]} color={SLA_COLORS[sla]} /> : null}
          </View>
          <Text className="text-base font-semibold text-gray-900">{request.title}</Text>
          <Text className="text-sm text-gray-600">{request.description}</Text>
        </Card>

        <Card className="gap-1.5">
          <Row label="Unit" value={request.unitCatalogCode} />
          <Row label="Category" value={request.categoryName || '—'} />
          <Row label="Assigned" value={request.assignedToUserName || request.assignedToContractorName || 'Unassigned'} />
          <Row label="Created" value={formatDateTime(request.createdAt)} />
          {request.resolvedAt && <Row label="Resolved" value={formatDateTime(request.resolvedAt)} />}
          {request.totalCost > 0 && <Row label="Cost" value={formatNaira(request.totalCost)} />}
        </Card>

        {(request.rootCause || request.recommendations || request.completionNotes) && (
          <Card className="gap-1.5">
            <Text className="text-sm font-medium text-gray-900">Investigation & Completion</Text>
            {request.rootCause && <Text className="text-sm text-gray-600">Root cause: {request.rootCause}</Text>}
            {request.recommendations && <Text className="text-sm text-gray-600">Recommendations: {request.recommendations}</Text>}
            {request.completionNotes && <Text className="text-sm text-gray-600">Completion notes: {request.completionNotes}</Text>}
          </Card>
        )}

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

        {canVerify && (
          <Card className="gap-2 border-indigo-200 bg-indigo-50">
            <Text className="text-sm font-medium text-indigo-900">Awaiting Your Verification</Text>
            <FormInput placeholder="Feedback (optional)" value={verifyFeedback} onChangeText={setVerifyFeedback} multiline />
            <View className="flex-row gap-2">
              <Button label="Approve" onPress={() => handleVerify(true)} loading={isVerifying} className="flex-1" />
              <Button label="Request Rework" variant="danger" onPress={() => handleVerify(false)} loading={isVerifying} className="flex-1" />
            </View>
          </Card>
        )}

        {canCancel && (
          <Button label={isCancelling ? 'Cancelling...' : 'Cancel Request'} variant="outline" onPress={handleCancel} loading={isCancelling} />
        )}

        <Card className="gap-3">
          <Text className="text-sm font-medium text-gray-900">Comments</Text>
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
            <FormInput
              className="flex-1"
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Write a comment..."
            />
            <Pressable
              onPress={handleAddComment}
              disabled={isSendingComment || !newComment.trim()}
              className="rounded-lg bg-brand px-4 py-2.5"
            >
              <Text className="text-sm font-medium text-white">Send</Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-xs text-gray-500">{label}</Text>
      <Text className="text-sm text-gray-900">{value}</Text>
    </View>
  );
}
