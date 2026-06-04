/**
 * Gallery sample resume — used in template previews.
 * Format matches the output of buildResumeFromForm / normalize()
 * so the gallery preview is identical to the exported PDF.
 */
export const GALLERY_SAMPLE = {
  candidate: "Alex Rivera",
  title: "Senior Software Engineer",
  contact: {
    email: "alex.rivera@email.com",
    phone: "(415) 555-0192",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexrivera",
    website: "github.com/alexrivera",
  },
  summary:
    "Full-stack engineer with 6+ years building high-scale systems at Stripe and Airbnb. Led teams of 4–8 engineers. Reduced API latency by 45% and shipped features used by 2M+ users. Passionate about developer experience and clean architecture.",
  experience: [
    {
      role: "Senior Software Engineer",
      company: "Stripe",
      location: "San Francisco, CA",
      date: "Jan 2021 – Present",
      bullets: [
        "Redesigned payment API reducing p99 latency by 45%, saving $2.1M annually in infrastructure costs",
        "Led migration of monolith to microservices serving 2M+ daily active users with 99.99% uptime",
        "Mentored 4 engineers; 3 promoted to senior within 18 months",
      ],
    },
    {
      role: "Software Engineer",
      company: "Airbnb",
      location: "San Francisco, CA",
      date: "Mar 2018 – Dec 2020",
      bullets: [
        "Built search ranking feature that increased booking conversion by 8% ($40M annual revenue impact)",
        "Reduced CI/CD pipeline runtime by 60% through parallelization, saving 200+ eng-hours/month",
        "Developed real-time availability system handling 500K concurrent users during peak travel periods",
      ],
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      school: "UC Berkeley",
      graduation_date: "2018",
      gpa: "3.8",
    },
  ],
  skills: [
    "Python", "TypeScript", "React", "Go", "PostgreSQL", "Redis",
    "AWS", "Kubernetes", "Docker", "GraphQL", "Terraform", "GitHub Actions",
    "Kafka", "gRPC", "Rust",
  ],
  projects: [
    "OpenMetrics | Python, Prometheus, Grafana\n• Open-source observability library with 1.4K GitHub stars\n• Used by 50+ companies in production at scale",
    "FastQueue | Go, Redis, WebSocket\n• High-throughput job queue processing 10M+ tasks/day\n• Used in production at 3 startups",
  ],
  certifications: [
    "AWS Certified Solutions Architect – Associate (2023)",
    "Google Cloud Professional Data Engineer (2022)",
  ],
  achievements: [
    "Reduced API latency by 45%, saving $2.1M annually",
    "Led migration to microservices serving 2M+ daily active users",
    "Shipped Stripe Radar ML improvements reducing fraud by 23%",
  ],
};
