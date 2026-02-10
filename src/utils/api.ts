export interface ApiError {
  status: number;
  message: string;
  code: string;
  details?: any;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle session expiry
      if (response.status === 401 && typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        // Don't redirect if we are already on login page (e.g. invalid login attempt)
        // But usually login uses supabase client directly, not apiCall? 
        // If login uses apiCall, we must be careful.
        // AdminDashboard uses apiCall. Login page is /admin. Dashboard is /admin/dashboard.
        if (window.location.pathname !== '/admin' && window.location.pathname !== '/admin/') {
           window.location.href = '/admin';
        }
      }
      
      return {
        error: {
          status: response.status,
          message: errorData.error?.message || errorData.message || 'Request failed',
          code: errorData.error?.code || errorData.code || 'UNKNOWN_ERROR',
          details: errorData.error?.details || errorData.details,
        },
      };
    }

    const data = await response.json();
    return { data };
    
  } catch (error) {
    // Network errors, timeouts, etc.
    return {
      error: {
        status: 0,
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
