import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { StatTile } from '@/components/ui/StatTile';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/format';
import {
  MaintenanceRequestDto,
  OPEN_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  maintenanceService,
} from '@/services/maintenanceService';
import { AnnouncementDto, ANNOUNCEMENT_PRIORITY, selfServiceApi } from '@/services/selfServiceApi';
import type { UnitDto } from '@/services/maintenanceService';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [recentRequests, setRecentRequests] = useState<MaintenanceRequestDto[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [unitsRes, requestsRes, announcementsRes] = await Promise.all([
        maintenanceService.getMyUnits(),
        maintenanceService.getMyRequests({ pageSize: 5 }),
        selfServiceApi.getAnnouncements(),
      ]);
      if (unitsRes.success) setUnits(unitsRes.data);
      if (requestsRes.success) setRecentRequests(requestsRes.data.result);
      if (announcementsRes.success) setAnnouncements(announcementsRes.data.slice(0, 3));
    } catch {
      // Errors are surfaced globally by the axios interceptor's toast-equivalent; leave screen state as-is.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openRequestsCount = recentRequests.filter((r) => OPEN_STATUSES.includes(r.status)).length;

  if (isLoading && units.length === 0 && recentRequests.length === 0) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#e8f5f0]" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-4 p-4"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor="#025F30" />}
      >
        <View>
          <Text className="text-xl font-semibold text-[#025F30]">Welcome, {user?.name?.split(' ')[0]}</Text>
          <Text className="text-sm text-gray-500">Here's what's happening with your home.</Text>
        </View>

        <View className="flex-row flex-wrap gap-3">
          <StatTile label="My Units" value={units.length} />
          <StatTile label="Open Requests" value={openRequestsCount} onPress={() => router.push('/my-requests')} />
          <StatTile label="Announcements" value={announcements.length} />
          <StatTile label="Invoices" value="→" />
        </View>

        {units.length > 0 && (
          <Card className="gap-2">
            <Text className="text-sm font-medium text-gray-900">My Unit(s)</Text>
            {units.map((u) => (
              <View key={u.id} className="flex-row items-center justify-between border-t border-gray-100 pt-2">
                <View>
                  <Text className="text-sm text-gray-900">{u.catalogCode}</Text>
                  <Text className="text-xs text-gray-500">{u.floorName}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        <Pressable onPress={() => router.push('/my-requests')}>
          <Card className="items-center bg-brand">
            <Text className="text-sm font-medium text-white">Report a Maintenance Issue</Text>
          </Card>
        </Pressable>

        {announcements.length > 0 && (
          <Card className="gap-2">
            <Text className="text-sm font-medium text-gray-900">Announcements</Text>
            {announcements.map((a) => (
              <View key={a.id} className="gap-1 border-t border-gray-100 pt-2">
                <View className="flex-row items-center gap-2">
                  <Badge {...ANNOUNCEMENT_PRIORITY[a.priority]} />
                  <Text className="flex-1 text-sm font-medium text-gray-900">{a.title}</Text>
                </View>
                <Text className="text-xs text-gray-500" numberOfLines={2}>
                  {a.body}
                </Text>
              </View>
            ))}
          </Card>
        )}

        <View>
          <Text className="mb-2 text-sm font-medium text-gray-900">Recent Requests</Text>
          {recentRequests.length === 0 ? (
            <EmptyState message="No maintenance requests yet." />
          ) : (
            <View className="gap-2">
              {recentRequests.map((r) => (
                <Card key={r.id} onPress={() => router.push(`/my-requests/${r.id}`)} className="gap-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-mono text-xs text-[#025F30]">{r.ticketNumber}</Text>
                    <Badge label={STATUS_LABELS[r.status]} color={STATUS_COLORS[r.status]} />
                  </View>
                  <Text className="text-sm text-gray-900">{r.title}</Text>
                  <Text className="text-xs text-gray-500">{formatDate(r.createdAt)}</Text>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
