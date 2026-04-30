
# CLOUDQUIZ: AI-POWERED QUIZ AND LEARNING MANAGEMENT SYSTEM

## A PROJECT REPORT

### Submitted by

[Student Name 1] ([UID])
[Student Name 2] ([UID])
[Student Name 3] ([UID])

*in partial fulfillment for the award of the degree of*

## BACHELOR OF ENGINEERING

**IN**

COMPUTER SCIENCE AND ENGINEERING

**Chandigarh University**

**APRIL 2026**

---

## BONAFIDE CERTIFICATE

Certified that this project report **"CloudQuiz: AI-Powered Quiz and Learning Management System"** is the bonafide work of **"[Student Names]"** who carried out the project work under my/our supervision.

| | |
|---|---|
| **SIGNATURE** | **SIGNATURE** |
| [Name of Head of Department] | [Name of Supervisor] |
| **HEAD OF THE DEPARTMENT** | **SUPERVISOR** |
| Department of CSE | Assistant Professor, Dept. of CSE |
| Chandigarh University | Chandigarh University |

Submitted for the project viva-voce examination held on _______________

**INTERNAL EXAMINER** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **EXTERNAL EXAMINER**

---

## ACKNOWLEDGEMENT

We express our sincere gratitude to our project supervisor for the invaluable guidance, continuous encouragement, and constructive suggestions throughout the course of this project. We are thankful to the Head of the Department of Computer Science and Engineering, Chandigarh University, for providing the necessary facilities and support.

We also extend our thanks to all faculty members of the department for their technical inputs and moral support. Special thanks to our family and friends for their constant motivation and patience during the development of this project.

---

## TABLE OF CONTENTS

| Section | Page |
|---------|------|
| List of Figures | i |
| List of Tables | ii |
| Abstract | iii |
| Graphical Abstract | iv |
| Abbreviations | v |
| Symbols | vi |
| Chapter 1: Introduction | 1 |
| 1.1 Background and Motivation | 2 |
| 1.2 Problem Identification | 3 |
| 1.3 Task Identification | 4 |
| 1.4 Timeline | 5 |
| 1.5 Organization of the Report | 6 |
| Chapter 2: Literature Survey | 7 |
| 2.1 Existing Systems | 8 |
| 2.2 Bibliometric Analysis | 10 |
| 2.3 Problem Definition, Goals and Objectives | 12 |
| Chapter 3: Design Flow and Process | 14 |
| 3.1 Concept Generation | 15 |
| 3.2 Design Constraints | 16 |
| 3.3 Alternative Designs | 18 |
| 3.4 Best Design Selection | 20 |
| 3.5 System Architecture | 21 |
| Chapter 4: Results Analysis and Validation | 25 |
| 4.1 Implementation | 26 |
| 4.2 Testing and Validation | 32 |
| 4.3 Performance Analysis | 36 |
| Chapter 5: Conclusion and Future Work | 38 |
| References | 40 |
| Appendix 1: User Manual | 42 |
| Appendix 2: Achievements | 46 |

---

## LIST OF FIGURES

| Figure | Caption |
|--------|---------|
| Figure 3.1 | System Architecture Diagram |
| Figure 3.2 | Three-Role Access Control Flow |
| Figure 3.3 | Alternative Design 1 — Monolithic Architecture |
| Figure 3.4 | Alternative Design 2 — Microservices Architecture |
| Figure 3.5 | Selected Design — Decoupled Full-Stack Architecture |
| Figure 3.6 | Database Schema (Firestore Collections) |
| Figure 3.7 | AI Quiz Generation Flowchart |
| Figure 3.8 | Syllabus Upload and Parsing Flow |
| Figure 3.9 | AI Proctoring Detection Algorithm |
| Figure 4.1 | Admin Dashboard — System Overview |
| Figure 4.2 | Teacher Dashboard — AI Quiz Generator |
| Figure 4.3 | Student Dashboard — Subjects View |
| Figure 4.4 | Quiz Attempt Screen with Live Monitoring |
| Figure 4.5 | Result Page with Answer Explanations |
| Figure 4.6 | AI Tutor Chat Interface |
| Figure 4.7 | Test Results — Quiz Generation Accuracy |
| Figure 4.8 | Test Results — Face Detection Performance |

---

## LIST OF TABLES

| Table | Caption |
|-------|---------|
| Table 2.1 | Comparison of Existing LMS Platforms |
| Table 2.2 | Summary of Literature Review |
| Table 3.1 | Design Constraints Analysis |
| Table 3.2 | Comparison of Alternative Designs |
| Table 3.3 | Technology Stack Selection |
| Table 3.4 | API Endpoints Summary |
| Table 3.5 | Firestore Collections and Purpose |
| Table 4.1 | Test Cases — Authentication Module |
| Table 4.2 | Test Cases — Quiz Generation Module |
| Table 4.3 | Test Cases — AI Proctoring Module |
| Table 4.4 | Performance Benchmarks |
| Table 4.5 | User Acceptance Testing Results |

---

## ABSTRACT

CloudQuiz is a full-stack, AI-integrated Learning Management System (LMS) designed to address the limitations of traditional quiz-based assessment platforms. The system leverages the LLaMA 3.3-70B large language model via the Groq API to automatically generate Multiple Choice Questions (MCQs) from syllabus content provided in any format — plain text, images, PDF, or DOCX documents. The platform supports three distinct user roles: Administrator, Teacher, and Student, each with a dedicated dashboard and feature set tailored to their responsibilities.

Key innovations include an AI-powered syllabus parser that organises uploaded content into structured units and topics, a real-time camera-based proctoring system using the BlazeFace TensorFlow.js model for face detection during examinations, and an AI Tutor that provides personalised explanations to students after quiz completion. The system also incorporates quiz deadline management, confidence-level tracking, study groups, teacher-student messaging, and a comprehensive admin panel with system-wide analytics.

The frontend is built with React.js and Vite, deployed on Vercel, while the backend uses Node.js with Express.js, deployed on Render. Firebase Firestore serves as the real-time database and Firebase Authentication handles user management. The project demonstrates the practical application of modern AI tools in educational technology, providing a scalable, cloud-deployed solution suitable for academic institutions.

**Keywords:** Learning Management System, AI Quiz Generation, LLaMA, Groq API, TensorFlow.js, Face Detection, React.js, Firebase, Educational Technology

---

## GRAPHICAL ABSTRACT

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDQUIZ SYSTEM                          │
│                                                                   │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │  TEACHER │    │   GROQ AI    │    │      STUDENT         │   │
│  │          │───▶│  LLaMA 3.3   │───▶│                      │   │
│  │ Upload   │    │  70B Model   │    │  Attempt Quiz        │   │
│  │ Syllabus │    │              │    │  with Camera         │   │
│  └──────────┘    │ Generate MCQ │    │  Monitoring          │   │
│       │          └──────────────┘    └──────────────────────┘   │
│       ▼                                        │                  │
│  ┌──────────┐                        ┌─────────▼──────────┐     │
│  │ Subject  │                        │   AI TUTOR         │     │
│  │ Manager  │                        │   Post-Quiz        │     │
│  │ + Units  │                        │   Explanations     │     │
│  └──────────┘                        └────────────────────┘     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FIREBASE (Auth + Firestore)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ABBREVIATIONS

| Abbreviation | Full Form |
|-------------|-----------|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| CORS | Cross-Origin Resource Sharing |
| CSS | Cascading Style Sheets |
| DOCX | Document XML (Microsoft Word Format) |
| HTML | HyperText Markup Language |
| HTTP | HyperText Transfer Protocol |
| HTTPS | HyperText Transfer Protocol Secure |
| JWT | JSON Web Token |
| LLM | Large Language Model |
| LMS | Learning Management System |
| MCQ | Multiple Choice Question |
| ML | Machine Learning |
| PDF | Portable Document Format |
| REST | Representational State Transfer |
| SDK | Software Development Kit |
| UI | User Interface |
| UX | User Experience |

---

## SYMBOLS

| Symbol | Meaning |
|--------|---------|
| → | Data flow direction |
| ∈ | Belongs to |
| % | Percentage |
| px | Pixels |
| ms | Milliseconds |
| req/min | Requests per minute |
| MB | Megabytes |

---

---

# CHAPTER 1
# INTRODUCTION

## 1.1 Background and Motivation

The rapid advancement of Artificial Intelligence and cloud computing technologies has opened new possibilities in the field of educational technology. Traditional Learning Management Systems (LMS) such as Moodle, Google Classroom, and Blackboard provide basic quiz and content management features but lack intelligent automation, real-time AI assistance, and integrated exam integrity monitoring.

Educational institutions face several recurring challenges: teachers spend significant time manually creating quiz questions, exam integrity is difficult to maintain in online settings, and students receive limited personalised feedback after assessments. These gaps motivated the development of CloudQuiz � a system that integrates AI at every stage of the assessment lifecycle.

The proliferation of large language models (LLMs) such as Meta's LLaMA series, combined with accessible APIs like Groq, has made it feasible to build production-grade AI features within student projects. Similarly, TensorFlow.js enables in-browser machine learning, making real-time camera-based proctoring possible without server-side video processing.

## 1.2 Identification of Client and Need

**Client:** Educational institutions, coaching centres, and universities conducting online assessments.

**Need Identified:**
- Teachers need a faster way to create quality quiz questions from existing syllabus material
- Institutions need a reliable way to detect cheating during online exams without expensive proctoring software
- Students need personalised explanations after quizzes to reinforce learning
- Administrators need a centralised dashboard to manage users, monitor system health, and communicate with all users

## 1.3 Problem Identification

The following problems were identified through analysis of existing systems:

1. **Manual quiz creation is time-consuming** � A teacher creating a 20-question quiz manually may spend 2-3 hours. AI generation reduces this to under 30 seconds.

2. **No intelligent syllabus management** � Existing systems require teachers to manually type content. There is no support for uploading images or documents of syllabi.

3. **Weak exam integrity** � Most free LMS platforms have no proctoring. Commercial proctoring tools (ProctorU, Examity) cost $10-20 per exam per student.

4. **No post-quiz AI assistance** � Students receive scores but no intelligent explanation of why their answers were wrong.

5. **Fragmented tools** � Teachers use separate tools for syllabus management, quiz creation, and student communication.

## 1.4 Task Identification

| Task | Description | Owner |
|------|-------------|-------|
| T1 | Design three-role authentication system | Full Team |
| T2 | Build AI quiz generation pipeline | Backend Developer |
| T3 | Implement syllabus upload and parsing | Backend Developer |
| T4 | Develop camera-based proctoring | Frontend Developer |
| T5 | Build subject and unit management | Full Team |
| T6 | Create student quiz attempt flow | Frontend Developer |
| T7 | Implement AI Tutor post-quiz | Full Team |
| T8 | Build admin analytics dashboard | Frontend Developer |
| T9 | Deploy frontend on Vercel | DevOps |
| T10 | Deploy backend on Render | DevOps |

## 1.5 Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| Phase 1: Planning | Week 1-2 | Requirements gathering, technology selection, architecture design |
| Phase 2: Backend Development | Week 3-5 | Express server, Firebase integration, Groq AI integration, API development |
| Phase 3: Frontend Development | Week 6-9 | React components, dashboards, quiz attempt flow, AI monitoring |
| Phase 4: Integration | Week 10-11 | Frontend-backend integration, CORS configuration, authentication flow |
| Phase 5: Testing | Week 12 | Unit testing, integration testing, user acceptance testing |
| Phase 6: Deployment | Week 13 | Vercel deployment, Render deployment, Firebase configuration |
| Phase 7: Documentation | Week 14 | Report writing, user manual preparation |

## 1.6 Organization of the Report

This report is organized as follows: Chapter 2 presents a literature survey of existing LMS platforms and AI-based quiz generation research. Chapter 3 describes the design process including alternative designs considered and the final architecture selected. Chapter 4 presents the implementation details, testing results, and performance analysis. Chapter 5 concludes the report with observations and future work directions.

---

# CHAPTER 2
# LITERATURE SURVEY

## 2.1 Timeline of the Problem

The challenge of automating educational assessment has been studied since the 1990s. Early computer-based testing systems (CBT) in the 1990s focused on delivering pre-authored questions. The 2000s saw the rise of LMS platforms like Moodle (2002) and Blackboard, which added online quiz delivery but still required manual question authoring.

The 2010s brought Natural Language Processing (NLP) approaches to automatic question generation (AQG). Researchers explored rule-based systems and early neural networks for generating questions from text passages. However, these systems produced low-quality questions and required significant domain expertise to configure.

The 2020s marked a paradigm shift with the emergence of transformer-based LLMs. GPT-3 (2020), GPT-4 (2023), and Meta's LLaMA series demonstrated that high-quality MCQs could be generated from arbitrary text with minimal prompt engineering. The availability of these models via APIs (OpenAI, Groq, Anthropic) made AI-powered quiz generation accessible to developers without requiring expensive GPU infrastructure.

## 2.2 Existing Systems Analysis

**Table 2.1: Comparison of Existing LMS Platforms**

| Feature | Google Classroom | Moodle | Kahoot | CloudQuiz |
|---------|-----------------|--------|--------|-----------|
| AI Quiz Generation | No | No | No | Yes (LLaMA 3.3) |
| Syllabus Upload (PDF/Image) | No | No | No | Yes |
| Camera Proctoring | No | Plugin only | No | Yes (BlazeFace) |
| AI Tutor Post-Quiz | No | No | No | Yes |
| Subject-Quiz Linking | Basic | Yes | No | Yes |
| Real-time Chat | No | No | No | Yes |
| Free Deployment | Yes | Self-hosted | Freemium | Yes |
| Role-based Access | Basic | Yes | No | Yes (3 roles) |

### 2.2.1 Google Classroom
Google Classroom provides basic assignment and quiz management through Google Forms integration. It lacks AI-powered question generation and has no proctoring capabilities. It is widely used but does not address the problem of automated content creation.

### 2.2.2 Moodle
Moodle is an open-source LMS with extensive plugin support. While it supports quiz creation and some proctoring plugins, the setup is complex and requires server administration expertise. AI integration requires third-party plugins that are not freely available.

### 2.2.3 Kahoot
Kahoot focuses on gamified quizzes and is primarily used for classroom engagement rather than formal assessment. It has no proctoring, no AI generation, and no syllabus management.

### 2.2.4 Research on Automatic Question Generation
Kurdi et al. (2020) conducted a systematic review of 93 papers on automatic question generation and found that transformer-based models significantly outperform rule-based and template-based approaches in question quality and diversity. Their work validates the use of LLMs for MCQ generation in educational contexts.

Heilman and Smith (2010) proposed an overgenerate-and-rank approach for question generation from text, which influenced later neural approaches. Their work established the importance of answer distractors in MCQ quality.

## 2.3 Problem Definition, Goals and Objectives

**Problem Definition:** Existing LMS platforms do not provide integrated AI-powered quiz generation from multi-format syllabus content, real-time browser-based exam proctoring, or personalised AI tutoring � creating a fragmented and inefficient assessment workflow for educational institutions.

**Goals:**
1. Develop a unified platform that covers the complete assessment lifecycle from syllabus upload to post-quiz learning
2. Integrate LLM-based quiz generation that works with text, images, and documents
3. Implement browser-based proctoring without requiring external software
4. Provide AI-powered personalised feedback to students

**Objectives:**
- Reduce quiz creation time from hours to seconds using AI
- Support multi-format syllabus input (text, PDF, DOCX, image)
- Detect at least 3 types of suspicious behaviour during exams (no face, multiple faces, tab switching)
- Provide contextual AI explanations for every quiz question post-attempt
- Deploy a production-ready system accessible via public URL

---

# CHAPTER 3
# DESIGN FLOW AND PROCESS

## 3.1 Concept Generation

Three initial concepts were generated for the system architecture:

**Concept A:** Browser-only application using Firebase directly from the frontend with no backend server. Simple to deploy but limited in AI integration capability and security.

**Concept B:** Monolithic Node.js application serving both frontend and backend from a single server. Easier to manage but poor scalability and no separation of concerns.

**Concept C:** Decoupled architecture with a React frontend (Vercel) and Express backend (Render) communicating via REST APIs, with Firebase for database and authentication. Best separation of concerns, independent scaling, and secure API key management.

## 3.2 Evaluation and Selection of Specifications

**Table 3.2: Comparison of Alternative Designs**

| Criterion | Concept A (Browser-only) | Concept B (Monolithic) | Concept C (Decoupled) |
|-----------|------------------------|----------------------|----------------------|
| Security | Low (API keys exposed) | Medium | High (keys on server) |
| Scalability | Low | Medium | High |
| AI Integration | Limited | Good | Excellent |
| Deployment Complexity | Low | Medium | Medium |
| Maintainability | Low | Medium | High |
| Cost | Free | Paid server | Free tier available |
| **Score** | **2/5** | **3/5** | **5/5** |

**Selected Design: Concept C � Decoupled Full-Stack Architecture**

Concept C was selected because it provides the best security (API keys never exposed to the browser), enables full AI integration via the backend, and allows independent scaling of frontend and backend. Both Vercel and Render offer free tiers suitable for academic deployment.

## 3.3 Design Constraints

### 3.3.1 Economic Constraints
The system must be deployable at zero cost using free tiers of Vercel, Render, Firebase, and Groq. This constrains the rate of AI API calls (Groq free tier: 30 requests/minute) and requires efficient batching of operations.

### 3.3.2 Environmental Constraints
As a cloud-based system, the environmental footprint is managed by the cloud providers. The system minimises unnecessary API calls through rate limiting and caching strategies.

### 3.3.3 Health and Safety Constraints
The camera proctoring feature requires explicit user consent and camera permission. The system does not store video recordings � only metadata about detected events is saved to Firestore.

### 3.3.4 Ethical Constraints
Student monitoring data is used solely for academic integrity purposes. The system does not use facial recognition for identity verification � only face presence/count detection. All data is stored securely in Firebase with authentication-gated access rules.

### 3.3.5 Social Constraints
The system must be accessible to students with varying internet speeds. The frontend is optimised with lazy loading and the TensorFlow.js models are loaded asynchronously to avoid blocking the quiz interface.

### 3.3.6 Professional Constraints
All API keys and credentials are stored as environment variables and never committed to version control. The system follows REST API conventions and uses JWT-based authentication for all protected endpoints.

## 3.4 System Architecture

**Figure 3.1: System Architecture Diagram**

```
+-------------------------------------------------------------+
�                    FRONTEND (Vercel)                         �
�         React.js 18 + Vite + TensorFlow.js (BlazeFace)      �
�                                                              �
�  +----------+  +----------+  +----------+  +----------+   �
�  �  Admin   �  � Teacher  �  � Student  �  �  Auth    �   �
�  �Dashboard �  �Dashboard �  �Dashboard �  �  Pages   �   �
�  +----------+  +----------+  +----------+  +----------+   �
+-------------------------------------------------------------+
                           � HTTPS REST API
+--------------------------?----------------------------------+
�                    BACKEND (Render)                          �
�                  Node.js + Express.js                        �
�                                                              �
�  /api/ai          /api/syllabus       /api/subjects          �
�  (Rate limited)   (File parsing)      (CRUD)                 �
�       �                �                   �                 �
�       ?                ?                   ?                 �
�  +---------+    +--------------+    +--------------+       �
�  � Groq AI �    � pdf-parse    �    � Firebase     �       �
�  � LLaMA   �    � JSZip        �    � Admin SDK    �       �
�  � 3.3-70B �    � Vision Model �    �              �       �
�  +---------+    +--------------+    +--------------+       �
+-------------------------------------------------------------+
                           �
+--------------------------?----------------------------------+
�                    FIREBASE                                  �
�         Firestore (Database) + Authentication                �
+-------------------------------------------------------------+
```

## 3.5 AI Quiz Generation Flowchart

**Figure 3.7: AI Quiz Generation Flowchart**

```
START
  �
  ?
Teacher selects subject / uploads syllabus
  �
  ?
Choose generation mode:
  +-- Full Syllabus
  +-- Specific Unit
  +-- Custom Topic
  �
  ?
SyllabusUploader component processes input:
  +-- Text ? direct
  +-- Image ? Groq Vision (LLaMA 4 Scout) ? text
  +-- PDF/DOCX ? pdf-parse / JSZip ? text
  �
  ?
POST /api/ai/generate-quiz
  �
  ?
Groq LLaMA 3.3-70B generates N MCQs as JSON
  �
  ?
Questions saved as ai_drafts (status: pending_review)
  �
  ?
Teacher reviews each question:
  +-- Edit ? modify question/options/answer
  +-- Publish ? move to live questions collection
  +-- Reject ? mark as rejected
  �
  ?
POST /api/ai/publish-all (batch Firestore write)
  �
  ?
Questions available to students
  �
  ?
END
```

## 3.6 Database Schema

**Table 3.5: Firestore Collections and Purpose**

| Collection | Key Fields | Purpose |
|-----------|-----------|---------|
| users | email, role, approved, createdAt | User profiles and role management |
| quizzes | title, topic, duration, deadline, subjectId, createdBy | Quiz metadata |
| quizzes/{id}/questions | questionText, options[], correctIndex, explanation, difficulty | Published MCQs |
| quizzes/{id}/ai_drafts | questionText, options[], status, generatedAt | AI-generated pending questions |
| attempts | quizId, studentId, score, total, aiDetections[], suspiciousActivity | Student submissions |
| subjects | name, description, fullSyllabus, colorIndex, createdBy | Subject/course data |
| subjects/{id}/units | name, content, order, topics[] | Syllabus units |
| messages | text, senderId, receiverId, participants[], timestamp | Teacher-student chat |
| studyGroups | name, createdBy, members[] | Study group metadata |
| studyGroups/{id}/messages | text, userId, timestamp | Group chat messages |
| studentGoals | targetScore, weeklyQuizzes, perfectScores, streak | Personal learning goals |
| tutor_interactions | studentId, question, userQuery, response, timestamp | AI tutor logs |
| announcements | title, body, type, createdAt, createdBy | Admin announcements |

---
