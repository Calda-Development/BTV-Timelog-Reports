import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const NAME_MAPPING = {
  daniel: "Daniel",
  JAN: "Jan",
  Tim_Blazic: "Tim",
  niko: "Niko",
  edis: "Edis",
};

export function getDisplayName(gitlabName: string): string {
  return NAME_MAPPING[gitlabName as keyof typeof NAME_MAPPING] || gitlabName;
}

export function convertTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function getPreviousDay(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDatesToFetch(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const dates = [];

  if (dayOfWeek === 1) {
    for (let i = 3; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      dates.push(`${year}-${month}-${day}`);
    }
  } else {
    dates.push(getPreviousDay());
  }

  return dates;
}

export function formatDateRange(dates: string[]): string {
  if (dates.length === 0) return "";
  if (dates.length === 1) return dates[0];
  return `${dates[0]} to ${dates[dates.length - 1]}`;
}
