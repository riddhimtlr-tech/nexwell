package com.nexwell.app.health

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.Period
import java.time.ZoneId

/** One day of health data. null = no data / permission not granted. */
data class DaySummary(
    val date: LocalDate,
    var steps: Long? = null,
    var sleepMinutes: Long? = null,
    var avgHeartRate: Long? = null,
    var minHeartRate: Long? = null,
    var maxHeartRate: Long? = null,
    var exerciseMinutes: Long? = null,
)

class HealthConnectManager(private val context: Context) {

    private val client by lazy { HealthConnectClient.getOrCreate(context) }

    companion object {
        val STEPS = HealthPermission.getReadPermission(StepsRecord::class)
        val SLEEP = HealthPermission.getReadPermission(SleepSessionRecord::class)
        val HEART = HealthPermission.getReadPermission(HeartRateRecord::class)
        val EXERCISE = HealthPermission.getReadPermission(ExerciseSessionRecord::class)
        val WRITE_STEPS = HealthPermission.getWritePermission(StepsRecord::class) // demo/testing only

        val READ = setOf(STEPS, SLEEP, HEART, EXERCISE)
        val ALL = READ + WRITE_STEPS

        val LABELS = mapOf(STEPS to "Steps", SLEEP to "Sleep", HEART to "Heart rate", EXERCISE to "Exercise")
    }

    fun sdkStatus(): Int = HealthConnectClient.getSdkStatus(context)

    suspend fun grantedPermissions(): Set<String> =
        client.permissionController.getGrantedPermissions()

    /**
     * Reads the last [days] days (including today) as daily summaries.
     * Each data type is read separately and only if its permission is granted,
     * so a denied permission never crashes the sync.
     */
    suspend fun readLastDays(days: Int = 7): List<DaySummary> {
        val granted = grantedPermissions()
        val zone = ZoneId.systemDefault()
        val today = LocalDate.now(zone)
        val start = today.minusDays((days - 1).toLong())
        val range = TimeRangeFilter.between(start.atStartOfDay(), today.plusDays(1).atStartOfDay())

        val byDate = (0 until days).map { start.plusDays(it.toLong()) }
            .associateWith { DaySummary(it) }

        // ---- Steps: total per day
        if (STEPS in granted) {
            client.aggregateGroupByPeriod(
                AggregateGroupByPeriodRequest(setOf(StepsRecord.COUNT_TOTAL), range, Period.ofDays(1))
            ).forEach { g ->
                byDate[g.startTime.toLocalDate()]?.steps = g.result[StepsRecord.COUNT_TOTAL] ?: 0L
            }
        }

        // ---- Heart rate: avg / min / max per day
        if (HEART in granted) {
            client.aggregateGroupByPeriod(
                AggregateGroupByPeriodRequest(
                    setOf(HeartRateRecord.BPM_AVG, HeartRateRecord.BPM_MIN, HeartRateRecord.BPM_MAX),
                    range, Period.ofDays(1)
                )
            ).forEach { g ->
                byDate[g.startTime.toLocalDate()]?.apply {
                    avgHeartRate = g.result[HeartRateRecord.BPM_AVG]
                    minHeartRate = g.result[HeartRateRecord.BPM_MIN]
                    maxHeartRate = g.result[HeartRateRecord.BPM_MAX]
                }
            }
        }

        // ---- Exercise: total minutes per day
        if (EXERCISE in granted) {
            client.aggregateGroupByPeriod(
                AggregateGroupByPeriodRequest(
                    setOf(ExerciseSessionRecord.EXERCISE_DURATION_TOTAL), range, Period.ofDays(1)
                )
            ).forEach { g ->
                byDate[g.startTime.toLocalDate()]?.exerciseMinutes =
                    g.result[ExerciseSessionRecord.EXERCISE_DURATION_TOTAL]?.toMinutes()
            }
        }

        // ---- Sleep: a night (11pm -> 7am) belongs to the day you WAKE UP,
        // so read sessions directly and group by end date.
        if (SLEEP in granted) {
            val from = start.atStartOfDay(zone).minusHours(12).toInstant()
            val to = Instant.now()
            val sessions = client.readRecords(
                ReadRecordsRequest(SleepSessionRecord::class, TimeRangeFilter.between(from, to))
            ).records
            sessions.forEach { s ->
                val day = byDate[s.endTime.atZone(zone).toLocalDate()] ?: return@forEach
                day.sleepMinutes = (day.sleepMinutes ?: 0L) + Duration.between(s.startTime, s.endTime).toMinutes()
            }
        }

        return byDate.values.sortedBy { it.date }
    }

    /**
     * DEMO/TEST ONLY: writes [count] steps into Health Connect for the last 15 minutes,
     * so you can prove "change phone data -> Sync -> dashboard updates" on demand.
     * (Metadata.manualEntry() is required in connect-client 1.1.0+.)
     */
    suspend fun addTestSteps(count: Long = 500) {
        val end = Instant.now()
        val start = end.minusSeconds(15 * 60)
        val offset = ZoneId.systemDefault().rules.getOffset(end)
        client.insertRecords(
            listOf(
                StepsRecord(
                    startTime = start, startZoneOffset = offset,
                    endTime = end, endZoneOffset = offset,
                    count = count,
                    metadata = Metadata.manualEntry(),
                )
            )
        )
    }
}
