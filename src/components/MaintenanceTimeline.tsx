import { Text, View } from 'react-native';

import { formatDateTime } from '@/lib/format';
import { SLA_COLORS, SLA_LABELS, STATUS_LABELS, type SlaStatus, type TimelineStageDto } from '@/services/maintenanceService';

import { Badge } from './ui/Badge';

const isNegativeStage = (stage: number) => stage === 8 || stage === 10;
const isReworkStage = (stage: number) => stage === 9;

// Returns whether a passed stage exited after its own SLA deadline
function isStageSlaBreached(stage: TimelineStageDto): boolean {
  if (!stage.slaDeadlineAt || !stage.exitedAt) return false;
  return new Date(stage.exitedAt).getTime() > new Date(stage.slaDeadlineAt).getTime();
}

// For the current active stage: how much time is left vs the stage SLA
function getStageSlaCountdown(stage: TimelineStageDto): { label: string; overdue: boolean } | null {
  if (!stage.slaDeadlineAt) return null;
  const diff = new Date(stage.slaDeadlineAt).getTime() - Date.now();
  if (diff <= 0) return { label: 'Stage SLA overdue', overdue: true };
  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (hours >= 24) return { label: `${Math.floor(hours / 24)}d ${hours % 24}h left`, overdue: false };
  return { label: `${hours}h ${mins}m left`, overdue: false };
}

interface MaintenanceTimelineProps {
  stages: TimelineStageDto[];
  sla?: SlaStatus | null;
  slaResolutionDueAt?: string | null;
}

export function MaintenanceTimeline({ stages, sla, slaResolutionDueAt }: MaintenanceTimelineProps) {
  return (
    <View className="gap-0">
      {sla && slaResolutionDueAt && (
        <View className="mb-3">
          <Badge label={`${SLA_LABELS[sla]} · Due ${formatDateTime(slaResolutionDueAt)}`} color={SLA_COLORS[sla]} />
        </View>
      )}

      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        const isPassed = stage.timelineState === 'Passed';
        const isCurrent = stage.timelineState === 'Current';
        const label = STATUS_LABELS[stage.stage] || `Stage ${stage.stage}`;

        const isPassedNegative = isPassed && (isNegativeStage(stage.stage) || isReworkStage(stage.stage));
        const isPassedBreached = isPassed && !isPassedNegative && isStageSlaBreached(stage);
        const stageCountdown = isCurrent ? getStageSlaCountdown(stage) : null;

        const dotColor = isPassed
          ? isPassedNegative
            ? '#ef4444' // red-500
            : isPassedBreached
              ? '#f59e0b' // amber-500
              : '#16a34a' // green-600
          : isCurrent
            ? isNegativeStage(stage.stage)
              ? '#ef4444'
              : '#025F30'
            : '#d1d5db'; // gray-300

        const lineColor = isPassed ? (isPassedNegative ? '#fecaca' : isPassedBreached ? '#fde68a' : '#bbf7d0') : '#e5e7eb';

        const labelClass = isPassed
          ? isPassedNegative
            ? 'text-red-700'
            : isPassedBreached
              ? 'text-amber-700'
              : 'text-gray-800'
          : isCurrent
            ? 'text-[#025F30] font-medium'
            : 'text-gray-400';

        const passedBadge = isPassedNegative
          ? { label: isReworkStage(stage.stage) ? 'Rework' : 'Rejected', color: 'bg-red-100 text-red-600' }
          : isPassedBreached
            ? { label: 'Late', color: 'bg-amber-100 text-amber-700' }
            : { label: 'Done', color: 'bg-green-100 text-green-700' };

        return (
          <View key={`${stage.stage}-${index}`} className="flex-row gap-3">
            <View className="items-center">
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dotColor }} />
              {!isLast && <View style={{ width: 2, flex: 1, marginVertical: 4, minHeight: 20, backgroundColor: lineColor }} />}
            </View>

            <View className={`flex-1 ${isLast ? '' : 'pb-3'}`}>
              <View className="flex-row flex-wrap items-center gap-1.5">
                <Text className={`text-xs ${labelClass}`}>{label}</Text>
                {isPassed && <Badge label={passedBadge.label} color={passedBadge.color} />}
                {isCurrent && <Badge label="Active" color="bg-[#e8f5f0] text-[#025F30]" />}
              </View>

              {isPassed && (
                <View className="mt-0.5 gap-0.5">
                  {stage.attendedBy.length > 0 && (
                    <Text className="text-[11px] text-gray-500">{stage.attendedBy.map((a) => a.userName).join(', ')}</Text>
                  )}
                  <Text className="text-[11px] text-gray-400">
                    {formatDateTime(stage.enteredAt ?? '')}
                    {stage.exitedAt ? ` → ${formatDateTime(stage.exitedAt)}` : ''}
                  </Text>
                  {stage.exitNotes && <Text className="text-[11px] italic text-gray-400">"{stage.exitNotes}"</Text>}
                </View>
              )}

              {isCurrent && (
                <View className="mt-0.5 gap-0.5">
                  {stage.responsibleUsers.length > 0 ? (
                    <Text className="text-[11px] text-[#025F30]">{stage.responsibleUsers.map((a) => a.userName).join(', ')}</Text>
                  ) : (
                    <Text className="text-[11px] text-gray-400">Open to any authorised user</Text>
                  )}
                  {stage.enteredAt && <Text className="text-[11px] text-gray-400">Since {formatDateTime(stage.enteredAt)}</Text>}
                  {stageCountdown && (
                    <Text className={`text-[11px] font-medium ${stageCountdown.overdue ? 'text-red-600' : 'text-amber-600'}`}>
                      {stageCountdown.label}
                    </Text>
                  )}
                </View>
              )}

              {!isPassed && !isCurrent && stage.responsibleUsers.length > 0 && (
                <Text className="mt-0.5 text-[11px] text-gray-400">{stage.responsibleUsers.map((a) => a.userName).join(', ')}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
