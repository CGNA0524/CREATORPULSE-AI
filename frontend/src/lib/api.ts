const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = "/api/v1";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("creatorpulse_token");
    }
    return null;
  }

  public setAuthToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("creatorpulse_token", token);
    }
  }

  public removeAuthToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("creatorpulse_token");
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const fullPath = cleanPath.startsWith(API_PREFIX) ? cleanPath : `${API_PREFIX}${cleanPath}`;
    const url = new URL(`${API_BASE_URL}${fullPath}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...restOptions } = options;
    const url = this.buildUrl(path, params);

    const token = this.getAuthToken();
    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
    };

    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        headers: reqHeaders,
        credentials: "include",
        ...restOptions,
      });

      if (!response.ok) {
        let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.detail) {
            errorMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      // Check if no content response
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (err: any) {
      console.error(`API request failed [${options.method || "GET"} ${url}]:`, err);
      throw err;
    }
  }

  public async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(path, { method: "GET", params });
  }

  public async post<T>(path: string, data?: any, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      params,
    });
  }

  public async patch<T>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }

  public async upload<T>(path: string, formData: FormData): Promise<T> {
    const url = this.buildUrl(path);
    const token = this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Upload error ${response.status}: ${errText}`);
    }
    return await response.json();
  }
}

export const api = new ApiClient();
