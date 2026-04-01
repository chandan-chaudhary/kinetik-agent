"use client";

import { motion } from "framer-motion";
import { Database, Workflow, KeyRound } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Database Copilot",
    description:
      "Query SQL and MongoDB data in natural language and get actionable responses without manual query writing.",
  },
  {
    icon: Workflow,
    title: "Workflow Builder",
    description:
      "Design visual automations with node-based flows to trigger actions and orchestrate business logic.",
  },
  {
    icon: KeyRound,
    title: "Credential Vault",
    description:
      "Securely store and manage LLM, database, and external API credentials for safe workflow execution.",
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
            Built For What You Use Today
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Core capabilities available now in your Kinetik workspace
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
