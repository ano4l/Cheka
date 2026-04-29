import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ContractJobResponse } from "./types";

interface OnboardingState {
  hasOnboarded: boolean;
  hasHydrated: boolean;
  completeOnboarding: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      hasHydrated: false,
      completeOnboarding: () => set({ hasOnboarded: true }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "cheka-mobile-onboarding",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

interface JobsState {
  jobs: ContractJobResponse[];
  texts: Record<string, string>;
  currentJobId: string | null;
  hasHydrated: boolean;
  addJob: (job: ContractJobResponse, text: string) => void;
  updateJob: (job: ContractJobResponse) => void;
  setCurrentJobId: (id: string | null) => void;
  getJob: (id: string) => ContractJobResponse | undefined;
  getText: (id: string) => string;
  setHasHydrated: (value: boolean) => void;
}

export const useJobsStore = create<JobsState>()(
  persist(
    (set, get) => ({
      jobs: [],
      texts: {},
      currentJobId: null,
      hasHydrated: false,

      addJob: (job, text) =>
        set((state) => {
          const existing = state.jobs.some((entry) => entry.job_id === job.job_id);
          const jobs = existing
            ? state.jobs.map((entry) => (entry.job_id === job.job_id ? job : entry))
            : [job, ...state.jobs];

          return {
            jobs,
            texts: {
              ...state.texts,
              [job.job_id]: text || state.texts[job.job_id] || "",
            },
            currentJobId: job.job_id,
          };
        }),

      updateJob: (job) =>
        set((state) => {
          const existing = state.jobs.some((entry) => entry.job_id === job.job_id);
          return {
            jobs: existing
              ? state.jobs.map((entry) => (entry.job_id === job.job_id ? job : entry))
              : [job, ...state.jobs],
            currentJobId: job.job_id,
          };
        }),

      setCurrentJobId: (id) => set({ currentJobId: id }),

      getJob: (id) => get().jobs.find((job) => job.job_id === id),

      getText: (id) => get().texts[id] ?? "",

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "cheka-mobile-jobs",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        jobs: state.jobs,
        texts: state.texts,
        currentJobId: state.currentJobId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
