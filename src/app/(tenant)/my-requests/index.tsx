import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SelectField } from '@/components/ui/SelectField';
import { formatDate } from '@/lib/format';
import {
  MaintenanceRequestDto,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  getSlaStatus,
  maintenanceService,
  SLA_COLORS,
  SLA_LABELS,
} from '@/services/maintenanceService';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export default function MyRequestsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<MaintenanceRequestDto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await maintenanceService.getMyRequests({
        currentPage,
        pageSize: 10,
        status: statusFilter ? Number(statusFilter) : undefined,
      });
      if (res.success) {
        setRequests(res.data.result);
        setTotalPages(res.data.totalPages);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (isLoading && requests.length === 0) return <LoadingState />;

  return (
    <SafeAreaView className="flex-1 bg-[#e8f5f0]" edges={['bottom']}>
      <View className="gap-3 p-4 pb-0">
        <Button label="+ New Complaint" onPress={() => router.push('/my-requests/create')} />
        <SelectField
          placeholder="Filter by status"
          value={statusFilter}
          options={STATUS_FILTER_OPTIONS}
          onChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        />
      </View>

      <ScrollView
        contentContainerClassName="gap-3 p-4"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor="#025F30" />}
      >
        {requests.length === 0 ? (
          <EmptyState message="No maintenance requests yet." />
        ) : (
          requests.map((r) => {
            const sla = getSlaStatus(r);
            return (
              <Card key={r.id} onPress={() => router.push(`/my-requests/${r.id}`)} className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <Text className="font-mono text-xs text-[#025F30]">{r.ticketNumber}</Text>
                  <Badge label={PRIORITY_LABELS[r.priority]} color={PRIORITY_COLORS[r.priority]} />
                </View>
                <Text className="text-sm font-medium text-gray-900">{r.title}</Text>
                <Text className="text-xs text-gray-500">
                  {r.unitCatalogCode} • {r.categoryName || 'General'} • {formatDate(r.createdAt)}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <Badge label={STATUS_LABELS[r.status]} color={STATUS_COLORS[r.status]} />
                  {sla ? <Badge label={SLA_LABELS[sla]} color={SLA_COLORS[sla]} /> : null}
                </View>
                {(r.assignedToUserName || r.assignedToContractorName) && (
                  <Text className="text-xs text-gray-500">
                    Assigned to: {r.assignedToUserName || r.assignedToContractorName}
                  </Text>
                )}
              </Card>
            );
          })
        )}

        {totalPages > 1 && (
          <View className="flex-row items-center justify-center gap-4 py-2">
            <Pressable disabled={currentPage <= 1} onPress={() => setCurrentPage((p) => p - 1)}>
              <Text className={`text-sm ${currentPage <= 1 ? 'text-gray-300' : 'text-brand'}`}>Prev</Text>
            </Pressable>
            <Text className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </Text>
            <Pressable disabled={currentPage >= totalPages} onPress={() => setCurrentPage((p) => p + 1)}>
              <Text className={`text-sm ${currentPage >= totalPages ? 'text-gray-300' : 'text-brand'}`}>Next</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
