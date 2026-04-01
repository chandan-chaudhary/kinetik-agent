"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";
import { Eye, EyeOff, Mail, User, Lock } from "lucide-react";
import AuthPageShell from "../_components/AuthPageShell";
import AuthCardHeader from "../_components/AuthCardHeader";
import { useRotatingAuthMessage } from "../_components/useRotatingAuthMessage";

const registerSchema = z.object({
  email: z.email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const activeMessageIndex = useRotatingAuthMessage();
  const { register: registerUser, isLoading } = useAuth();
  const { refreshUser } = useUser();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    const success = await registerUser(data);
    if (success) {
      await refreshUser();
      router.push("/dashboard");
    }
  };

  return (
    <AuthPageShell activeMessageIndex={activeMessageIndex}>
      <Card className="shadow-card w-full max-w-md border-border/70 bg-card/85 text-foreground backdrop-blur-xl">
        <AuthCardHeader
          title="Create account"
          description="Join and start building intelligent workflows"
        />

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground/90">
                Full name
              </Label>
              <div className="relative">
                <User className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="h-11 rounded-xl border-input bg-background pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/90">
                Email address
              </Label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="h-11 rounded-xl border-input bg-background pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/90">
                  Password
                </Label>
                <span className="text-muted-foreground text-xs">
                  Min 6 chars
                </span>
              </div>
              <div className="relative">
                <Lock className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="h-11 rounded-xl border-input bg-background pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="gradient-cta h-11 w-full rounded-xl text-primary-foreground transition-opacity duration-300 hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
            By signing up, you agree to all Terms and Conditions.
          </div>

          <div className="text-muted-foreground mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
