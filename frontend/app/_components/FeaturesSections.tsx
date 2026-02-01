'use client'

import { motion } from "framer-motion";
import { Bot, Zap, Shield, Workflow, LineChart, Users } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Automation",
    description: "Deploy intelligent agents that learn and adapt to your business processes.",
  },
  {
    icon: Zap,
    title: "Real-time Processing",
    description: "Lightning-fast data processing with instant insights and actions.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade security with end-to-end encryption and compliance.",
  },
  {
    icon: Workflow,
    title: "Seamless Integration",
    description: "Connect with 200+ tools and platforms in your existing workflow.",
  },
  {
    icon: LineChart,
    title: "Advanced Analytics",
    description: "Deep insights and predictive analytics powered by machine learning.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Built for teams with roles, permissions, and shared workspaces.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our AI Intelligent Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful capabilities designed to transform your business operations
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-background rounded-2xl p-8 shadow-card hover:shadow-float transition-shadow duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
