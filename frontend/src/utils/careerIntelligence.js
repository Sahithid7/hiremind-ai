// ── Role-based ATS keyword hints ──────────────────────────────────────────────
const roleKeywords = {
  "software engineer":   ["algorithms","api","testing","typescript","system design","cloud","ci/cd"],
  "backend engineer":    ["api","database","postgresql","docker","aws","microservices","pytest","scalability"],
  "data analyst":        ["sql","dashboard","tableau","python","metrics","experiments","stakeholders"],
  "cloud engineer":      ["aws","docker","kubernetes","linux","terraform","monitoring","networking"],
  "devops engineer":     ["ci/cd","terraform","kubernetes","docker","observability","automation","linux"],
};

// ── Comprehensive technical keyword dictionary ─────────────────────────────────
// Multi-word terms come first so they're matched before individual words
const TECH_KEYWORDS = [
  // Languages
  "python","java","javascript","typescript","go","golang","rust","c++","c#","kotlin","swift",
  "scala","ruby","r","matlab","bash","shell","sql","perl","php","elixir","clojure",
  // Frameworks / Libraries
  "react","angular","vue","node.js","nodejs","express","fastapi","django","flask","spring",
  "spring boot","laravel","rails","next.js","nextjs","nuxt","fastify","gin","echo","axum",
  "tensorflow","pytorch","keras","scikit-learn","pandas","numpy","scipy","spark","hadoop",
  // Cloud platforms
  "aws","azure","gcp","google cloud","amazon web services","microsoft azure",
  "ec2","s3","lambda","rds","dynamodb","sqs","sns","cloudwatch","ecr","eks","ecs","cloudformation",
  "azure devops","azure functions","gke","bigquery","cloud run","cloud storage",
  // DevOps / CI-CD
  "docker","kubernetes","k8s","terraform","ansible","jenkins","github actions","gitlab ci",
  "circleci","travis ci","argocd","helm","prometheus","grafana","datadog","splunk",
  "dynatrace","new relic","pagerduty","openshift","vagrant","chef","puppet","saltstack",
  "ci/cd","continuous integration","continuous deployment","continuous delivery","gitops",
  "infrastructure as code","iac","devops","sre","site reliability",
  // Databases
  "postgresql","mysql","mongodb","redis","elasticsearch","cassandra","dynamodb","sqlite",
  "mariadb","oracle","ms sql","sql server","neo4j","influxdb","clickhouse","snowflake",
  "bigquery","redshift","aurora","cosmos db","firebase","supabase",
  // Architecture / Concepts
  "microservices","monolith","event-driven","event driven","message queue","message broker",
  "kafka","rabbitmq","activemq","grpc","graphql","rest","restful","soap","websocket",
  "distributed systems","distributed computing","high availability","fault tolerance",
  "load balancing","caching","cdn","api gateway","service mesh","istio","envoy",
  "pub/sub","publish subscribe","saga pattern","cqrs","event sourcing","ddd",
  "domain driven design","clean architecture","solid principles","design patterns",
  // Testing
  "unit testing","integration testing","e2e testing","end-to-end","tdd","bdd",
  "pytest","jest","junit","selenium","cypress","playwright","postman","swagger",
  "test driven","regression testing","performance testing","load testing","mock","stub",
  // Security
  "oauth","jwt","ssl","tls","encryption","authentication","authorization","rbac",
  "zero trust","penetration testing","soc 2","gdpr","hipaa","owasp",
  // Methodologies
  "agile","scrum","kanban","lean","devops","waterfall","sprint","retrospective",
  "jira","confluence","linear","notion","trello","asana","monday",
  // Data / ML / AI
  "machine learning","deep learning","neural network","llm","large language model",
  "openai","langchain","rag","vector database","embedding","nlp","computer vision",
  "reinforcement learning","feature engineering","data pipeline","etl","data warehouse",
  "data lake","airflow","dbt","fivetran","looker","tableau","power bi",
  "observability tools","observability","monitoring","logging","tracing","metrics",
  // General software terms
  "algorithm","data structures","system design","scalability","performance","optimization",
  "code review","pair programming","technical documentation","api design","sdk",
  "object-oriented","oop","functional programming","concurrency","parallelism","async",
  "reactive programming","event loop","garbage collection","memory management",
  "version control","git","github","gitlab","bitbucket","trunk based","feature flags",
];

// Bullet suggestion templates for missing keywords
// {keyword} in the template is replaced with the actual keyword
const BULLET_SUGGESTIONS = {
  "typescript": "Developed type-safe backend services using TypeScript, reducing runtime errors by enforcing strict type contracts across the codebase",
  "javascript": "Built interactive front-end features and server-side scripts using JavaScript, improving user experience and reducing page load time",
  "go": "Designed high-performance microservices in Go, achieving sub-10ms response latency and efficient memory usage for high-throughput workloads",
  "golang": "Built concurrent data processing pipelines using Go, leveraging goroutines and channels to maximize throughput",
  "rust": "Implemented performance-critical system components in Rust, eliminating memory safety issues and achieving zero-cost abstractions",
  "kotlin": "Developed backend APIs in Kotlin with coroutines for non-blocking async operations, improving service responsiveness",
  "scala": "Built distributed data processing jobs in Scala using Spark, processing millions of records with fault-tolerant streaming",
  "react": "Built responsive front-end components using React and hooks, enabling dynamic user interfaces with efficient state management",
  "graphql": "Designed and implemented a GraphQL API layer, reducing over-fetching by 60% and enabling flexible client queries",
  "grpc": "Implemented inter-service communication using gRPC with Protocol Buffers, reducing serialization overhead compared to REST",
  "kafka": "Designed event-driven data pipelines using Apache Kafka, enabling real-time processing of 100K+ events per second",
  "rabbitmq": "Built asynchronous messaging workflows using RabbitMQ, decoupling services and improving fault tolerance",
  "redis": "Integrated Redis caching to reduce database load by 70%, improving API response times from 300ms to under 30ms",
  "mongodb": "Designed flexible document schemas using MongoDB, enabling rapid iteration on product features without schema migrations",
  "elasticsearch": "Built full-text search capabilities using Elasticsearch, enabling sub-second queries across millions of documents",
  "cassandra": "Architected a distributed Cassandra cluster for high-write-throughput use cases, supporting 50K+ writes per second",
  "snowflake": "Migrated analytics workloads to Snowflake, reducing query time by 80% through optimized warehouse sizing and clustering keys",
  "terraform": "Automated cloud infrastructure provisioning using Terraform, reducing environment setup time from days to minutes",
  "ansible": "Automated server configuration management using Ansible playbooks, ensuring consistent environments across dev/staging/prod",
  "helm": "Managed Kubernetes application deployments using Helm charts, standardizing release packaging across microservices",
  "argocd": "Implemented GitOps workflows using ArgoCD, enabling automated continuous deployment with auditable rollback capabilities",
  "prometheus": "Set up Prometheus metrics collection and Grafana dashboards, providing real-time visibility into service health and SLA adherence",
  "datadog": "Configured Datadog APM tracing and custom dashboards, reducing mean time to detect (MTTD) for production incidents by 45%",
  "grafana": "Built Grafana dashboards for infrastructure and application metrics, enabling proactive monitoring and capacity planning",
  "observability tools": "Implemented end-to-end observability using distributed tracing, structured logging, and metrics, reducing incident resolution time by 40%",
  "observability": "Improved system observability by instrumenting services with structured logs, distributed traces, and health metrics",
  "event-driven": "Designed event-driven microservices architecture using message brokers, enabling loose coupling and independent service scaling",
  "event driven": "Designed event-driven microservices architecture using message brokers, enabling loose coupling and independent service scaling",
  "distributed systems": "Designed distributed systems with fault tolerance and horizontal scaling, achieving 99.9% availability under variable load",
  "microservices": "Decomposed a monolithic application into microservices, enabling independent deployment cycles and improving team autonomy",
  "system design": "Led technical design reviews for high-scale system components, documenting architecture decisions and tradeoffs for team alignment",
  "machine learning": "Integrated machine learning models into production pipelines using scikit-learn, improving predictive accuracy by 22%",
  "deep learning": "Trained and deployed deep learning models for anomaly detection, achieving 94% precision in production environments",
  "openai": "Integrated OpenAI API for intelligent text processing features, enabling natural language understanding at scale",
  "langchain": "Built LLM-powered workflows using LangChain, automating document processing and reducing manual review time by 60%",
  "rag": "Implemented Retrieval-Augmented Generation (RAG) pipelines, improving LLM accuracy on domain-specific queries",
  "llm": "Integrated large language model APIs into product features, enabling AI-powered content generation and analysis",
  "scikit-learn": "Applied scikit-learn classification and regression models to production data, driving data-driven product improvements",
  "airflow": "Built and maintained Apache Airflow DAGs for data pipeline orchestration, ensuring reliable ETL execution with automated retries",
  "dbt": "Implemented dbt transformation models in the data warehouse, enabling versioned, tested, and documented analytical transformations",
  "software design": "Applied SOLID principles and design patterns to refactor legacy codebases, improving maintainability and reducing technical debt",
  "testing frameworks": "Implemented comprehensive testing strategies using testing frameworks (unit, integration, and e2e), achieving 85% code coverage",
  "unit testing": "Wrote unit and integration tests using pytest/JUnit, achieving 85%+ code coverage and catching regression bugs before production",
  "tdd": "Applied Test-Driven Development (TDD) to critical service components, improving confidence in deployments and reducing production bugs",
  "agile": "Participated in Agile ceremonies including sprint planning, daily standups, and retrospectives, improving team delivery predictability",
  "scrum": "Collaborated in Scrum sprints with cross-functional teams, consistently delivering feature commitments and reducing cycle time",
  "nosql databases": "Designed NoSQL database schemas for high-read workloads, leveraging document and key-value patterns for performance",
  "nosql": "Leveraged NoSQL databases to handle unstructured data at scale, enabling flexible schema evolution without downtime",
  "postgresql": "Designed normalized PostgreSQL schemas with indexed queries, supporting 10K+ concurrent users with sub-50ms read latency",
  "mysql": "Optimized MySQL queries and added appropriate indexes, reducing average query time from 800ms to under 100ms",
  "relational databases": "Designed normalized relational database schemas and optimized queries using indexes, partitioning, and query planning",
  "cloud platforms": "Deployed and managed applications across cloud platforms (AWS, GCP), leveraging managed services for scalability and reliability",
  "api development": "Designed and implemented RESTful APIs following OpenAPI specification, enabling seamless third-party integrations",
  "api design": "Designed versioned REST and GraphQL APIs with proper authentication, rate limiting, and backward-compatible evolution",
  "backend development": "Built scalable backend services with clean separation of concerns, handling authentication, business logic, and data persistence",
  "sdlc": "Followed the full Software Development Lifecycle from requirements to production deployment, maintaining thorough documentation at each phase",
  "code review": "Conducted thorough code reviews for team members, enforcing coding standards, catching bugs early, and mentoring junior developers",
  "debugging": "Diagnosed and resolved complex production bugs using systematic debugging, distributed tracing, and log analysis",
  "algorithms": "Applied efficient data structures and algorithms to optimize critical code paths, reducing computational complexity",
  "data structures": "Implemented optimized data structures for performance-critical components, improving throughput and reducing memory footprint",
  "concurrency": "Implemented thread-safe concurrent processing using locks, semaphores, and async patterns to maximize CPU utilization",
  "scalability": "Architected horizontally scalable services using stateless design patterns, enabling seamless scaling under traffic spikes",
  "performance": "Profiled and optimized service performance, achieving 3x throughput improvement through query optimization and caching",
  "load balancing": "Configured load balancers and auto-scaling policies, ensuring high availability across availability zones",
  "caching": "Implemented multi-layer caching strategy using Redis and CDN, reducing origin load by 65% during peak traffic",
  "message queue": "Implemented message queue-based async processing, decoupling producers from consumers and improving system resilience",
};

// ── Exports ─────────────────────────────────────────────────────────────────

export function textFromResumeForm(form) {
  return [form.summary, form.education, form.experience, form.skills, form.projects].filter(Boolean).join("\n");
}

export function analyzeResumeText(text, targetRole = "Backend Engineer") {
  const normalized = text.toLowerCase();
  const role = targetRole.toLowerCase();
  const keywords = roleKeywords[role] ?? roleKeywords["backend engineer"];
  const missingKeywords = keywords.filter((keyword) => !normalized.includes(keyword.toLowerCase()));
  const hasMetrics = /\d+%|\d+x|\$\d+|\d+\+/.test(text);
  const hasProjects = normalized.includes("project");
  const hasCloud = ["aws","azure","gcp","docker","kubernetes"].some((w) => normalized.includes(w));
  const base = 58 + (keywords.length - missingKeywords.length) * 5 + (hasMetrics ? 8 : 0) + (hasProjects ? 6 : 0) + (hasCloud ? 8 : 0);
  const score = Math.min(96, Math.max(42, base));
  const improvements = [
    !hasMetrics && "Add measurable impact to two experience bullets.",
    missingKeywords.length > 0 && `Add role keywords naturally: ${missingKeywords.slice(0, 4).join(", ")}.`,
    !hasCloud && "Mention deployment, cloud, or infrastructure experience if relevant.",
    !hasProjects && "Add one project with tech stack, problem, and outcome.",
    "Start bullets with strong verbs and include business or engineering impact.",
  ].filter(Boolean);
  return {
    atsScore: score,
    missingKeywords,
    weaknesses: [
      !hasMetrics && "Limited quantified impact",
      missingKeywords.length > 2 && "Keyword alignment can improve",
      text.split(/\s+/).length < 220 && "Resume content may be too thin",
    ].filter(Boolean),
    improvements,
    predictedScore: Math.min(98, score + Math.max(6, improvements.length * 3)),
  };
}

/**
 * Extract ALL meaningful technical keywords from a job description.
 * Returns an array of matched terms (preserving original casing from our dictionary).
 */
export function extractJdKeywords(jdText) {
  if (!jdText) return [];
  const lower = jdText.toLowerCase();
  const found = new Set();

  // Sort by length descending so multi-word terms are matched before sub-words
  const sorted = [...TECH_KEYWORDS].sort((a, b) => b.length - a.length);

  for (const kw of sorted) {
    // Use word-boundary-aware matching
    const escaped = kw.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\//g, "\\/");
    const pattern = new RegExp(`(?<![a-z0-9])(${escaped})(?![a-z0-9])`, "i");
    if (pattern.test(lower)) {
      // Preserve our dictionary's canonical casing
      found.add(kw);
    }
  }

  return [...found];
}

/**
 * Full JD match analysis.
 * Returns: { matchScore, matchingSkills, missingSkills, suggestions, explanation }
 *
 * suggestions: [{keyword, suggestedBullet}] — bullet point suggestions for missing keywords
 */
export function matchResumeToJob(resumeText, jobDescription) {
  const resumeLower = (resumeText || "").toLowerCase();
  const allJdKeywords = extractJdKeywords(jobDescription);

  // Check each keyword against the resume (full-text, fuzzy)
  const matchingSkills = [];
  const missingSkills  = [];

  for (const kw of allJdKeywords) {
    // Check for the keyword in the resume (word-boundary aware)
    const escaped = kw.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\//g, "\\/");
    const pattern = new RegExp(`(?<![a-z0-9])(${escaped})(?![a-z0-9])`, "i");
    if (pattern.test(resumeLower)) {
      matchingSkills.push(kw);
    } else {
      missingSkills.push(kw);
    }
  }

  const total = allJdKeywords.length;
  const matched = matchingSkills.length;
  const rawScore = total > 0 ? Math.round((matched / total) * 100) : 50;
  // Minimum floor of 35 so a poor match still looks directional
  const matchScore = Math.max(35, Math.min(96, rawScore));

  // Generate bullet suggestions for missing keywords (max 8)
  const suggestions = missingSkills
    .slice(0, 12)
    .map((kw) => {
      const template = BULLET_SUGGESTIONS[kw.toLowerCase()];
      return template ? { keyword: kw, suggestedBullet: template } : null;
    })
    .filter(Boolean)
    .slice(0, 8);

  const explanation = matched === 0
    ? "Very few JD keywords found in your resume. Add the missing terms where your experience genuinely supports them."
    : matched >= total * 0.75
    ? "Strong keyword alignment. Fine-tune with the missing terms to maximize ATS ranking."
    : "Moderate alignment. Adding the missing keywords where truthful will significantly improve your match score.";

  const suggestedEdits = missingSkills
    .slice(0, 5)
    .map((skill) => `Add "${skill}" where your experience genuinely supports it.`);

  return {
    matchScore,
    matchingSkills: matchingSkills.slice(0, 20),
    missingSkills:  missingSkills.slice(0, 20),
    suggestions,
    suggestedEdits,
    explanation,
  };
}

export function generateCoverLetter({ name, company, role, jobDescription, summary, experience, skills, tone }) {
  if (!name || !role || !company) {
    return "Please fill in your name, target role, and company before generating a cover letter.";
  }
  const jdPhrase = jobDescription
    ? `The role appears to value ${jobDescription.split(/\s+/).slice(0, 16).join(" ")}...`
    : "The role aligns with the professional experience reflected in my resume.";
  const experiencePhrase = [summary, experience, skills].filter(Boolean).join(" ").trim();
  const contextPhrase = experiencePhrase
    ? `My background includes ${experiencePhrase.split(/\s+/).slice(0, 30).join(" ")}.`
    : "I have carefully reviewed my background and can speak to the core responsibilities of this role.";
  return `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${role} position at ${company}. ${contextPhrase}\n\n${jdPhrase}\n\nI am confident in my ability to contribute meaningfully to ${company} and would welcome the opportunity to discuss how my experience aligns with the team's needs.\n\nThank you for your time and consideration.\n\nSincerely,\n${name}`;
}

export function generateInterviewPlan(role, focus = "") {
  const baseRole = role || "Backend Engineer";
  return {
    technical: [
      `How would you design a scalable API for a ${baseRole} product?`,
      "Explain how you would model relational data for users, resumes, and applications.",
      "How do you secure JWT authentication and password storage?",
      `What tradeoffs would you consider when deploying ${focus || "a cloud service"}?`,
    ],
    behavioral: [
      "Tell me about a time you handled ambiguity on a technical project.",
      "Describe a moment when you improved a process or reduced manual work.",
      "Tell me about a conflict with a teammate and how you handled it.",
    ],
    starStories: [
      "Project ownership: problem, technical decision, measurable result.",
      "Debugging: issue, investigation path, fix, prevention.",
      "Collaboration: stakeholder need, communication, delivery.",
    ],
    skills: ["System design","Testing strategy","Cloud fundamentals","Clear project storytelling"],
    roadmap: ["Day 1-10: revise core concepts","Day 11-20: practice projects and STAR stories","Day 21-30: mock interviews and role-specific drills"],
  };
}
