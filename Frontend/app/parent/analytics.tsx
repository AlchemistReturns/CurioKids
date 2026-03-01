import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnalyticsService } from '../../services/AnalyticsService';
import { UserService } from '../../services/UserService';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function AnalyticsScreen() {
    const { childId, childName } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [usageData, setUsageData] = useState<any[]>([]);
    const [courseData, setCourseData] = useState<any>(null);
    const [childData, setChildData] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [childRank, setChildRank] = useState<number>(0);

    useEffect(() => {
        loadData();
    }, [childId]);

    const loadData = async () => {
        if (!childId) {
            setLoading(false);
            return;
        }
        try {
            const [usage, courses, child, rank] = await Promise.all([
                AnalyticsService.getUsageStats(childId as string),
                AnalyticsService.getCourseStats(childId as string),
                UserService.getProfile(childId as string),
                AnalyticsService.getRank(childId as string)
            ]);
            setUsageData(usage);
            setCourseData(courses);
            setChildData(child);
            setChildRank(rank || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    };

    const getChartData = () => {
        const days = viewMode === 'week' ? 7 : 30;
        const today = new Date();
        // Build a map of existing data keyed by date string (YYYY-MM-DD)
        const dataMap: Record<string, any> = {};
        (usageData || []).forEach((d: any) => {
            if (d.date) {
                dataMap[d.date] = d;
            }
        });

        // Generate entries for each calendar day in the range, filling gaps with 0
        const result: any[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            if (dataMap[dateStr]) {
                result.push(dataMap[dateStr]);
            } else {
                result.push({ date: dateStr, totalUsageToday: 0 });
            }
        }
        return result;
    };

    const getMaxUsage = (data: any[]) => {
        if (!data || data.length === 0) return 3600;
        const values = data.map((d: any) => Number(d.totalUsageToday || 0));
        return Math.max(...values);
    };

    const getAverageUsage = (data: any[]) => {
        if (!data || data.length === 0) return 0;
        const total = data.reduce((sum: number, d: any) => sum + Number(d.totalUsageToday || 0), 0);
        return Math.floor(total / data.length);
    };

    const chartData = getChartData();
    const maxVal = Math.max(getMaxUsage(chartData), 60);
    const avgUsage = getAverageUsage(chartData);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#5A3E29" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>📊 Analytics</Text>
                    <Text style={styles.headerSubtitle}>{childName || 'Child'} Activity Insights</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color="#FF6E4F" style={styles.loader} />
                ) : (
                    <>
                        {/* Quick Stats Cards - 2x2 Grid */}
                        <View style={styles.quickStatsContainer}>
                            {/* Row 1 */}
                            <View style={styles.quickStatsRow}>
                                <View style={[styles.quickStatCard, { backgroundColor: '#FFE5DD' }]}>
                                    <Ionicons name="time-outline" size={28} color="#FF6E4F" />
                                    <Text style={styles.quickStatValue}>{formatTime(avgUsage)}</Text>
                                    <Text style={styles.quickStatLabel}>Avg Daily</Text>
                                </View>
                                <View style={[styles.quickStatCard, { backgroundColor: '#FFF3CD' }]}>
                                    <Ionicons name="trending-up" size={28} color="#FFC226" />
                                    <Text style={styles.quickStatValue}>{courseData?.streak || 0}</Text>
                                    <Text style={styles.quickStatLabel}>Day Streak</Text>
                                </View>
                            </View>

                            {/* Row 2 */}
                            <View style={styles.quickStatsRow}>
                                <View style={[styles.quickStatCard, { backgroundColor: '#E8F5E3' }]}>
                                    <Ionicons name="trophy" size={28} color="#658C58" />
                                    <Text style={styles.quickStatValue}>{courseData?.totalPoints || 0}</Text>
                                    <Text style={styles.quickStatLabel}>Total Points</Text>
                                </View>
                                <View style={[styles.quickStatCard, { backgroundColor: '#E0E7FF' }]}>
                                    <Ionicons name="ribbon" size={28} color="#6366F1" />
                                    <Text style={styles.quickStatValue}>#{childRank || '-'}</Text>
                                    <Text style={styles.quickStatLabel}>Rank</Text>
                                </View>
                            </View>
                        </View>

                        {/* Usage Chart Section */}
                        <View style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                                <View>
                                    <Text style={styles.cardTitle}>⏱️ Screen Time Usage</Text>
                                    <Text style={styles.cardSubtitle}>Track daily activity patterns</Text>
                                </View>
                            </View>

                            {/* Toggle Buttons */}
                            <View style={styles.toggleContainer}>
                                <TouchableOpacity
                                    onPress={() => setViewMode('week')}
                                    style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]}
                                >
                                    <Ionicons
                                        name="calendar-outline"
                                        size={16}
                                        color={viewMode === 'week' ? '#FFFFFF' : '#9CA3AF'}
                                        style={styles.toggleIcon}
                                    />
                                    <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>
                                        Last 7 Days
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setViewMode('month')}
                                    style={[styles.toggleButton, viewMode === 'month' && styles.toggleButtonActive]}
                                >
                                    <Ionicons
                                        name="calendar"
                                        size={16}
                                        color={viewMode === 'month' ? '#FFFFFF' : '#9CA3AF'}
                                        style={styles.toggleIcon}
                                    />
                                    <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>
                                        Last Month
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Chart with Grid */}
                            <View style={styles.chartWrapper}>
                                {/* Y-Axis Labels */}
                                <View style={styles.yAxisLabels}>
                                    <Text style={styles.yAxisLabel}>{formatTime(maxVal)}</Text>
                                    <Text style={styles.yAxisLabel}>{formatTime(maxVal * 0.5)}</Text>
                                    <Text style={styles.yAxisLabel}>0m</Text>
                                </View>

                                {/* Chart Area with Grid Lines */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                                    <View style={[styles.chartContainer, viewMode === 'month' && styles.chartContainerWide]}>
                                        {/* Grid Lines */}
                                        <View style={styles.gridLines}>
                                            <View style={styles.gridLine} />
                                            <View style={styles.gridLine} />
                                            <View style={styles.gridLine} />
                                        </View>

                                        {/* Bars */}
                                        {chartData.length === 0 ? (
                                            <View style={styles.noDataContainer}>
                                                <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
                                                <Text style={styles.noDataText}>No usage data yet</Text>
                                                <Text style={styles.noDataSubtext}>Data will appear as your child uses the app</Text>
                                            </View>
                                        ) : (
                                            chartData.map((day, index) => {
                                                const usageVal = Number(day.totalUsageToday || 0);
                                                const heightPerc = (usageVal / maxVal) * 100;
                                                const safeHeight = Math.max(heightPerc, 3);
                                                const isToday = index === chartData.length - 1;

                                                let label = "?";
                                                try {
                                                    const dateObj = new Date(day.date);
                                                    if (!isNaN(dateObj.getTime())) {
                                                        label = viewMode === 'week'
                                                            ? dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                                                            : dateObj.getDate().toString();
                                                    }
                                                } catch (e) {
                                                    label = "?";
                                                }

                                                return (
                                                    <View key={day.date || index} style={styles.barContainer}>
                                                        <View style={styles.barWrapper}>
                                                            <View style={[
                                                                styles.bar,
                                                                {
                                                                    height: `${safeHeight}%`,
                                                                    backgroundColor: isToday ? '#FF6E4F' : '#FFC226'
                                                                }
                                                            ]}>
                                                                {usageVal > 0 && (
                                                                    <Text style={styles.barValue}>{formatTime(usageVal)}</Text>
                                                                )}
                                                            </View>
                                                        </View>
                                                        <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                                                            {label}
                                                        </Text>
                                                        {isToday && <View style={styles.todayDot} />}
                                                    </View>
                                                );
                                            })
                                        )}
                                    </View>
                                </ScrollView>
                            </View>

                            {/* Chart Legend */}
                            {chartData.length > 0 && (
                                <View style={styles.legendRow}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#FF6E4F' }]} />
                                        <Text style={styles.legendText}>Today</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: '#FFC226' }]} />
                                        <Text style={styles.legendText}>Previous Days</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Performance Metrics */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>🎯 Learning Progress</Text>
                            <View style={styles.metricsGrid}>
                                <View style={styles.metricBox}>
                                    <View style={styles.metricIconContainer}>
                                        <Ionicons name="school" size={24} color="#FF6E4F" />
                                    </View>
                                    <Text style={styles.metricValue}>{courseData?.completedCourses?.length || 0}</Text>
                                    <Text style={styles.metricLabel}>Courses Completed</Text>
                                </View>
                                <View style={styles.metricBox}>
                                    <View style={styles.metricIconContainer}>
                                        <Ionicons name="checkmark-done" size={24} color="#FFC226" />
                                    </View>
                                    <Text style={styles.metricValue}>{courseData?.badges?.length || 0}</Text>
                                    <Text style={styles.metricLabel}>Badges Earned</Text>
                                </View>
                            </View>
                        </View>

                        {/* Achievements/Badges */}
                        {courseData?.badges && courseData.badges.length > 0 && (
                            <View style={styles.card}>
                                <View style={styles.cardHeaderRow}>
                                    <Text style={styles.cardTitle}>🏆 Recent Achievements</Text>
                                    <Text style={styles.seeAllText}>See All</Text>
                                </View>
                                {courseData.badges.slice(0, 3).map((badge: any, idx: number) => (
                                    <View key={idx} style={styles.badgeCard}>
                                        <View style={styles.badgeIconWrapper}>
                                            <Ionicons name="trophy" size={28} color="#FFC226" />
                                        </View>
                                        <View style={styles.badgeInfo}>
                                            <Text style={styles.badgeName}>{badge.name}</Text>
                                            <Text style={styles.badgeDate}>
                                                Earned on {new Date(badge.dateEarned).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                        <Ionicons name="checkmark-circle" size={24} color="#658C58" />
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Empty State for Badges */}
                        {(!courseData?.badges || courseData.badges.length === 0) && (
                            <View style={styles.card}>
                                <View style={styles.emptyStateContainer}>
                                    <Ionicons name="ribbon-outline" size={64} color="#D1D5DB" />
                                    <Text style={styles.emptyStateTitle}>No Achievements Yet</Text>
                                    <Text style={styles.emptyStateText}>
                                        Badges will appear here as your child completes courses and milestones
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9E6', // tigerCream
        paddingTop: 48,
    },
    header: {
        backgroundColor: '#FFC226', // tigerYellow
        paddingTop: 16,
        paddingBottom: 24,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        padding: 8,
        borderRadius: 20,
        marginRight: 16,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#5A3E29', // tigerBrown
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(90,62,41,0.7)',
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loader: {
        marginTop: 60,
    },
    quickStatsContainer: {
        marginBottom: 20,
    },
    quickStatsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
    },
    quickStatCard: {
        width: (SCREEN_WIDTH - 60) / 2,
        marginHorizontal: 6,
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(90,62,41,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    quickStatValue: {
        fontSize: 26,
        fontWeight: '900',
        color: '#5A3E29',
        marginTop: 10,
    },
    quickStatLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(90,62,41,0.6)',
        marginTop: 6,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor: 'rgba(90,62,41,0.05)',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#5A3E29',
        letterSpacing: -0.3,
    },
    cardSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(90,62,41,0.5)',
        marginTop: 4,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FF6E4F',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    toggleButtonActive: {
        backgroundColor: '#FF6E4F',
        shadowColor: '#FF6E4F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    toggleIcon: {
        marginRight: 6,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    toggleTextActive: {
        color: '#FFFFFF',
    },
    chartWrapper: {
        flexDirection: 'row',
    },
    yAxisLabels: {
        width: 45,
        height: 200,
        justifyContent: 'space-between',
        paddingRight: 8,
        paddingTop: 8,
    },
    yAxisLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
        textAlign: 'right',
    },
    chartScroll: {
        flex: 1,
    },
    chartContainer: {
        height: 200,
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        minWidth: SCREEN_WIDTH - 120,
        position: 'relative',
    },
    chartContainerWide: {
        minWidth: 700,
    },
    gridLines: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    gridLine: {
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    barContainer: {
        alignItems: 'center',
        width: 40,
        marginHorizontal: 4,
    },
    barWrapper: {
        width: '100%',
        height: 180,
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    barValue: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    barLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '700',
        marginTop: 8,
    },
    barLabelToday: {
        color: '#FF6E4F',
        fontWeight: '900',
    },
    todayDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF6E4F',
        marginTop: 4,
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    noDataText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#9CA3AF',
        marginTop: 12,
    },
    noDataSubtext: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    metricBox: {
        flex: 1,
        backgroundColor: '#F0E491', // tigerCard
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(90,62,41,0.1)',
    },
    metricIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    metricValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#5A3E29',
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(90,62,41,0.7)',
        marginTop: 4,
        textAlign: 'center',
    },
    badgeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC226',
    },
    badgeIconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,194,38,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    badgeInfo: {
        flex: 1,
    },
    badgeName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#5A3E29',
        marginBottom: 4,
    },
    badgeDate: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(90,62,41,0.6)',
    },
    emptyStateContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#5A3E29',
        marginTop: 16,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 20,
    },
});
