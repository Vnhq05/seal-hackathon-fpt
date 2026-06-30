import { apiClient } from "@/lib/axios";
import type { ApiResponse } from "./types";
import type { AxiosRequestConfig } from "axios";

async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data: wrapper } = await promise;
  if (!wrapper.success) {
    throw new Error(wrapper.message);
  }
  return wrapper.data;
}

export interface ApiActionResult<T> {
  data: T;
  message: string;
}

async function unwrapWithMessage<T>(
  promise: Promise<{ data: ApiResponse<T> }>,
): Promise<ApiActionResult<T>> {
  const { data: wrapper } = await promise;
  if (!wrapper.success) {
    throw new Error(wrapper.message);
  }
  return { data: wrapper.data, message: wrapper.message };
}

export const api = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return unwrap<T>(apiClient.get<ApiResponse<T>>(url, config));
  },

  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return unwrap<T>(apiClient.post<ApiResponse<T>>(url, body, config));
  },

  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return unwrap<T>(apiClient.put<ApiResponse<T>>(url, body, config));
  },

  putWithMessage<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<ApiActionResult<T>> {
    return unwrapWithMessage<T>(apiClient.put<ApiResponse<T>>(url, body, config));
  },

  postWithMessage<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<ApiActionResult<T>> {
    return unwrapWithMessage<T>(apiClient.post<ApiResponse<T>>(url, body, config));
  },

  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return unwrap<T>(apiClient.patch<ApiResponse<T>>(url, body, config));
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return unwrap<T>(apiClient.delete<ApiResponse<T>>(url, config));
  },
};
