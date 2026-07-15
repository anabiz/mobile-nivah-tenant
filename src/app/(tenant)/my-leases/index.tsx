import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatDate, formatNaira } from '@/lib/format';
import {
  LeaseDto,
  RENT_FREQUENCY,
  canPayForLease,
  getLeaseStatusBadge,
  leaseService,
} from '@/services/leaseService';
import * as WebBrowser from 'expo-web-browser';

export default function MyLeasesScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [leases, setLeases] = useState<LeaseDto[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await leaseService.getMyLeases();
      if (res.success) setLeases(res.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handlePay(leaseId: string) {
    setPayingId(leaseId);
    try {
      const res = await leaseService.payForLease(leaseId);
      if (res.success && res.data?.authorizationUrl) {
        await WebBrowser.openBrowserAsync(res.data.authorizationUrl);
        load();
      }
    } catch {
      // Payment initiation failures surface via the shared axios error toast path in a later pass.
    } finally {
      setPayingId(null);
    }
  }

  if (isLoading && leases.length === 0) return <LoadingState />;

  return (
    <SafeAreaView className="flex-1 bg-[#e8f5f0]" edges={['bottom']}>
      <ScrollView
        contentContainerClassName="gap-3 p-4"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor="#025F30" />}
      >
        {leases.length === 0 ? (
          <EmptyState message="You don't have any leases yet." />
        ) : (
          leases.map((lease) => {
            const badge = getLeaseStatusBadge(lease);
            const canPay = canPayForLease(lease);
            return (
              <Card key={lease.id} onPress={() => router.push(`/my-leases/${lease.id}`)} className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-gray-900">{lease.unitCatalogCode}</Text>
                  <Badge label={badge.label} color={badge.color} />
                </View>
                <Text className="text-xs text-gray-500">{lease.propertyName}</Text>
                {badge.noteBanner ? (
                  <View className="rounded-lg bg-red-50 px-2 py-1.5">
                    <Text className="text-xs text-red-700">{badge.noteBanner}</Text>
                  </View>
                ) : null}
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-gray-700">
                    {formatNaira(lease.rentAmount)}/{RENT_FREQUENCY[lease.rentFrequency]}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {formatDate(lease.startDate)}
                    {lease.endDate ? ` – ${formatDate(lease.endDate)}` : ''}
                  </Text>
                </View>
                {canPay && (
                  <Button
                    label={payingId === lease.id ? 'Opening...' : 'Pay Now'}
                    loading={payingId === lease.id}
                    onPress={() => handlePay(lease.id)}
                  />
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
