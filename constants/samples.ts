export interface MeetingAnalysis {
  meeting_summary: string;
  key_topics: string[];
  decisions: {
    decision: string;
    confidence: 'high' | 'medium' | 'low';
  }[];
  action_items: {
    task: string;
    owner: string;
    status: 'pending' | 'completed';
    confidence: 'high' | 'medium' | 'low';
  }[];
  risks: {
    risk: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  questions_raised: string[];
  participants: string[];
  important_context: string[];
  follow_up_topics: string[];
  sentiment: {
    overall_sentiment: string;
    reason: string;
  };
}

export interface MeetingSample {
  id: string;
  title: string;
  transcript: string;
  analysis: MeetingAnalysis;
}

export const SAMPLE_MEETINGS: MeetingSample[] = [
  {
    id: 'engineering-standup',
    title: 'Engineering Standup & Redis Decisions',
    transcript: `Speaker: Welcome everyone. Let's do a quick sync on where we stand. Alice, how's the frontend auth looking?
Alice: I'm almost done with the redesign, but I've hit a small snag with Clerk's token refresh loop. I should have it fixed by Monday afternoon.
Speaker: Okay, let's make that a formal task. Alice, please fix the Clerk login token refresh issue. Bob, what about the caching layer? We talked about Memcached or Redis.
Bob: Yeah, I looked into both. I strongly recommend we use Redis for our user sessions caching because of the native data structure support.
Speaker: Agreed. Let's go ahead with that. The decision is made: we will use Redis for our user session caching layer. Bob, can you set up the Redis instance in staging?
Bob: Absolutely. I'll get that set up by tomorrow.
Speaker: Great. Charlie, any updates on database migration?
Charlie: I'm concerned about the Friday deploy. The staging db migration is taking about 45 minutes because of the indexes. If we run this in production during peak hours, it could cause downtime or severe lag.
Speaker: That's a serious risk. Let's make sure we schedule it during off-peak hours.
Bob: Yeah, and we might need to test index creation in a replica first.
Speaker: Thanks Bob. Any other questions?
Alice: Who is reviewing my PR once Clerk is fixed?
Speaker: I'll review it. Let's wrap this up.`,
    analysis: {
      meeting_summary: "Daily engineering sync focused on resolving frontend auth issues, finalizing the session caching architecture, and addressing database migration risks.",
      key_topics: [
        "Frontend Authentication",
        "Caching Layer Architecture",
        "Database Migration Planning"
      ],
      decisions: [
        {
          decision: "Use Redis for user session caching layer",
          confidence: "high"
        }
      ],
      action_items: [
        {
          task: "Fix the Clerk login token refresh issue",
          owner: "Alice",
          status: "pending",
          confidence: "high"
        },
        {
          task: "Set up the Redis instance in staging environment",
          owner: "Bob",
          status: "pending",
          confidence: "high"
        },
        {
          task: "Review Alice's PR once Clerk authentication is fixed",
          owner: "Speaker",
          status: "pending",
          confidence: "high"
        }
      ],
      risks: [
        {
          risk: "Production database migration takes too long (45 minutes) during peak hours, risking downtime or lag",
          severity: "high"
        }
      ],
      questions_raised: [
        "Who is reviewing Alice's PR once Clerk is fixed?"
      ],
      participants: [
        "Alice",
        "Bob",
        "Charlie",
        "Speaker"
      ],
      important_context: [
        "Clerk token refresh loop snag is currently delaying frontend authentication completion.",
        "Staging db migration is taking 45 minutes due to index generation, creating deploy concern."
      ],
      follow_up_topics: [
        "Staging Index Creation Test on Replica",
        "Production Migration Scheduling"
      ],
      sentiment: {
        overall_sentiment: "Concerned",
        reason: "Active technical concerns regarding database migration risks and Clerk authentication bugs."
      }
    }
  },
  {
    id: 'product-design',
    title: 'Product Checkout Design Alignment',
    transcript: `Speaker: Thanks for joining. We need to align on the payment gateway checkout flow. Sarah, have you drafted the checkout wireframes?
Sarah: Yes, I have them ready. We need to decide if we are launching with both Stripe and PayPal or just one.
Speaker: To meet the launch timeline next month, we should focus. Let's launch with Stripe only. We will defer PayPal integration to V2.
Sarah: Sounds good, that simplifies things. I'll design the updated mocks containing only Stripe elements.
Speaker: Perfect. Jack, do we have the API keys ready for Stripe production?
Jack: Not yet. The legal team still hasn't approved the Stripe merchant account. It's pending compliance review. This might delay our testing.
Speaker: That is a blocker. Let's flag this. Jack, please follow up with legal to expedite the Stripe merchant account approval.
Jack: On it. I'll send them an email right after this.
Speaker: Excellent. Let's make sure we keep an eye on this. We must launch on time.`,
    analysis: {
      meeting_summary: "Product design meeting to align on the payment checkout flow and address dependencies ahead of the upcoming release.",
      key_topics: [
        "Payment Gateway Integration",
        "Checkout Wireframe Review",
        "Merchant Account Compliance"
      ],
      decisions: [
        {
          decision: "Launch initial release with Stripe payment gateway only, deferring PayPal to V2",
          confidence: "high"
        }
      ],
      action_items: [
        {
          task: "Design updated checkout wireframe mocks with Stripe elements only",
          owner: "Sarah",
          status: "pending",
          confidence: "high"
        },
        {
          task: "Follow up with the legal team to expedite Stripe merchant account approval",
          owner: "Jack",
          status: "pending",
          confidence: "high"
        }
      ],
      risks: [
        {
          risk: "Pending legal compliance approval for the Stripe merchant account could delay payment gateway testing",
          severity: "medium"
        }
      ],
      questions_raised: [],
      participants: [
        "Sarah",
        "Jack",
        "Speaker"
      ],
      important_context: [
        "Launch date is scheduled for next month, requiring a highly focused MVP scope.",
        "Stripe compliance verification is the current critical-path dependency."
      ],
      follow_up_topics: [
        "Stripe Gateway Integration Testing",
        "PayPal Integration Planning (V2)"
      ],
      sentiment: {
        overall_sentiment: "Urgent",
        reason: "A tight launch schedule next month combined with pending merchant account compliance approvals."
      }
    }
  },
  {
    id: 'client-onboarding',
    title: 'Acme Corp Onboarding Review',
    transcript: `Speaker: Today we are discussing the onboarding for Acme Corp. Emma, how did the initial SLA discussion go?
Emma: They requested 24/7 Slack support as part of their enterprise tier package.
Speaker: That's standard for their account size. Let's agree: we will provide a dedicated 24/7 Slack support channel for Acme Corp. Emma, can you draft the final SLA document with these support hours?
Emma: Yes, I'll draft it and have it ready for review.
Speaker: Thanks. David, we need the shared channel set up.
David: I will set up the Slack Connect channel with Acme Corp by the end of the day.
Speaker: Awesome. Is there any risk of resource strain?
Emma: We have Ryan and Sarah on rotation, but if we onboard another enterprise customer this month, we'll run into support shortages.
Speaker: Let's monitor that. For now, we are in a good position. Let's execute.`,
    analysis: {
      meeting_summary: "Review of Acme Corp's enterprise onboarding requests, focus on support channels, and SLA preparation.",
      key_topics: [
        "Enterprise Onboarding",
        "Service Level Agreement (SLA)",
        "Customer Support Capacity"
      ],
      decisions: [
        {
          decision: "Provide Acme Corp with a dedicated 24/7 Slack support channel",
          confidence: "high"
        }
      ],
      action_items: [
        {
          task: "Draft the final SLA document specifying 24/7 Slack support terms",
          owner: "Emma",
          status: "pending",
          confidence: "high"
        },
        {
          task: "Set up the Slack Connect shared channel with Acme Corp",
          owner: "David",
          status: "pending",
          confidence: "high"
        }
      ],
      risks: [
        {
          risk: "Support resource strain and shortage if another enterprise client is onboarded within the same month",
          severity: "low"
        }
      ],
      questions_raised: [
        "Is there any risk of resource strain?"
      ],
      participants: [
        "Emma",
        "David",
        "Speaker"
      ],
      important_context: [
        "Acme Corp requires 24/7 support availability under their enterprise contract terms.",
        "Support rotation currently relies on Ryan and Sarah."
      ],
      follow_up_topics: [
        "Support Rotation Capacity Review",
        "Acme SLA Document Review"
      ],
      sentiment: {
        overall_sentiment: "Positive",
        reason: "Onboarding is proceeding smoothly with clear assignments and high readiness."
      }
    }
  }
];

export interface HistoricalCommitment {
  id: string;
  meeting_title: string;
  owner: string;
  recipient: string;
  commitment: string;
  commitment_type: string;
  due_date: string | null;
  condition: string | null;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'completed' | 'overdue';
  impact_if_missed: string | null;
  confidence: 'high' | 'medium' | 'low';
  date_recorded: string;
}

export const SAMPLE_HISTORICAL_COMMITMENTS: HistoricalCommitment[] = [
  {
    id: "hist-1",
    meeting_title: "Sprint Planning",
    owner: "Alice",
    recipient: "Team",
    commitment: "Fix Clerk login token refresh loop",
    commitment_type: "Technical Task",
    due_date: "2026-06-01",
    condition: null,
    priority: "High",
    status: "pending",
    impact_if_missed: "Deployment delayed",
    confidence: "high",
    date_recorded: "2026-05-25"
  },
  {
    id: "hist-2",
    meeting_title: "Tech Sync",
    owner: "Bob",
    recipient: "Team",
    commitment: "Set up Redis session caching staging instance",
    commitment_type: "Technical Task",
    due_date: "2026-06-03",
    condition: null,
    priority: "Medium",
    status: "completed",
    impact_if_missed: "Staging testing delayed",
    confidence: "high",
    date_recorded: "2026-06-01"
  },
  {
    id: "hist-3",
    meeting_title: "Database Sync",
    owner: "Charlie",
    recipient: "Speaker",
    commitment: "Test index creation on the replica staging DB",
    commitment_type: "Technical Task",
    due_date: "2026-06-04",
    condition: "Staging database backup is complete",
    priority: "High",
    status: "pending",
    impact_if_missed: "Risk of staging DB downtime",
    confidence: "medium",
    date_recorded: "2026-06-02"
  },
  {
    id: "hist-4",
    meeting_title: "Budget Review",
    owner: "Emma",
    recipient: "Finance Team",
    commitment: "Draft the final budget proposal for H2",
    commitment_type: "Deliverable",
    due_date: "2026-05-25",
    condition: null,
    priority: "High",
    status: "pending",
    impact_if_missed: "Launch postponed due to lack of budget clearance",
    confidence: "high",
    date_recorded: "2026-05-18"
  },
  {
    id: "hist-5",
    meeting_title: "Initial Budget Kickoff",
    owner: "Emma",
    recipient: "Finance Team",
    commitment: "Draft the final budget proposal for H2",
    commitment_type: "Deliverable",
    due_date: "2026-05-18",
    condition: null,
    priority: "High",
    status: "pending",
    impact_if_missed: "H2 budget delay",
    confidence: "medium",
    date_recorded: "2026-05-11"
  },
  {
    id: "hist-6",
    meeting_title: "Customer Support Sync",
    owner: "David",
    recipient: "Emma",
    commitment: "Draft SLA specifications for Acme Corp Slack rotation",
    commitment_type: "Documentation",
    due_date: "2026-06-02",
    condition: null,
    priority: "Medium",
    status: "completed",
    impact_if_missed: "Contract delays",
    confidence: "high",
    date_recorded: "2026-05-26"
  }
];

export const SAMPLE_ACCOUNTABILITY_RESULT = {
  open_commitments: [
    {
      owner: "Alice",
      commitment: "Fix Clerk login token refresh issue",
      due_date: "2026-06-08",
      priority: "High",
      status: "pending"
    },
    {
      owner: "Bob",
      commitment: "Set up the Redis instance in staging",
      due_date: "2026-06-06",
      priority: "Medium",
      status: "pending"
    }
  ],
  completed_commitments: [
    {
      owner: "David",
      commitment: "Draft SLA specifications for Acme Corp Slack rotation",
      due_date: "2026-06-02",
      priority: "Medium",
      status: "completed"
    }
  ],
  overdue_commitments: [
    {
      owner: "Alice",
      commitment: "Fix Clerk login token refresh loop",
      due_date: "2026-06-01",
      days_overdue: 4,
      severity: "Medium"
    },
    {
      owner: "Emma",
      commitment: "Draft the final budget proposal for H2",
      due_date: "2026-05-25",
      days_overdue: 11,
      severity: "Medium"
    }
  ],
  reliability_scores: [
    {
      person: "Alice",
      total_commitments: 2,
      completed: 0,
      overdue: 1,
      active: 1,
      reliability_score: 50
    },
    {
      person: "Bob",
      total_commitments: 2,
      completed: 1,
      overdue: 0,
      active: 1,
      reliability_score: 100
    },
    {
      person: "Emma",
      total_commitments: 2,
      completed: 0,
      overdue: 2,
      active: 0,
      reliability_score: 0
    },
    {
      person: "David",
      total_commitments: 1,
      completed: 1,
      overdue: 0,
      active: 0,
      reliability_score: 100
    }
  ],
  repeated_patterns: [
    {
      owner: "Emma",
      pattern: "Drafting H2 budget proposal delayed across multiple cycles",
      occurrences: 2
    }
  ],
  escalation_risks: [
    {
      risk: "Clerk auth loop refresh fix is overdue, holding back integration deployment",
      severity: "High",
      caused_by: "Alice"
    },
    {
      risk: "Final H2 budget proposal is highly overdue, halting project hiring clearance",
      severity: "High",
      caused_by: "Emma"
    }
  ],
  accountability_insights: [
    "Alice's overdue Clerk login fix is delaying the frontend auth integration deployment.",
    "Emma has a repeated pattern of delaying the H2 budget proposal, causing severe downstream launch risks.",
    "Bob and David have maintained high reliability scores with 100% on-time completion rates."
  ]
};


