import { create } from "zustand";

import type { ContractJobResponse } from "./types";

/* ── Onboarding store ── */
interface OnboardingState {
  hasOnboarded: boolean;
  completeOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasOnboarded: false,
  completeOnboarding: () => set({ hasOnboarded: true }),
}));

/* ── Jobs store ── */
interface JobsState {
  jobs: ContractJobResponse[];
  texts: Record<string, string>;
  currentJobId: string | null;

  addJob: (job: ContractJobResponse, text: string) => void;
  updateJob: (job: ContractJobResponse) => void;
  setCurrentJobId: (id: string | null) => void;
  getJob: (id: string) => ContractJobResponse | undefined;
  getText: (id: string) => string;
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  texts: {},
  currentJobId: null,

  addJob: (job, text) =>
    set((state) => ({
      jobs: [job, ...state.jobs],
      texts: { ...state.texts, [job.job_id]: text },
      currentJobId: job.job_id,
    })),

  updateJob: (job) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.job_id === job.job_id ? job : j)),
    })),

  setCurrentJobId: (id) => set({ currentJobId: id }),

  getJob: (id) => get().jobs.find((j) => j.job_id === id),

  getText: (id) => get().texts[id] ?? "",
}));
