import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormInput } from '@/components/ui/FormInput';
import { LoadingState } from '@/components/ui/LoadingState';
import { apiErrorMessage } from '@/lib/api';
import { formatDate, formatDateTime, formatNaira } from '@/lib/format';
import { toast } from '@/lib/toast';
import {
  LeaseDto,
  PAYMENT_STATUS,
  PaymentDto,
  RENEWAL_STATUS,
  RENT_FREQUENCY,
  getLeaseStatusBadge,
  leaseService,
} from '@/services/leaseService';

export default function LeaseDetailScreen() {
  const { leaseId } = useLocalSearchParams<{ leaseId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [lease, setLease] = useState<LeaseDto | null>(null);
  const [payments, setPayments] = useState<PaymentDto[]>([]);

  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [proposedEndDate, setProposedEndDate] = useState('');
  const [proposedRentAmount, setProposedRentAmount] = useState('');
  const [renewalNotes, setRenewalNotes] = useState('');
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leasesRes, paymentsRes] = await Promise.all([leaseService.getMyLeases(), leaseService.getPayments(leaseId)]);
      if (leasesRes.success) {
        const found = leasesRes.data.find((l) => l.id === leaseId) ?? null;
        setLease(found);
      }
      if (paymentsRes.success) setPayments(paymentsRes.data);
    } finally {
      setIsLoading(false);
    }
  }, [leaseId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRequestRenewal() {
    if (!proposedEndDate) {
      toast.error('Enter a proposed end date (YYYY-MM-DD)');
      return;
    }
    setIsSubmittingRenewal(true);
    try {
      await leaseService.requestRenewal(leaseId, {
        proposedEndDate,
        proposedRentAmount: proposedRentAmount ? parseFloat(proposedRentAmount) : undefined,
        notes: renewalNotes || undefined,
      });
      toast.success('Renewal requested');
      setShowRenewalForm(false);
      setProposedEndDate('');
      setProposedRentAmount('');
      setRenewalNotes('');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to request renewal'));
    } finally {
      setIsSubmittingRenewal(false);
    }
  }

  if (isLoading && !lease) return <LoadingState />;
  if (!lease) return <EmptyState message="Lease not found." />;

  const badge = getLeaseStatusBadge(lease);
  const canRequestRenewal = lease.status === 1 && !!lease.endDate && lease.renewalStatus !== 1;

  return (
    <SafeAreaView className="flex-1 bg-[#e8f5f0]" edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-4 p-4">
        <Card className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">{lease.unitCatalogCode}</Text>
            <Badge label={badge.label} color={badge.color} />
          </View>
          <Text className="text-sm text-gray-500">{lease.propertyName}</Text>
          {badge.noteBanner ? (
            <View className="rounded-lg bg-red-50 px-2 py-1.5">
              <Text className="text-xs text-red-700">{badge.noteBanner}</Text>
            </View>
          ) : null}
          <View className="flex-row justify-between border-t border-gray-100 pt-2">
            <Text className="text-xs text-gray-500">Rent</Text>
            <Text className="text-sm text-gray-900">
              {formatNaira(lease.rentAmount)}/{RENT_FREQUENCY[lease.rentFrequency]}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-gray-500">Start Date</Text>
            <Text className="text-sm text-gray-900">{formatDate(lease.startDate)}</Text>
          </View>
          {lease.endDate && (
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">End Date</Text>
              <Text className="text-sm text-gray-900">{formatDate(lease.endDate)}</Text>
            </View>
          )}
          {lease.notes && !badge.noteBanner ? <Text className="text-xs text-gray-500">{lease.notes}</Text> : null}
          {lease.renewalStatus > 0 && (
            <Badge label={RENEWAL_STATUS[lease.renewalStatus].label} color={RENEWAL_STATUS[lease.renewalStatus].color} />
          )}
        </Card>

        {canRequestRenewal && (
          <Card className="gap-3">
            <Text className="text-sm font-medium text-gray-900">Lease Renewal</Text>
            {showRenewalForm ? (
              <>
                <FormInput
                  label="Proposed end date (YYYY-MM-DD)"
                  value={proposedEndDate}
                  onChangeText={setProposedEndDate}
                  placeholder="2027-01-31"
                />
                <FormInput
                  label="Proposed rent (optional)"
                  value={proposedRentAmount}
                  onChangeText={setProposedRentAmount}
                  keyboardType="numeric"
                  placeholder={String(lease.rentAmount)}
                />
                <FormInput label="Notes (optional)" value={renewalNotes} onChangeText={setRenewalNotes} multiline />
                <View className="flex-row gap-2">
                  <Button
                    label={isSubmittingRenewal ? 'Submitting...' : 'Submit Request'}
                    loading={isSubmittingRenewal}
                    onPress={handleRequestRenewal}
                    className="flex-1"
                  />
                  <Button label="Cancel" variant="secondary" onPress={() => setShowRenewalForm(false)} className="flex-1" />
                </View>
              </>
            ) : (
              <Button label="Request Renewal" onPress={() => setShowRenewalForm(true)} />
            )}
          </Card>
        )}

        <View>
          <Text className="mb-2 text-sm font-medium text-gray-900">Payment History</Text>
          {payments.length === 0 ? (
            <EmptyState message="No payments recorded yet." />
          ) : (
            <View className="gap-2">
              {payments.map((p) => (
                <Card key={p.id} className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm text-gray-900">{formatNaira(p.amount)}</Text>
                    <Text className="text-xs text-gray-500">{formatDateTime(p.paymentDate ?? p.createdAt)}</Text>
                    {p.receiptNumber ? <Text className="text-xs text-gray-400">Receipt: {p.receiptNumber}</Text> : null}
                  </View>
                  <Badge label={PAYMENT_STATUS[p.status].label} color={PAYMENT_STATUS[p.status].color} />
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
