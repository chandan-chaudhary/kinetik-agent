"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import FloatingIcon from "./FloatingIcon";
import { useRouter } from "next/navigation";

const HeroSection = () => {
  const router = useRouter();

  return (
    <section className="relative min-h-screen gradient-hero pt-24 overflow-hidden">
      <div className="container mx-auto px-6 py-20">
        <div className="relative flex flex-col items-center justify-center min-h-[70vh]">
          {/* Floating Icons */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Slack-like icon - top left */}
            <FloatingIcon
              delay={0}
              className="absolute top-20 left-[10%] hidden lg:block"
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path
                  d="M10 25a5 5 0 1 1 5-5h5v5a5 5 0 0 1-10 0z"
                  fill="#E91E63"
                />
                <path
                  d="M15 10a5 5 0 0 1 5 5v5h-5a5 5 0 0 1 0-10z"
                  fill="#2196F3"
                />
                <path
                  d="M30 15a5 5 0 1 1-5 5h-5v-5a5 5 0 0 1 10 0z"
                  fill="#4CAF50"
                />
                <path
                  d="M25 30a5 5 0 0 1-5-5v-5h5a5 5 0 0 1 0 10z"
                  fill="#FFC107"
                />
              </svg>
            </FloatingIcon>

            {/* GitHub-like icon - left */}
            <FloatingIcon
              delay={0.5}
              className="absolute top-1/3 left-[5%] hidden lg:block"
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path
                  d="M20 5C11.716 5 5 11.716 5 20c0 6.627 4.298 12.25 10.259 14.233.75.138 1.025-.325 1.025-.722 0-.356-.013-1.3-.02-2.55-4.172.907-5.052-2.01-5.052-2.01-.682-1.733-1.665-2.194-1.665-2.194-1.362-.931.103-.912.103-.912 1.506.106 2.299 1.547 2.299 1.547 1.338 2.293 3.51 1.631 4.365 1.247.136-.969.524-1.631.953-2.006-3.33-.379-6.834-1.665-6.834-7.41 0-1.637.585-2.975 1.545-4.024-.155-.378-.67-1.903.147-3.967 0 0 1.26-.403 4.125 1.537a14.353 14.353 0 0 1 3.756-.506c1.275.006 2.559.172 3.758.506 2.863-1.94 4.121-1.537 4.121-1.537.818 2.064.304 3.589.149 3.967.962 1.049 1.543 2.387 1.543 4.024 0 5.759-3.51 7.027-6.851 7.398.539.464 1.019 1.381 1.019 2.783 0 2.009-.018 3.63-.018 4.123 0 .401.27.868 1.033.72C30.707 32.244 35 26.623 35 20c0-8.284-6.716-15-15-15z"
                  fill="#10B981"
                />
              </svg>
            </FloatingIcon>

            {/* Connection icon - top right */}
            <FloatingIcon
              delay={0.3}
              className="absolute top-16 right-[12%] hidden lg:block"
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="12" cy="12" r="4" fill="#EF4444" />
                <circle cx="28" cy="12" r="4" fill="#EF4444" />
                <circle cx="20" cy="20" r="4" fill="#EF4444" />
                <line
                  x1="14"
                  y1="14"
                  x2="18"
                  y2="18"
                  stroke="#EF4444"
                  strokeWidth="2"
                />
                <line
                  x1="26"
                  y1="14"
                  x2="22"
                  y2="18"
                  stroke="#EF4444"
                  strokeWidth="2"
                />
              </svg>
            </FloatingIcon>

            {/* ChatGPT-like icon - right */}
            <FloatingIcon
              delay={0.7}
              className="absolute top-1/3 right-[8%] hidden lg:block"
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path
                  d="M20 5C11.716 5 5 11.716 5 20s6.716 15 15 15 15-6.716 15-15S28.284 5 20 5zm0 27c-6.627 0-12-5.373-12-12S13.373 8 20 8s12 5.373 12 12-5.373 12-12 12z"
                  fill="#10B981"
                />
                <path
                  d="M20 12a8 8 0 0 0-8 8h3a5 5 0 0 1 5-5v-3z"
                  fill="#10B981"
                />
                <path
                  d="M28 20a8 8 0 0 0-8-8v3a5 5 0 0 1 5 5h3z"
                  fill="#10B981"
                />
                <path
                  d="M20 28a8 8 0 0 0 8-8h-3a5 5 0 0 1-5 5v3z"
                  fill="#10B981"
                />
              </svg>
            </FloatingIcon>

            {/* Sun/spark icon - bottom left */}
            <FloatingIcon
              delay={0.4}
              className="absolute bottom-32 left-[18%] hidden lg:block"
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path
                  d="M20 8v4M20 28v4M8 20h4M28 20h4M12.343 12.343l2.828 2.828M24.829 24.829l2.828 2.828M12.343 27.657l2.828-2.828M24.829 15.171l2.828-2.828"
                  stroke="#F97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="20" cy="20" r="4" fill="#F97316" />
              </svg>
            </FloatingIcon>

            {/* Infinity icon - bottom right */}
            <FloatingIcon
              delay={0.6}
              className="absolute bottom-36 right-[15%] hidden lg:block"
            >
              <svg width="50" height="40" viewBox="0 0 50 40" fill="none">
                <path
                  d="M13 20c0-3.866 3.134-7 7-7 2.761 0 5.171 1.6 6.32 3.92L30 20l-3.68 3.08C25.171 25.4 22.761 27 20 27c-3.866 0-7-3.134-7-7z"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M37 20c0 3.866-3.134 7-7 7-2.761 0-5.171-1.6-6.32-3.92L20 20l3.68-3.08C24.829 14.6 27.239 13 30 13c3.866 0 7 3.134 7 7z"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  fill="none"
                />
              </svg>
            </FloatingIcon>
          </div>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto relative z-10"
          >
            {/* Logo/Name Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-semibold text-primary tracking-wide">
                IN MOTION
              </span>
            </motion.div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-tight mb-6">
              <span className="text-gradient-primary">Kinetik</span>
              <br />
              <span className="text-4xl md:text-5xl text-muted-foreground font-normal">
                AI That Doesn&apos;t Just Talk—
                <span className="text-foreground font-semibold"> It Acts</span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              While chatbots just respond, Kinetik{" "}
              <span className="text-foreground font-medium">executes</span>.
              Query databases. Automate workflows. Process data. Build
              intelligent agents that move with purpose and deliver results.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                onClick={() => router.push("/login")}
                size="lg"
                className="gradient-cta text-primary-foreground px-8 py-6 text-base font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg group"
              >
                Get Started
                <svg
                  className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-base font-medium rounded-xl border-2 hover:bg-accent transition-colors"
              >
                See It in Action
              </Button>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Database Integration</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Workflow Automation</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Real Action, Not Just Chat</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
