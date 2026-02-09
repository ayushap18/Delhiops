import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getAqiLevel(aqi: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (aqi <= 50)
    return { label: "Good", color: "text-aqi-good", bg: "bg-aqi-good" };
  if (aqi <= 100)
    return {
      label: "Moderate",
      color: "text-aqi-moderate",
      bg: "bg-aqi-moderate",
    };
  if (aqi <= 200)
    return {
      label: "Unhealthy",
      color: "text-aqi-unhealthy",
      bg: "bg-aqi-unhealthy",
    };
  if (aqi <= 300)
    return {
      label: "Very Unhealthy",
      color: "text-aqi-very-unhealthy",
      bg: "bg-aqi-very-unhealthy",
    };
  return {
    label: "Hazardous",
    color: "text-aqi-hazardous",
    bg: "bg-aqi-hazardous",
  };
}

export function getSeverityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "text-danger";
    case "high":
      return "text-aqi-unhealthy";
    case "medium":
      return "text-warning";
    case "low":
      return "text-success";
    default:
      return "text-gray-400";
  }
}

export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "open":
    case "reported":
    case "online":
      return "text-success";
    case "in_progress":
    case "investigating":
    case "maintenance":
      return "text-warning";
    case "resolved":
    case "closed":
      return "text-gray-400";
    case "offline":
      return "text-danger";
    default:
      return "text-gray-400";
  }
}
