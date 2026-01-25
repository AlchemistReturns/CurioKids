import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { SessionService } from '../services/SessionService';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';

type Role = 'child' | 'parent';

interface SessionContextType {
    timeLeft: number;
    totalUsageToday: number;
    role: Role;
    isActive: boolean;
    isTimeout: boolean;
    isBusy: boolean; // Graceful exit flag
    setRole: (role: Role) => void;
    setBusy: (busy: boolean) => void; // Games call this
    addTime: (minutes: number) => void; // Local override helper
    resetTimer: () => void; // Local override helper
    pauseTimer: () => void;
    resumeTimer: () => void;
    refreshSession: () => Promise<void>;
    login: (user: any) => Promise<void>;
    logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const DEFAULT_SESSION_LIMIT = 30 * 60;

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [timeLeft, setTimeLeft] = useState(DEFAULT_SESSION_LIMIT);
    const [totalUsageToday, setTotalUsageToday] = useState(0);
    const [role, setRole] = useState<Role>('child');
    const [isActive, setIsActive] = useState(true);
    const [isBusy, setIsBusy] = useState(false);

    const [uid, setUid] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Refs for safe async access
    const timeLeftRef = useRef(timeLeft);
    const totalUsageRef = useRef(totalUsageToday);
    const isActiveRef = useRef(isActive);

    const isFirstFetch = useRef(true);
    const lastBackgroundRef = useRef<number | null>(null);

    const appState = useRef(AppState.currentState);
    const instanceId = useRef(Math.random().toString(36).substring(7)); // Unique ID for this app session
    const processedActionIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        timeLeftRef.current = timeLeft;
        totalUsageRef.current = totalUsageToday;
        isActiveRef.current = isActive;
    }, [timeLeft, totalUsageToday, isActive]);

    // Handle App State (Background/Foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App has come to the foreground
                if (lastBackgroundRef.current && isActiveRef.current && role === 'child') {
                    const now = Date.now();
                    const diffSeconds = Math.floor((now - lastBackgroundRef.current) / 1000);

                    if (diffSeconds > 0) {
                        console.log(`App resumed. Deducting ${diffSeconds}s elapsed in background.`);
                        setTimeLeft(prev => Math.max(0, prev - diffSeconds));
                        setTotalUsageToday(prev => prev + diffSeconds);
                    }
                }
                lastBackgroundRef.current = null;
            } else if (nextAppState.match(/inactive|background/)) {
                // App is going to background
                if (isActiveRef.current && role === 'child') {
                    lastBackgroundRef.current = Date.now();
                    // Force Sync to Cloud so other devices see up-to-date time
                    pushToCloud();
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [role]);

    // Initial Load & Auth Check
    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            let user = await AuthService.getCurrentUser();
            if (user) {
                // VERIFY ROLE against backend (Auto-Correction)
                try {
                    const freshProfile = await UserService.getProfile(user.uid);
                    if (freshProfile && freshProfile.role !== user.role) {
                        console.log(`[SessionContext] Role Mismatch! Correcting ${user.role} -> ${freshProfile.role}`);
                        user.role = freshProfile.role;
                        await AsyncStorage.setItem('user', JSON.stringify(user));
                    }
                } catch (e) {
                    console.warn('Failed to verify role online, using local:', e);
                }

                await login(user); // Reuse login logic
            } else {
                // Offline/Not Logged In? Load local
                await loadLocalState();
            }
        } finally {
            setIsInitialized(true);
        }
    };

    const login = async (user: any) => {
        setUid(user.uid);
        setIsInitialized(false); // Reset Init
        // Reset state for new user
        isFirstFetch.current = true;
        setTimeLeft(-1); // Sentinal for 'Loading'

        // console.log('[SessionContext] Fetching Cloud Session...');
        await fetchCloudSession(user.uid);

        const userRole = user.role || 'child';
        // console.log('[SessionContext] Login:', { uid: user.uid, role: userRole });

        setRole(userRole);
        AsyncStorage.setItem('session_role', userRole);
        setIsInitialized(true);
    };

    const logout = async () => {
        setUid(null);
        setIsActive(false);
        lastBackgroundRef.current = null;
        await AuthService.logout();
    };

    const loadLocalState = async () => {
        const savedRole = await AsyncStorage.getItem('session_role');
        const savedTime = await AsyncStorage.getItem('session_time_left');

        if (savedRole) setRole(savedRole as Role);
        if (savedTime) setTimeLeft(parseInt(savedTime));
    };

    const fetchCloudSession = async (currentUid: string) => {
        try {
            const data = await SessionService.getSession(currentUid);

            // Logic: If I am the child, I only accept time updates from the PARENT.
            // OR from a DIFFERENT device (cross-device sync).
            if (role === 'child') {
                // Check for Pending Actions (Command Pattern)
                if (data.pendingAction && data.pendingAction.id && !processedActionIds.current.has(data.pendingAction.id)) {
                    console.log('Executing Pending Action:', data.pendingAction);
                    const action = data.pendingAction;

                    let newTime = timeLeftRef.current;
                    let newActive = isActiveRef.current;

                    if (action.type === 'add_time') {
                        newTime = Math.max(0, newTime + (action.value * 60));
                        newActive = true;
                    } else if (action.type === 'set_active') {
                        newActive = action.value;
                    } else if (action.type === 'reset') {
                        newTime = action.value; // Usually default limit
                        newActive = true;
                    }

                    // Apply locally
                    setTimeLeft(newTime);
                    setIsActive(newActive);
                    processedActionIds.current.add(action.id);

                    // Push result immediately to clear the action from cloud
                    // We send pendingAction: null to acknowledge completion
                    await SessionService.updateSession(currentUid, {
                        timeLeft: newTime,
                        isActive: newActive,
                        lastUpdatedBy: 'child',
                        lastUpdatedByInstance: instanceId.current,
                        pendingAction: null
                    });
                    return; // Stop here, we just synced.
                }

                // Normal Sync Logic (Fallback)
                const isParentUpdate = data.lastUpdatedBy === 'parent';
                const isOtherDevice = data.lastUpdatedByInstance && data.lastUpdatedByInstance !== instanceId.current;

                if (isFirstFetch.current || isParentUpdate || isOtherDevice || !data.lastUpdatedBy) {
                    // Only accept simple time sync if NO pending action was just processed
                    // And if it's not a stale echo
                    setTimeLeft(data.timeLeft);
                    setIsActive(data.isActive); // Sync pause state
                }

                setTotalUsageToday(data.totalUsageToday);
                if (isFirstFetch.current) isFirstFetch.current = false;

            } else {
                // Parent view: Always accept what's in the cloud (truth)
                setTimeLeft(data.timeLeft);
                setTotalUsageToday(data.totalUsageToday);
                setIsActive(data.isActive);
            }
        } catch (e) {
            console.log('Offline or Error fetching session, loading local...');
            loadLocalState();
        }
    };

    // Timer Loop: Decrement & Increment Usage (Local)
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isInitialized && isActive && role === 'child') {
            // console.log('[SessionContext] Timer Started for Child');
            interval = setInterval(() => {
                // console.log('[SessionContext] Tick', timeLeftRef.current);
                setTimeLeft((prev) => {
                    if (prev <= 0) return 0;

                    const next = prev - 1;
                    AsyncStorage.setItem('session_time_left', next.toString());
                    return next;
                });

                // Only increment usage if time is remaining
                if (timeLeftRef.current > 0) {
                    setTotalUsageToday((prev) => prev + 1);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, role, isInitialized]);

    // Sync Loop: Push Local State to Cloud (Every 20s)
    useEffect(() => {
        if (!uid || role !== 'child') return;

        const syncInterval = setInterval(() => {
            pushToCloud();
        }, 2000);

        return () => clearInterval(syncInterval);
    }, [uid, role]);

    // Poll Loop: Pull Parent Changes (Every 10s)
    useEffect(() => {
        if (!uid || role !== 'child') return;

        const pollInterval = setInterval(() => {
            fetchCloudSession(uid);
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [uid, role]);

    const pushToCloud = async () => {
        if (!uid) return;
        try {
            console.log('Syncing session to cloud...');
            const updates: any = {
                totalUsageToday: totalUsageRef.current,
                isActive: isActiveRef.current,
                lastUpdatedBy: 'child',
                lastUpdatedByInstance: instanceId.current
            };

            // Push time updates (including 0)
            updates.timeLeft = timeLeftRef.current;

            await SessionService.updateSession(uid, updates);
        } catch (e) {
            console.error('Sync failed:', e);
        }
    };

    // Actions
    const updateState = (updates: Partial<any>) => {
        if (updates.timeLeft !== undefined) setTimeLeft(updates.timeLeft);
        if (updates.isActive !== undefined) setIsActive(updates.isActive);
        // Immediate sync on manual interaction
        if (uid) {
            SessionService.updateSession(uid, updates);
        }
    };

    const addTime = (minutes: number) => {
        const newTime = timeLeft + (minutes * 60);
        updateState({ timeLeft: newTime < 0 ? 0 : newTime, isActive: true });
    };

    const resetTimer = () => {
        updateState({ timeLeft: DEFAULT_SESSION_LIMIT, isActive: true });
    };

    const pauseTimer = () => updateState({ isActive: false });
    const resumeTimer = () => updateState({ isActive: true });

    return (
        <SessionContext.Provider
            value={{
                timeLeft,
                totalUsageToday,
                role,
                isActive,
                isBusy,
                isTimeout: isInitialized && !!uid && timeLeft === 0 && role === 'child' && !isBusy, // Accurate Timeout
                setRole: (r) => {
                    setRole(r);
                    AsyncStorage.setItem('session_role', r);
                },
                setBusy: setIsBusy,
                addTime,
                resetTimer,
                pauseTimer,
                resumeTimer,
                refreshSession: async () => { if (uid) await fetchCloudSession(uid); },
                login,
                logout
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
