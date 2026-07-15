import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatDate, formatNaira } from '@/lib/format';
import { financialService, INVOICE_STATUS, type RentInvoiceDto } from '@/services/financialService';
import { maintenanceService, type MaintenanceInvoiceDto } from '@/services/maintenanceService';

const MAINTENANCE_INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  Paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  Rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

type Tab = 'rent' | 'maintenance';

export default function MyInvoicesScreen() {
  const [tab, setTab] = useState<Tab>('rent');
  const [isLoading, setIsLoading] = useState(true);
  const [rentInvoices, setRentInvoices] = useState<RentInvoiceDto[]>([]);
  const [maintenanceInvoices, setMaintenanceInvoices] = useState<MaintenanceInvoiceDto[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rentRes, maintRes] = await Promise.all([
        financialService.getMyInvoices(),
        maintenanceService.getMyMaintenanceInvoices(),
      ]);
      if (rentRes.success) setRentInvoices(rentRes.data || []);
      if (maintRes.success) setMaintenanceInvoices(maintRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (isLoading && rentInvoices.length === 0 && maintenanceInvoices.length === 0) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#e8f5f0]" edges={['bottom']}>
      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200 px-4 pt-2">
        <Pressable onPress={() => setTab('rent')} className={`flex-1 items-center py-3 ${tab === 'rent' ? 'border-b-2 border-brand' : ''}`}>
          <Text className={`text-sm ${tab === 'rent' ? 'font-medium text-brand' : 'text-gray-500'}`}>Rent ({rentInvoices.length})</Text>
        </Pressable>
        <Pressable onPress={() => setTab('maintenance')} className={`flex-1 items-center py-3 ${tab === 'maintenance' ? 'border-b-2 border-brand' : ''}`}>
          <Text className={`text-sm ${tab === 'maintenance' ? 'font-medium text-brand' : 'text-gray-500'}`}>Maintenance ({maintenanceInvoices.length})</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-3 p-4">
        {tab === 'rent' && (
          rentInvoices.length === 0 ? (
            <EmptyState message="No rent invoices yet." />
          ) : (
            rentInvoices.map((inv) => {
              const status = INVOICE_STATUS[inv.status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-600' };
              return (
                <Card key={inv.id} className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</Text>
                    <Badge label={status.label} color={status.color} />
                  </View>
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="text-xs text-gray-400">Unit</Text>
                      <Text className="text-xs text-gray-600">{inv.unitCatalogCode || '—'}</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-gray-400">Period</Text>
                      <Text className="text-xs text-gray-600">{formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-gray-900">{formatNaira(inv.amountDue)}</Text>
                    {inv.daysOverdue > 0 && (
                      <Text className="text-xs text-red-600 font-medium">{inv.daysOverdue} days overdue</Text>
                    )}
                    {inv.status === 1 && (
                      <Text className="text-xs text-green-600">Paid</Text>
                    )}
                  </View>
                </Card>
              );
            })
          )
        )}

        {tab === 'maintenance' && (
          maintenanceInvoices.length === 0 ? (
            <EmptyState message="No maintenance invoices yet." />
          ) : (
            maintenanceInvoices.map((inv) => {
              const status = MAINTENANCE_INVOICE_STATUS[inv.status] || { label: inv.status, color: 'bg-gray-100 text-gray-600' };
              return (
                <Card key={inv.id} className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</Text>
                    <Badge label={status.label} color={status.color} />
                  </View>
                  {inv.ticketNumber && (
                    <Text className="text-xs text-gray-500">{inv.ticketNumber} — {inv.requestTitle}</Text>
                  )}
                  <Text className="text-xs text-gray-500">{inv.description}</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-gray-900">{formatNaira(inv.amount)}</Text>
                    {inv.paidAt ? (
                      <Text className="text-xs text-green-600">Paid {formatDate(inv.paidAt)}</Text>
                    ) : (
                      <Text className="text-xs text-gray-400">{formatDate(inv.createdAt)}</Text>
                    )}
                  </View>
                </Card>
              );
            })
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
