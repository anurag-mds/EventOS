// ─── EVENTOS Seed Data ───────────────────────────────────────────────────────
// Realistic demo data for the PromptWars x AbhiyantriX hackathon.
// Imported once by eventStore.ts — never mutated directly.

import type {
  HackathonEvent,
  Participant,
  Team,
  Judge,
  Submission,
  Incident,
  ActivityEntry,
  LeaderboardEntry,
} from './types';

// ─── Event ───────────────────────────────────────────────────────────────────

const NOW = Date.now();
const HOUR = 3_600_000;

export const seedEvent: HackathonEvent = {
  id: 'evt-001',
  name: 'PromptWars × AbhiyantriX',
  tagline: 'Build the future in 150 minutes',
  startTime: NOW - 90 * 60_000,
  endTime: NOW + 60 * 60_000,
  phase: 'hacking',
  venueOrUrl: 'VJTI Main Hall, Mumbai',
  organizerName: 'AbhiyantriX Technical Council',
  maxTeamSize: 4,
  totalPrizePool: '₹1,50,000',
};

// ─── Participants ─────────────────────────────────────────────────────────────

export const seedParticipants: Record<string, Participant> = {
  'p-01': { id: 'p-01', name: 'Aryan Mehta',    email: 'aryan@vjti.ac.in',   teamId: null,   checkedIn: true,  skills: ['React', 'TypeScript', 'Gemini API'] },
  'p-02': { id: 'p-02', name: 'Priya Nair',     email: 'priya@vjti.ac.in',   teamId: 't-01', checkedIn: true,  skills: ['Node.js', 'GCP', 'Firebase'] },
  'p-03': { id: 'p-03', name: 'Rahul Desai',    email: 'rahul@vjti.ac.in',   teamId: 't-01', checkedIn: true,  skills: ['Python', 'FastAPI', 'BigQuery'] },
  'p-04': { id: 'p-04', name: 'Sneha Iyer',     email: 'sneha@vjti.ac.in',   teamId: 't-01', checkedIn: false, skills: ['UI/UX', 'Figma', 'CSS'] },
  'p-05': { id: 'p-05', name: 'Karan Shah',     email: 'karan@iitb.ac.in',   teamId: 't-02', checkedIn: true,  skills: ['Rust', 'WebAssembly', 'Vertex AI'] },
  'p-06': { id: 'p-06', name: 'Meera Pillai',   email: 'meera@iitb.ac.in',   teamId: 't-02', checkedIn: true,  skills: ['Kotlin', 'Android', 'Maps SDK'] },
  'p-07': { id: 'p-07', name: 'Aarav Joshi',    email: 'aarav@iitb.ac.in',   teamId: 't-02', checkedIn: true,  skills: ['Go', 'Cloud Run', 'Pub/Sub'] },
  'p-08': { id: 'p-08', name: 'Tanvi Kulkarni', email: 'tanvi@iitb.ac.in',   teamId: 't-02', checkedIn: true,  skills: ['ML', 'TensorFlow', 'Gemini'] },
  'p-09': { id: 'p-09', name: 'Dev Rao',        email: 'dev@coep.ac.in',     teamId: 't-03', checkedIn: true,  skills: ['React', 'Redux', 'Vite'] },
  'p-10': { id: 'p-10', name: 'Ritu Sharma',    email: 'ritu@coep.ac.in',    teamId: 't-03', checkedIn: true,  skills: ['Django', 'PostgreSQL', 'GKE'] },
  'p-11': { id: 'p-11', name: 'Nikhil Patil',   email: 'nikhil@coep.ac.in',  teamId: 't-03', checkedIn: false, skills: ['iOS', 'Swift', 'ARKit'] },
  'p-12': { id: 'p-12', name: 'Anjali Singh',   email: 'anjali@coep.ac.in',  teamId: 't-03', checkedIn: true,  skills: ['NLP', 'HuggingFace', 'LangChain'] },
  'p-13': { id: 'p-13', name: 'Siddharth Kaur', email: 'sid@mit.edu.in',     teamId: 't-04', checkedIn: true,  skills: ['Flutter', 'Dart', 'Firebase'] },
  'p-14': { id: 'p-14', name: 'Pooja Venkat',   email: 'pooja@mit.edu.in',   teamId: 't-04', checkedIn: true,  skills: ['GCP', 'Terraform', 'Dataflow'] },
  'p-15': { id: 'p-15', name: 'Rohan Bhat',     email: 'rohan@mit.edu.in',   teamId: 't-04', checkedIn: true,  skills: ['GraphQL', 'Apollo', 'Spanner'] },
  'p-16': { id: 'p-16', name: 'Kavya Reddy',    email: 'kavya@mit.edu.in',   teamId: 't-04', checkedIn: true,  skills: ['Vision AI', 'AutoML', 'BigQuery ML'] },
  'p-17': { id: 'p-17', name: 'Aditya Kumar',   email: 'aditya@nmims.edu',   teamId: 't-05', checkedIn: true,  skills: ['Vue.js', 'Nuxt', 'Cloud Functions'] },
  'p-18': { id: 'p-18', name: 'Ishaan Malhotra',email: 'ishaan@nmims.edu',   teamId: 't-05', checkedIn: true,  skills: ['Svelte', 'WebSockets', 'Redis'] },
  'p-19': { id: 'p-19', name: 'Simran Patel',   email: 'simran@nmims.edu',   teamId: 't-05', checkedIn: false, skills: ['Product', 'Pitch Deck', 'Figma'] },
  'p-20': { id: 'p-20', name: 'Yash Tiwari',    email: 'yash@nmims.edu',     teamId: 't-05', checkedIn: true,  skills: ['Solidity', 'Web3', 'Ethers.js'] },
  'p-21': { id: 'p-21', name: 'Natasha Ghosh',  email: 'natasha@dj.ac.in',   teamId: 't-06', checkedIn: true,  skills: ['Java', 'Spring Boot', 'Kubernetes'] },
  'p-22': { id: 'p-22', name: 'Vishal More',    email: 'vishal@dj.ac.in',    teamId: 't-06', checkedIn: true,  skills: ['DevOps', 'GitHub Actions', 'Docker'] },
  'p-23': { id: 'p-23', name: 'Diya Fernandez', email: 'diya@dj.ac.in',      teamId: 't-06', checkedIn: true,  skills: ['AI Ethics', 'Research', 'Python'] },
  'p-24': { id: 'p-24', name: 'Harsh Trivedi',  email: 'harsh@ict.ac.in',    teamId: 't-07', checkedIn: true,  skills: ['C++', 'Embedded', 'IoT'] },
  'p-25': { id: 'p-25', name: 'Ananya Das',     email: 'ananya@ict.ac.in',   teamId: 't-07', checkedIn: true,  skills: ['Data Science', 'Pandas', 'Looker'] },
  'p-26': { id: 'p-26', name: 'Tejas Sawant',   email: 'tejas@ict.ac.in',    teamId: 't-07', checkedIn: true,  skills: ['React Native', 'Expo', 'Firebase'] },
  'p-27': { id: 'p-27', name: 'Shruti Naik',    email: 'shruti@ict.ac.in',   teamId: 't-07', checkedIn: false, skills: ['Content', 'SEO', 'Analytics'] },
  'p-28': { id: 'p-28', name: 'Om Chaudhari',   email: 'om@somaiya.edu',     teamId: 't-08', checkedIn: true,  skills: ['Next.js', 'tRPC', 'Prisma'] },
  'p-29': { id: 'p-29', name: 'Riddhi Jain',    email: 'riddhi@somaiya.edu', teamId: 't-08', checkedIn: true,  skills: ['Cloud Spanner', 'AlloyDB', 'SQL'] },
  'p-30': { id: 'p-30', name: 'Farhan Sheikh',  email: 'farhan@somaiya.edu', teamId: 't-08', checkedIn: true,  skills: ['Security', 'OAuth2', 'Zero Trust'] },
  'p-31': { id: 'p-31', name: 'Lakshmi Iyer',   email: 'lakshmi@sp.edu.in',  teamId: 't-09', checkedIn: true,  skills: ['Angular', 'RxJS', 'NestJS'] },
  'p-32': { id: 'p-32', name: 'Arjun Bose',     email: 'arjun@sp.edu.in',    teamId: null,   checkedIn: false, skills: ['Backend', 'Microservices', 'gRPC'] },
  'p-33': { id: 'p-33', name: 'Swati Chopra',   email: 'swati@sp.edu.in',    teamId: null,   checkedIn: true,  skills: ['Elasticsearch', 'Kibana', 'Grafana'] },
  'p-34': { id: 'p-34', name: 'Kabir Sinha',    email: 'kabir@sp.edu.in',    teamId: 't-10', checkedIn: true,  skills: ['Unity', 'C#', 'ARCore'] },
  'p-35': { id: 'p-35', name: 'Maya Patel',     email: 'maya@sp.edu.in',     teamId: 't-10', checkedIn: true,  skills: ['Game Design', '3D Modeling', 'Blender'] },
  'p-36': { id: 'p-36', name: 'Vivek Gupta',    email: 'vivek@bvp.edu.in',   teamId: 't-11', checkedIn: true,  skills: ['Blockchain', 'Smart Contracts', 'Solana'] },
  'p-37': { id: 'p-37', name: 'Nisha Agarwal',  email: 'nisha@bvp.edu.in',   teamId: null,   checkedIn: false, skills: ['Tokenomics', 'Crypto', 'DeFi'] },
  'p-38': { id: 'p-38', name: 'Rajat Mehta',    email: 'rajat@bvp.edu.in',   teamId: 't-11', checkedIn: true,  skills: ['Web3', 'IPFS', 'NFT'] },
  'p-39': { id: 'p-39', name: 'Tina Das',       email: 'tina@sies.edu.in',   teamId: 't-12', checkedIn: true,  skills: ['Quantum', 'Qiskit', 'Python'] },
  'p-40': { id: 'p-40', name: 'Rohit Khanna',   email: 'rohit@sies.edu.in',  teamId: 't-12', checkedIn: true,  skills: ['Physics', 'Math', 'Research'] },
};

// ─── Teams ────────────────────────────────────────────────────────────────────

export const seedTeams: Record<string, Team> = {
  't-01': { id: 't-01', name: 'NeuralNomads',    memberIds: ['p-02','p-03','p-04'], projectTitle: 'EventOS AI',          projectDescription: 'Real-time event OS powered by Gemini for anomaly detection', tags: ['AI','GCP','React'],       submissionId: 'sub-01' },
  't-02': { id: 't-02', name: 'ByteBlitz',       memberIds: ['p-05','p-06','p-07','p-08'], projectTitle: 'CrowdSense',          projectDescription: 'ML-based crowd flow optimization using Vertex AI',           tags: ['ML','Vertex AI','Maps'],  submissionId: 'sub-02' },
  't-03': { id: 't-03', name: 'CloudCrafters',   memberIds: ['p-09','p-10','p-11','p-12'], projectTitle: 'SpotLight',           projectDescription: 'NLP-driven sponsor-participant matching engine',               tags: ['NLP','Firebase','GKE'],   submissionId: 'sub-03' },
  't-04': { id: 't-04', name: 'PixelPioneers',   memberIds: ['p-13','p-14','p-15','p-16'], projectTitle: 'JudgeAssist',         projectDescription: 'AutoML submission scoring assistant for judges',              tags: ['AutoML','Flutter','ML'],  submissionId: 'sub-04' },
  't-05': { id: 't-05', name: 'SynapticSquad',   memberIds: ['p-17','p-18','p-19','p-20'], projectTitle: 'HackaChain',          projectDescription: 'Blockchain-anchored submission audit trail',                  tags: ['Web3','Vue','Cloud Run'], submissionId: 'sub-05' },
  't-06': { id: 't-06', name: 'KernelKrew',      memberIds: ['p-21','p-22','p-23'],        projectTitle: 'SecureHack',          projectDescription: 'Zero-trust DevSecOps pipeline for hackathon infra',           tags: ['Security','K8s','DevOps'],submissionId: 'sub-06' },
  't-07': { id: 't-07', name: 'DataDrifters',    memberIds: ['p-24','p-25','p-26','p-27'], projectTitle: 'InsightBoard',        projectDescription: 'Real-time analytics dashboard powered by Looker + BigQuery',  tags: ['Data','Looker','IoT'],    submissionId: 'sub-07' },
  't-08': { id: 't-08', name: 'AlphaBuilders',   memberIds: ['p-28','p-29','p-30'],        projectTitle: 'VaultDB',             projectDescription: 'Encrypted multi-tenant Spanner schema with AlloyDB failover', tags: ['Security','SQL','Next.js'],submissionId: 'sub-08' },
  't-09': { id: 't-09', name: 'CodeCatalysts',   memberIds: ['p-31'],                  projectTitle: 'LogLens',             projectDescription: 'Distributed tracing & log aggregation with Elasticsearch',    tags: ['DevOps','Backend','Observability'], submissionId: null },
  't-10': { id: 't-10', name: 'MetaMinds',       memberIds: ['p-34','p-35'],               projectTitle: 'ARena',               projectDescription: 'AR-powered venue navigation using ARCore',                    tags: ['AR','Unity','Mobile'],    submissionId: null },
  't-11': { id: 't-11', name: 'ChainChangers',   memberIds: ['p-36','p-38'],           projectTitle: 'DAppDao',             projectDescription: 'Decentralized governance platform for hackathon voting',      tags: ['Blockchain','DeFi','Web3'], submissionId: null },
  't-12': { id: 't-12', name: 'QuantumQuest',    memberIds: ['p-39','p-40'],               projectTitle: 'QuantSim',            projectDescription: 'Quantum algorithm simulator for optimization problems',       tags: ['Quantum','Research','Python'], submissionId: null },
};

// ─── Judges ───────────────────────────────────────────────────────────────────

export const seedJudges: Record<string, Judge> = {
  'j-01': {
    id: 'j-01', name: 'Dr. Prashant Vaidya',
    expertise: ['AI', 'ML', 'Vertex AI', 'NLP'],
    assignedSubmissionIds: ['sub-01', 'sub-02', 'sub-03'],
    capacityLimit: 3,
  },
  'j-02': {
    id: 'j-02', name: 'Ms. Shraddha Kulkarni',
    expertise: ['Cloud Architecture', 'GCP', 'Security', 'DevOps'],
    assignedSubmissionIds: ['sub-01', 'sub-04', 'sub-06'],
    capacityLimit: 3,
  },
  'j-03': {
    id: 'j-03', name: 'Mr. Rohan Kapoor',
    expertise: ['Product', 'UX', 'Business Impact', 'Pitch'],
    assignedSubmissionIds: ['sub-02', 'sub-03', 'sub-04'],
    capacityLimit: 3,
  },
  'j-04': {
    id: 'j-04', name: 'Dr. Anita Deshmukh',
    expertise: ['Data Science', 'BigQuery', 'Analytics', 'Looker'],
    assignedSubmissionIds: ['sub-05', 'sub-07'],
    capacityLimit: 3,
  },
  'j-05': {
    id: 'j-05', name: 'Mr. Sameer Patil',
    expertise: ['Web3', 'Blockchain', 'Smart Contracts', 'DeFi'],
    assignedSubmissionIds: ['sub-05', 'sub-08'],
    capacityLimit: 3,
  },
  'j-06': {
    id: 'j-06', name: 'Ms. Kavita Rao',
    expertise: ['Frontend', 'React', 'TypeScript', 'Performance'],
    assignedSubmissionIds: ['sub-06', 'sub-07', 'sub-08'],
    capacityLimit: 3,
  },
  'j-07': {
    id: 'j-07', name: 'Dr. Neha Iyer',
    expertise: ['UX Research', 'Accessibility', 'Design Systems', 'Testing'],
    assignedSubmissionIds: [],
    capacityLimit: 3,
  },
  'j-08': {
    id: 'j-08', name: 'Mr. Vikram Joshi',
    expertise: ['AI Safety', 'Prompt Engineering', 'APIs', 'Integrations'],
    assignedSubmissionIds: [],
    capacityLimit: 3,
  },
};

// ─── Submissions ──────────────────────────────────────────────────────────────

export const seedSubmissions: Record<string, Submission> = {
  'sub-01': {
    id: 'sub-01', teamId: 't-01',
    title: 'EventOS AI',
    description: 'Real-time event OS powered by Gemini for anomaly detection',
    repoUrl: 'https://github.com/neuralnomads/eventos-ai',
    demoUrl: 'https://eventos-ai.web.app',
    status: 'under_review',
    scores: { 'j-02': 88 },
    submittedAt: NOW - 30 * 60_000,
  },
  'sub-02': {
    id: 'sub-02', teamId: 't-02',
    title: 'CrowdSense',
    description: 'ML-based crowd flow optimization using Vertex AI',
    repoUrl: 'https://github.com/byteblitz/crowdsense',
    demoUrl: 'https://crowdsense.run.app',
    status: 'under_review',
    scores: { 'j-01': 92, 'j-03': 85 },
    submittedAt: NOW - 45 * 60_000,
  },
  'sub-03': {
    id: 'sub-03', teamId: 't-03',
    title: 'SpotLight',
    description: 'NLP-driven sponsor-participant matching engine',
    repoUrl: 'https://github.com/cloudcrafters/spotlight',
    demoUrl: 'https://spotlight-demo.web.app',
    status: 'scored',
    scores: { 'j-01': 78, 'j-03': 81 },
    submittedAt: NOW - 60 * 60_000,
  },
  'sub-04': {
    id: 'sub-04', teamId: 't-04',
    title: 'JudgeAssist',
    description: 'AutoML submission scoring assistant for judges',
    repoUrl: 'https://github.com/pixelpioneers/judgeassist',
    demoUrl: 'https://judgeassist.run.app',
    status: 'under_review',
    scores: { 'j-02': 95, 'j-03': 91 },
    submittedAt: NOW - 20 * 60_000,
  },
  'sub-05': {
    id: 'sub-05', teamId: 't-05',
    title: 'HackaChain',
    description: 'Blockchain-anchored submission audit trail',
    repoUrl: 'https://github.com/synaptic/hackachain',
    demoUrl: 'https://hackachain.vercel.app',
    status: 'under_review',
    scores: { 'j-04': 82, 'j-05': 89 },
    submittedAt: NOW - 35 * 60_000,
  },
  'sub-06': {
    id: 'sub-06', teamId: 't-06',
    title: 'SecureHack',
    description: 'Zero-trust DevSecOps pipeline for hackathon infra',
    repoUrl: 'https://github.com/kernelkrew/securehack',
    demoUrl: 'https://securehack.run.app',
    status: 'under_review',
    scores: { 'j-02': 91, 'j-06': 87 },
    submittedAt: NOW - 25 * 60_000,
  },
  'sub-07': {
    id: 'sub-07', teamId: 't-07',
    title: 'InsightBoard',
    description: 'Real-time analytics dashboard powered by Looker + BigQuery',
    repoUrl: 'https://github.com/datadrifters/insightboard',
    demoUrl: 'https://insightboard.web.app',
    status: 'under_review',
    scores: { 'j-04': 86, 'j-06': 84 },
    submittedAt: NOW - 40 * 60_000,
  },
  'sub-08': {
    id: 'sub-08', teamId: 't-08',
    title: 'VaultDB',
    description: 'Encrypted multi-tenant Spanner schema with AlloyDB failover',
    repoUrl: 'https://github.com/alphabuilders/vaultdb',
    demoUrl: 'https://vaultdb-demo.run.app',
    status: 'under_review',
    scores: { 'j-05': 90, 'j-06': 88 },
    submittedAt: NOW - 50 * 60_000,
  },
};

// ─── Incidents ────────────────────────────────────────────────────────────────

export const seedIncidents: Incident[] = [
  {
    id: 'inc-01',
    title: 'Wi-Fi Gateway Overloaded',
    description: 'Router in Zone B dropping packets. ~12 participants affected.',
    severity: 'high',
    status: 'open',
    reportedAt: NOW - 25 * 60_000,
    resolvedAt: null,
    affectedTeamIds: ['t-05', 't-06'],
  },
  {
    id: 'inc-02',
    title: 'Vending Machine Card Reader Offline',
    description: 'Card reader in cafeteria not accepting payments.',
    severity: 'low',
    status: 'acknowledged',
    reportedAt: NOW - 55 * 60_000,
    resolvedAt: null,
    affectedTeamIds: [],
  },
];

// ─── Activity Feed ────────────────────────────────────────────────────────────

export const seedActivity: ActivityEntry[] = [
  { id: 'act-01', kind: 'submission',        message: 'NeuralNomads submitted EventOS AI',                     timestamp: NOW - 30 * 60_000, teamId: 't-01', actorName: 'Aryan Mehta' },
  { id: 'act-02', kind: 'submission',        message: 'ByteBlitz submitted CrowdSense',                        timestamp: NOW - 45 * 60_000, teamId: 't-02', actorName: 'Karan Shah' },
  { id: 'act-03', kind: 'submission',        message: 'CloudCrafters submitted SpotLight',                     timestamp: NOW - 60 * 60_000, teamId: 't-03', actorName: 'Dev Rao' },
  { id: 'act-04', kind: 'submission',        message: 'PixelPioneers submitted JudgeAssist',                   timestamp: NOW - 20 * 60_000, teamId: 't-04', actorName: 'Siddharth Kaur' },
  { id: 'act-05', kind: 'score_posted',      message: 'Dr. Vaidya scored CrowdSense: 92/100',                  timestamp: NOW - 18 * 60_000, teamId: 't-02', actorName: 'Dr. Prashant Vaidya' },
  { id: 'act-06', kind: 'score_posted',      message: 'Ms. Kulkarni scored EventOS AI: 88/100',                timestamp: NOW - 15 * 60_000, teamId: 't-01', actorName: 'Ms. Shraddha Kulkarni' },
  { id: 'act-07', kind: 'score_posted',      message: 'Mr. Kapoor scored SpotLight: 81/100',                   timestamp: NOW - 12 * 60_000, teamId: 't-03', actorName: 'Mr. Rohan Kapoor' },
  { id: 'act-08', kind: 'score_posted',      message: 'Ms. Kulkarni scored JudgeAssist: 95/100',               timestamp: NOW - 10 * 60_000, teamId: 't-04', actorName: 'Ms. Shraddha Kulkarni' },
  { id: 'act-09', kind: 'incident_opened',   message: 'Incident reported: Wi-Fi Gateway Overloaded (HIGH)',    timestamp: NOW - 25 * 60_000, teamId: null,   actorName: 'Organizer' },
  { id: 'act-10', kind: 'check_in',          message: 'Aryan Mehta checked in',                               timestamp: NOW - 90 * 60_000, teamId: 't-01', actorName: 'Aryan Mehta' },
  { id: 'act-11', kind: 'check_in',          message: 'Karan Shah checked in',                                timestamp: NOW - 88 * 60_000, teamId: 't-02', actorName: 'Karan Shah' },
  { id: 'act-12', kind: 'announcement',      message: '🚀 Hacking phase has begun! 60 minutes remain.',        timestamp: NOW - 60 * 60_000, teamId: null,   actorName: 'Organizer' },
  { id: 'act-13', kind: 'team_join',         message: 'Tanvi Kulkarni joined ByteBlitz',                       timestamp: NOW - 85 * 60_000, teamId: 't-02', actorName: 'Tanvi Kulkarni' },
  { id: 'act-14', kind: 'score_posted',      message: 'Mr. Kapoor scored CrowdSense: 85/100',                  timestamp: NOW - 8 * 60_000,  teamId: 't-02', actorName: 'Mr. Rohan Kapoor' },
  { id: 'act-15', kind: 'score_posted',      message: 'Mr. Kapoor scored JudgeAssist: 91/100',                 timestamp: NOW - 5 * 60_000,  teamId: 't-04', actorName: 'Mr. Rohan Kapoor' },
  { id: 'act-16', kind: 'announcement',      message: '⏰ 30 minutes remaining — finalize your submissions!',  timestamp: NOW - 30 * 60_000, teamId: null,   actorName: 'Organizer' },
  { id: 'act-17', kind: 'score_posted',      message: 'Dr. Vaidya scored SpotLight: 78/100',                   timestamp: NOW - 11 * 60_000, teamId: 't-03', actorName: 'Dr. Prashant Vaidya' },
  { id: 'act-18', kind: 'incident_opened',   message: 'Incident reported: Vending Machine Offline (LOW)',      timestamp: NOW - 55 * 60_000, teamId: null,   actorName: 'Volunteer' },
  { id: 'act-19', kind: 'check_in',          message: 'Om Chaudhari checked in',                              timestamp: NOW - 82 * 60_000, teamId: 't-08', actorName: 'Om Chaudhari' },
  { id: 'act-20', kind: 'announcement',      message: '🏆 Judging panel is now live. Good luck, teams!',       timestamp: NOW - 20 * 60_000, teamId: null,   actorName: 'Organizer' },
];

// ─── Initial Leaderboard ──────────────────────────────────────────────────────

export const seedLeaderboard: LeaderboardEntry[] = [
  { rank: 1, teamId: 't-04', teamName: 'PixelPioneers', averageScore: 93.0, submissionId: 'sub-04', judgesScored: 2 },
  { rank: 2, teamId: 't-06', teamName: 'KernelKrew',    averageScore: 89.0, submissionId: 'sub-06', judgesScored: 2 },
  { rank: 3, teamId: 't-08', teamName: 'AlphaBuilders', averageScore: 89.0, submissionId: 'sub-08', judgesScored: 2 },
  { rank: 4, teamId: 't-02', teamName: 'ByteBlitz',     averageScore: 88.5, submissionId: 'sub-02', judgesScored: 2 },
  { rank: 5, teamId: 't-01', teamName: 'NeuralNomads',  averageScore: 88.0, submissionId: 'sub-01', judgesScored: 1 },
  { rank: 6, teamId: 't-05', teamName: 'SynapticSquad', averageScore: 85.5, submissionId: 'sub-05', judgesScored: 2 },
  { rank: 7, teamId: 't-07', teamName: 'DataDrifters',  averageScore: 85.0, submissionId: 'sub-07', judgesScored: 2 },
  { rank: 8, teamId: 't-03', teamName: 'CloudCrafters', averageScore: 79.5, submissionId: 'sub-03', judgesScored: 2 },
];

// ─── Derived helpers ─────────────────────────────────────────────────────────
export const HOUR_MS = HOUR;
