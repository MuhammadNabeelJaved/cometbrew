/**
 * Standup API
 * Daily standup notes and availability status.
 */
import apiClient from './apiClient';

export type AvailabilityStatus = 'available' | 'busy' | 'meeting' | 'away' | 'wfh' | 'offline';
export type StandupMood = 'great' | 'good' | 'okay' | 'stressed' | 'blocked';

export interface StandupNote {
    _id: string;
    userId: string;
    date: string;
    didYesterday: string;
    doingToday: string;
    blockers: string;
    mood: StandupMood;
    createdAt: string;
    updatedAt: string;
}

export interface TeamStandupEntry extends StandupNote {
    userId: {
        _id: string;
        name: string;
        photo: string;
        availabilityStatus: AvailabilityStatus;
        teamProfile?: { position?: string; department?: string };
    };
}

export const standupApi = {
    getTodayStandup: () =>
        apiClient.get<{ data: StandupNote | null }>('/standup/today'),

    upsertStandup: (data: Partial<Pick<StandupNote, 'didYesterday' | 'doingToday' | 'blockers' | 'mood'>>) =>
        apiClient.post<{ data: StandupNote }>('/standup', data),

    getHistory: () =>
        apiClient.get<{ data: StandupNote[] }>('/standup/history'),

    getTeamStandups: (date?: string) =>
        apiClient.get<{ data: TeamStandupEntry[] }>('/standup/team', { params: date ? { date } : {} }),

    updateStatus: (status: AvailabilityStatus) =>
        apiClient.put('/standup/status', { status }),
};
