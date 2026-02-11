import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/utils";
import { toast } from "sonner";

interface RegisterData {
  email: string;
  name: string;
  password: string;
}

interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface AuthResponse {
  access_token: string;
}

interface User {
  userId: string;
  email: string;
  name?: string;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}auth/register`,
        data,
        { withCredentials: true },
      );

      if (response.data.access_token) {
        toast.success("Registration successful! Welcome aboard.");
        return true;
      }
      return false;
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}auth/login`,
        data,
        { withCredentials: true },
      );

      if (response.data.access_token) {
        toast.success("Login successful! Welcome back.");
        return true;
      }
      return false;
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getProfile = async (): Promise<User | null> => {
    try {
      const response = await axios.get<{ user: User }>(
        `${API_BASE_URL}auth/profile`,
        { withCredentials: true },
      );
      return response.data.user;
    } catch (error) {
      return null;
    }
  };

  const updatePassword = async (data: UpdatePasswordData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}auth/update-password`,
        data,
        { withCredentials: true },
      );

      if (response.status === 200) {
        toast.success("Password updated successfully!");
        return true;
      }
      return false;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to update password";
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      // Clear cookies by making a request that might handle logout
      // Since we're using httpOnly cookies, we might need a logout endpoint
      document.cookie =
        "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Logout failed");
    }
  };
  return {
    register,
    login,
    getProfile,
    updatePassword,
    logout,
    isLoading,
  };
};
