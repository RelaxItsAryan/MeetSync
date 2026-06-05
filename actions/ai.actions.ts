"use server";

import fs from 'fs';
import path from 'path';

// Helper to get the key dynamically
const getApiKey = (): string => {
  // Try process.env first
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;

  // Fallback to reading the file dynamically to avoid dev-server caching issues
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/GROQ_API_KEY\s*=\s*([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].replace(/['"]/g, '').trim();
      }
    }
  } catch (error) {
    console.error("Error reading key dynamically:", error);
  }
  return "";
};

export const extractCommitments = async (transcript: string) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Groq API key is not configured in environment variables.");
  }

  const prompt = `
Your responsibility is to analyze meeting transcripts and generate structured meeting intelligence.

You must extract BOTH:
1. Meeting Intelligence
2. Commitment Intelligence

Do not choose one or the other.

====================================
MEETING INTELLIGENCE
====================

Extract:
* Meeting Summary
* Key Topics Discussed
* Decisions Made
* Action Items
* Risks
* Blockers
* Questions Raised
* Participants Mentioned
* Important Context
* Follow-Up Topics
* Meeting Outcome
* Sentiment Analysis

====================================
COMMITMENT INTELLIGENCE
=======================

Additionally identify every commitment, promise, obligation, responsibility, deliverable, approval, review, documentation task, technical task, follow-up, or deadline mentioned during the meeting.

A commitment exists whenever a participant accepts responsibility for a future action.

Examples:
* I'll send the proposal.
* We'll review the API.
* I'll provide the report by Friday.
* Our team will complete testing next week.
* I'll get approval from finance.

====================================
COMMITMENT EXTRACTION RULES
===========================

For each commitment extract:
* owner
* recipient
* commitment
* commitment_type
* due_date
* condition
* priority
* status
* impact_if_missed
* confidence

Commitment Types:
* Deliverable
* Follow-Up
* Approval
* Review
* Documentation
* Technical Task
* Meeting
* Decision
* Other

If no due date exists:
due_date = null

If no condition exists:
condition = null

Default:
status = "pending"

====================================
RISKS VS BLOCKERS
=================

Risk:
Potential future problem.

Blocker:
Something actively preventing progress.

Keep them separate.

====================================
DECISIONS
=========

Capture all agreed decisions.
Include:
* Technical decisions
* Business decisions
* Tentative launch decisions
* Strategic agreements

====================================
OUTPUT FORMAT
=============

Return ONLY valid JSON.

{
  "meeting_summary": "",
  "key_topics": [],
  "decisions": [
    {
      "decision": "",
      "confidence": ""
    }
  ],
  "action_items": [
    {
      "task": "",
      "owner": "",
      "status": "pending",
      "confidence": ""
    }
  ],
  "risks": [
    {
      "risk": "",
      "severity": ""
    }
  ],
  "blockers": [
    {
      "blocker": "",
      "severity": ""
    }
  ],
  "questions_raised": [],
  "participants": [],
  "important_context": [],
  "follow_up_topics": [],
  "meeting_outcome": {
    "status": "",
    "reason": ""
  },
  "sentiment": {
    "overall_sentiment": "",
    "reason": ""
  },
  "commitments": [
    {
      "owner": "",
      "recipient": "",
      "commitment": "",
      "commitment_type": "",
      "due_date": null,
      "condition": null,
      "priority": "",
      "status": "pending",
      "impact_if_missed": "",
      "confidence": ""
    }
  ]
}

Return ONLY JSON.
Do not use markdown.
Do not explain your reasoning.
Do not use code fences.

Transcript:
----------------------------------
${transcript}
----------------------------------
`;

  const response = await fetch(
    `https://api.groq.com/openai/v1/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are an enterprise-grade Meeting and Commitment Intelligence Agent. Return ONLY valid JSON matching the requested schema. No markdown, no explanations, no code fences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: {
          type: "json_object"
        },
        temperature: 0.1
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error: Status ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const textResponse = data?.choices?.[0]?.message?.content;

  if (!textResponse) {
    throw new Error("Empty response received from Groq API");
  }

  return JSON.parse(textResponse);
};

export const analyzeAccountability = async (
  meetingIntelligence: any,
  commitmentIntelligence: any,
  historicalCommitments: any[],
  currentDate: string
) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Groq API key is not configured in environment variables.");
  }

  const prompt = `
# AGENT 3 — ACCOUNTABILITY ENGINE

## Purpose
You are an enterprise-grade Accountability Intelligence Agent.
Your responsibility is NOT to summarize meetings.
Your responsibility is NOT to extract commitments.
Those tasks have already been completed.

Your job is to analyze historical commitments and current commitments, and determine:
* Open commitments
* Completed commitments
* Overdue commitments
* Commitment patterns
* Reliability indicators
* Escalation risks
* Accountability insights

---

## Inputs
* Meeting Intelligence:
${JSON.stringify(meetingIntelligence, null, 2)}

* Commitment Intelligence (current meeting):
${JSON.stringify(commitmentIntelligence, null, 2)}

* Historical Commitment Database (previous commitments from past meetings):
${JSON.stringify(historicalCommitments, null, 2)}

* Current Date (for overdue calculations):
${currentDate}

---

## Core Responsibilities

### 1. Commitment Status Analysis
Determine whether commitments are:
* pending
* completed
* overdue

Rules:
If status is "pending" AND due_date is less than current_date (${currentDate}), then status must be "overdue".

### 2. Overdue Detection
For every overdue commitment calculate:
* days_overdue
* severity

Severity mapping:
- Low: 1-3 days overdue
- Medium: 4-14 days overdue
- High: 15+ days overdue

### 3. Reliability Analysis
For each participant calculate:
* total commitments (past + current)
* completed commitments
* overdue commitments
* active commitments (pending status, and NOT overdue)
Generate reliability_score (range 0-100).
Examples:
- 100: every commitment completed
- 50: frequent delays / incomplete commitments
- 0: commitments almost never completed

### 4. Repeated Commitment Detection
Identify repeated commitments (e.g., same owner promising the same approval/deliverable in multiple past/current meetings).
Output:
{
  "owner": "",
  "pattern": "",
  "occurrences": 0
}

### 5. Escalation Risk Analysis
Determine if overdue commitments create downstream risk.
Examples:
- Security approval overdue -> Deployment risk
- Budget approval overdue -> Launch risk
- Testing overdue -> Release risk
Output:
{
  "risk": "",
  "severity": "",
  "caused_by": ""
}

### 6. Accountability Insights
Generate concise, factual insights. No opinions.
Examples:
* Budget approvals have been delayed multiple times.
* Security reviews are consistently blocking releases.
* Priya has completed all commitments on time.

---

## Output Schema

Return ONLY valid JSON:
{
  "open_commitments": [
    {
      "owner": "",
      "commitment": "",
      "due_date": "",
      "priority": "",
      "status": "pending"
    }
  ],
  "completed_commitments": [
    {
      "owner": "",
      "commitment": "",
      "due_date": "",
      "priority": "",
      "status": "completed"
    }
  ],
  "overdue_commitments": [
    {
      "owner": "",
      "commitment": "",
      "due_date": "",
      "days_overdue": 0,
      "severity": ""
    }
  ],
  "reliability_scores": [
    {
      "person": "",
      "total_commitments": 0,
      "completed": 0,
      "overdue": 0,
      "active": 0,
      "reliability_score": 0
    }
  ],
  "repeated_patterns": [
    {
      "owner": "",
      "pattern": "",
      "occurrences": 0
    }
  ],
  "escalation_risks": [
    {
      "risk": "",
      "severity": "",
      "caused_by": ""
    }
  ],
  "accountability_insights": []
}

Return ONLY JSON.
Do not use markdown.
Do not explain your reasoning.
Do not use code fences.
`;

  const response = await fetch(
    `https://api.groq.com/openai/v1/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are an enterprise-grade Accountability Intelligence Agent. Return ONLY valid JSON matching the requested schema. No markdown, no explanations, no code fences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: {
          type: "json_object"
        },
        temperature: 0.1
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error: Status ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const textResponse = data?.choices?.[0]?.message?.content;

  if (!textResponse) {
    throw new Error("Empty response received from Groq API");
  }

  return JSON.parse(textResponse);
};

export const prepareMeetingBriefing = async (
  meetingIntelligence: any,
  commitmentIntelligence: any,
  accountabilityIntelligence: any,
  contactHistory: any
) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Groq API key is not configured in environment variables.");
  }

  const prompt = `
# SYSTEM PROMPT — Meeting Preparation Agent

Your purpose is to prepare a user for an upcoming meeting using information from previous meetings, commitments, accountability records, and relationship history.

You do NOT summarize transcripts.
You do NOT extract commitments.
You do NOT calculate reliability.
Those tasks have already been completed.
Your responsibility is to transform existing intelligence into a concise and actionable meeting briefing.

====================================
INPUTS
======

1. Meeting Intelligence:
${JSON.stringify(meetingIntelligence, null, 2)}

2. Commitment Intelligence:
${JSON.stringify(commitmentIntelligence, null, 2)}

3. Accountability Intelligence:
${JSON.stringify(accountabilityIntelligence, null, 2)}

4. Contact History:
${JSON.stringify(contactHistory, null, 2)}

====================================
PRIMARY OBJECTIVE
=================

Before a meeting, provide:
* What matters most
* What requires attention
* What commitments remain open
* What risks exist
* What should be discussed
* What questions should be asked

====================================
EXECUTIVE BRIEF
===============

Create a concise briefing containing:
* Relationship summary
* Current project status
* Most important context

Limit to 3-5 sentences.

====================================
OPEN COMMITMENTS
================

Identify all unresolved commitments.
Highlight:
* Owner
* Due date
* Status
Prioritize overdue commitments.

====================================
DISCUSSION PRIORITIES
=====================

Identify the most important topics that should be discussed during the meeting.
Rank by importance.

====================================
RECOMMENDED QUESTIONS
=====================

Generate practical questions. Questions should help move the project forward.

====================================
RELATIONSHIP INSIGHTS
=====================

Identify useful patterns. Use only evidence from data. No speculation.

====================================
WARNINGS
========

Highlight:
* Overdue commitments
* Repeated delays
* Escalation risks
* Critical blockers

====================================
MEETING STRATEGY
================

Recommend how the user should approach the meeting. Keep recommendations actionable.

====================================
OUTPUT FORMAT
=============

Return ONLY valid JSON:
{
  "executive_brief": {
    "relationship_summary": "",
    "project_status": "",
    "important_context": ""
  },
  "open_commitments": [
    {
      "owner": "",
      "commitment": "",
      "status": "",
      "due_date": ""
    }
  ],
  "discussion_priorities": [],
  "recommended_questions": [],
  "relationship_insights": [],
  "warnings": [],
  "meeting_strategy": []
}

Return ONLY JSON.
No markdown.
No explanations.
No reasoning.
No code fences.
`;

  const response = await fetch(
    `https://api.groq.com/openai/v1/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are an enterprise-grade Meeting Preparation Agent. Return ONLY valid JSON matching the requested schema. No markdown, no explanations, no code fences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: {
          type: "json_object"
        },
        temperature: 0.1
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error: Status ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const textResponse = data?.choices?.[0]?.message?.content;

  if (!textResponse) {
    throw new Error("Empty response received from Groq API");
  }

  return JSON.parse(textResponse);
};


