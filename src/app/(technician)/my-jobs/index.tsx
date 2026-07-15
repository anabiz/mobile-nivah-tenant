import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { StatTile } from '@/components/ui/StatTile';
import { formatDate } from '@/lib/format';
import {
  MaintenanceRequestDto,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  maintenanceService,
} from '@/services/maintenanceService';

const FILTER_TABS: { label: string; status?: number }[] = [
  { label: 'All' },
  { label: 'Assigned', status: 2 },
  { label: 'In Progress', status: 3 },
  { label: 'Rework', status: 9 },
  { label: 'Completed', status: 7 },
];

export default function MyJobsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<MaintenanceRequestDto[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const load = useCallback(async (status?: number) => {
    setIsLoading(true);
    try {
      const res = await maintenanceService.getMyRequests({ pageSize: 100, status });
      if (res.success) setJobs(res.data.result);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(FILTER_TABS[activeTab].status);
    }, [load, activeTab]),
  );

  const stats = useMemo(
    () => ({
      assigned: jobs.filter((j) => j.status === 2).length,
      inProgress: jobs.filter((j) => j.status === 3).length,
      awaitingVerification: jobs.filter((j) => j.status === 6).length,
      completed: jobs.filter((j) => j.status === 7).length,
    }),
    [jobs],
  );

  if (isLoading && jobs.length === 0) return <LoadingState />;

  return (
    <SafeAreaView className="flex-1 bg-[#e8f5f0]" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-4 p-4"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => load(FILTER_TABS[activeTab].status)} tintColor="#025F30" />}
      >
        <Text className="text-xl font-semibold text-[#025F30]">My Jobs</Text>

        <View className="flex-row flex-wrap gap-3">
          <StatTile label="Assigned" value={stats.assigned} />
          <StatTile label="In Progress" value={stats.inProgress} />
          <StatTile label="Awaiting Verification" value={stats.awaitingVerification} />
          <StatTile label="Completed" value={stats.completed} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {FILTER_TABS.map((tab, index) => (
            <Pressable
              key={tab.label}
              onPress={() => setActiveTab(index)}
              style={{ backgroundColor: activeTab === index ? '#025F30' : '#fff', borderWidth: activeTab === index ? 0 : 1, borderColor: '#e5e7eb' }}
              className="rounded-full px-3 py-1.5"
            >
              <Text style={{ color: activeTab === index ? '#fff' : '#4b5563' }} className="text-xs font-medium">{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {jobs.length === 0 ? (
          <EmptyState message="No jobs in this view." />
        ) : (
          <View className="gap-3">
            {jobs.map((job) => (
              <Card key={job.id} onPress={() => router.push(`/my-jobs/${job.id}`)} className="gap-1.5">
                <View className="flex-row items-center justify-between">
                  <Text className="font-mono text-xs text-[#025F30]">{job.ticketNumber}</Text>
                  <Badge label={PRIORITY_LABELS[job.priority]} color={PRIORITY_COLORS[job.priority]} />
                </View>
                <Text className="text-sm font-medium text-gray-900">{job.title}</Text>
                <Text className="text-xs text-gray-500">
                  {job.unitCatalogCode} • {formatDate(job.createdAt)}
                </Text>
                <Badge label={STATUS_LABELS[job.status]} color={STATUS_COLORS[job.status]} />
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
