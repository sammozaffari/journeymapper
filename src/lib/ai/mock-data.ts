import type {
  ExtractionResult,
  SynthesisResult,
  PersonaResult,
  MapGenerationResult,
  ProblemStatementResult,
} from "./schemas";

export const MOCK_EXTRACTION: ExtractionResult = {
  themes: [
    { label: "Onboarding Friction", description: "Users struggle with initial setup and configuration steps", frequency: 8 },
    { label: "Trust & Credibility", description: "Users need reassurance before committing to the service", frequency: 5 },
    { label: "Time to Value", description: "Users want to see results quickly, not after lengthy setup", frequency: 7 },
    { label: "Support Accessibility", description: "Difficulty reaching help when stuck during critical moments", frequency: 4 },
  ],
  quotes: [
    { text: "I almost gave up during the setup — it felt like I was filling out a tax form.", speaker: "Participant 3", sentiment: -0.7 },
    { text: "Once I got past the first week, everything clicked. But that first week was painful.", speaker: "Participant 7", sentiment: -0.3 },
    { text: "The dashboard is beautiful but I had no idea what half the metrics meant.", speaker: "Participant 1", sentiment: -0.4 },
    { text: "When it works, it's magic. I just wish I could get there faster.", speaker: "Participant 5", sentiment: 0.3 },
  ],
  pain_points: [
    { description: "Account setup requires 12+ steps before users can do anything meaningful", severity: "critical", stage_suggestion: "Onboarding" },
    { description: "No progress indicator during setup — users don't know how far along they are", severity: "high", stage_suggestion: "Onboarding" },
    { description: "Help documentation is hard to find and doesn't match current UI", severity: "medium", stage_suggestion: "Retention" },
    { description: "Pricing page is confusing — users can't tell which plan fits their needs", severity: "high", stage_suggestion: "Consideration" },
  ],
  insights: [
    { content: "Users who complete setup within 24 hours have 3x higher retention", type: "insight", confidence: 0.85 },
    { content: "Most users discover the product through peer recommendations, not marketing", type: "behavior", confidence: 0.9 },
    { content: "Users need to see one 'win' within the first session to stay engaged", type: "need", confidence: 0.8 },
    { content: "A guided setup wizard could reduce onboarding time by 60%", type: "opportunity", confidence: 0.75 },
  ],
  overall_sentiment: -0.2,
};

export const MOCK_SYNTHESIS: SynthesisResult = {
  patterns: [
    { label: "First-Run Experience Gap", description: "Consistent pattern across all sources: the gap between signup and first value moment is the primary driver of churn", frequency: 12, sentiment: -0.5 },
    { label: "Trust Building Through Proof", description: "Users need tangible evidence of value before upgrading or recommending", frequency: 8, sentiment: 0.2 },
    { label: "Self-Service vs. Guided", description: "Power users want self-service; new users need hand-holding. Current experience serves neither well.", frequency: 6, sentiment: -0.3 },
  ],
  persona_suggestions: [
    {
      name: "Sarah Chen",
      role: "Design Consultant",
      goals: ["Deliver client projects faster", "Produce professional deliverables", "Build a repeatable process"],
      frustrations: ["Too many tools to juggle", "Rebuilding presentations from scratch", "Can't share work-in-progress with clients easily"],
      behaviors: ["Works across 3-5 client projects simultaneously", "Presents findings weekly", "Relies heavily on templates"],
      bio: "Sarah is a senior design consultant at a mid-size agency. She leads service design engagements and needs to move fast while maintaining quality. She's frustrated by the gap between her research insights and polished deliverables.",
    },
  ],
  journey_stages: [
    { label: "Awareness", description: "How users first discover the product", key_touchpoints: ["Social media", "Peer recommendation", "Blog post"], pain_points: ["Unclear value proposition"], opportunities: ["Sharper messaging"], emotional_state: 0.1 },
    { label: "Consideration", description: "Evaluating whether the product is right", key_touchpoints: ["Pricing page", "Feature comparison", "Free trial"], pain_points: ["Confusing pricing tiers"], opportunities: ["Interactive demo"], emotional_state: -0.1 },
    { label: "Onboarding", description: "Getting started with the product", key_touchpoints: ["Signup flow", "Setup wizard", "First project"], pain_points: ["Too many steps", "No progress indicator"], opportunities: ["Guided wizard", "Quick-start templates"], emotional_state: -0.5 },
    { label: "First Value", description: "Experiencing the core value for the first time", key_touchpoints: ["First completed task", "First export", "Dashboard insights"], pain_points: ["Unclear what to do next"], opportunities: ["Celebrate milestones", "Contextual tips"], emotional_state: 0.4 },
    { label: "Retention", description: "Continued usage and habit formation", key_touchpoints: ["Regular workflow", "Team collaboration", "Support interactions"], pain_points: ["Outdated help docs"], opportunities: ["In-app guidance", "Community features"], emotional_state: 0.3 },
  ],
  critical_pain_points: [
    "12-step onboarding process causes 40% drop-off",
    "No clear path from signup to first value moment",
    "Pricing page confusion delays conversion by average 5 days",
  ],
  opportunities: [
    "Reduce onboarding to 3 steps with a guided wizard",
    "Add interactive product demo on landing page",
    "Implement milestone celebrations and progress tracking",
    "Create quick-start templates for common use cases",
  ],
};

export const MOCK_PERSONA: PersonaResult = {
  name: "Sarah Chen",
  role: "Senior Design Consultant",
  bio: "Sarah leads service design engagements at a mid-size consultancy. She manages 3-5 client projects simultaneously and needs tools that help her move from research to deliverables without friction. She values beautiful outputs that make her look professional in client meetings.",
  demographics: {
    age_range: "32-38",
    location: "Melbourne, AU",
    tech_savviness: "High — comfortable with design tools but prefers intuitive UX over technical complexity",
  },
  goals: [
    "Deliver polished journey maps and service blueprints to clients weekly",
    "Reduce time spent reformatting research into presentations",
    "Build a consistent, repeatable design process across engagements",
    "Share work-in-progress with clients for feedback without granting full access",
  ],
  frustrations: [
    "Spends 3+ hours per week rebuilding maps in PowerPoint",
    "Research insights get lost between Miro, Google Docs, and Slack",
    "No single tool connects research to journey maps to deliverables",
    "Client stakeholders can't easily view or comment on work without tool access",
  ],
  behaviors: [
    "Starts every engagement with stakeholder interviews and desk research",
    "Maps customer journeys in workshops using sticky notes, then digitizes",
    "Exports everything to PowerPoint for client presentations",
    "Uses templates extensively to maintain consistency across projects",
  ],
  quotes: [
    "I need my deliverables to look like they came from a top-tier consultancy, not a whiteboard tool.",
    "Half my week is spent making research look presentable instead of doing research.",
    "If I could go from interview notes to a polished journey map in one tool, that would change everything.",
  ],
};

export const MOCK_MAP_GENERATION: MapGenerationResult = {
  stages: [
    { label: "Awareness", description: "Customer discovers the service" },
    { label: "Consideration", description: "Customer evaluates options" },
    { label: "Onboarding", description: "Customer gets started" },
    { label: "First Value", description: "Customer experiences core value" },
    { label: "Retention", description: "Customer becomes a regular user" },
  ],
  nodes: [
    { type: "action", label: "Sees social media post", description: "Customer encounters the brand through social channels", stage_index: 0, lane: "customer_actions", sentiment: 0.2 },
    { type: "touchpoint", label: "Landing page visit", description: "Customer visits the website to learn more", stage_index: 0, lane: "frontstage", sentiment: 0.1 },
    { type: "evidence_item", label: "Social ad creative", description: "Targeted social media advertisement", stage_index: 0, lane: "physical_evidence" },
    { type: "emotion", label: "Curious", description: "Intrigued by the value proposition", stage_index: 0, lane: "emotional_journey", sentiment: 0.3 },

    { type: "action", label: "Compares pricing plans", description: "Customer reviews pricing and features", stage_index: 1, lane: "customer_actions", sentiment: -0.1 },
    { type: "touchpoint", label: "Pricing page", description: "Feature comparison and plan selection", stage_index: 1, lane: "frontstage", sentiment: -0.2 },
    { type: "pain_point", label: "Confusing tier names", description: "Plan names don't clearly communicate what's included", stage_index: 1, lane: "frontstage", severity: "high" },
    { type: "action", label: "CRM lead capture", description: "System captures prospect data", stage_index: 1, lane: "backstage" },
    { type: "emotion", label: "Uncertain", description: "Unsure which plan fits their needs", stage_index: 1, lane: "emotional_journey", sentiment: -0.3 },

    { type: "action", label: "Creates account", description: "Customer signs up for free trial", stage_index: 2, lane: "customer_actions", sentiment: 0.1 },
    { type: "touchpoint", label: "Setup wizard", description: "Guided onboarding flow", stage_index: 2, lane: "frontstage", sentiment: -0.4 },
    { type: "pain_point", label: "12-step setup process", description: "Too many steps before first value moment", stage_index: 2, lane: "frontstage", severity: "critical" },
    { type: "opportunity", label: "Reduce to 3 steps", description: "Streamline onboarding with smart defaults", stage_index: 2, lane: "frontstage" },
    { type: "action", label: "Provision account", description: "Backend creates workspace and default settings", stage_index: 2, lane: "backstage" },
    { type: "emotion", label: "Frustrated", description: "Overwhelmed by setup requirements", stage_index: 2, lane: "emotional_journey", sentiment: -0.6 },

    { type: "action", label: "Completes first task", description: "Customer achieves their first goal", stage_index: 3, lane: "customer_actions", sentiment: 0.7 },
    { type: "moment_of_truth", label: "First 'aha' moment", description: "Customer sees the core value of the product", stage_index: 3, lane: "frontstage", sentiment: 0.8 },
    { type: "touchpoint", label: "Success celebration", description: "Confetti animation and milestone message", stage_index: 3, lane: "frontstage", sentiment: 0.6 },
    { type: "emotion", label: "Delighted", description: "Excited about what's possible", stage_index: 3, lane: "emotional_journey", sentiment: 0.8 },

    { type: "action", label: "Invites team member", description: "Customer brings colleagues into the tool", stage_index: 4, lane: "customer_actions", sentiment: 0.5 },
    { type: "touchpoint", label: "Collaboration features", description: "Real-time editing and commenting", stage_index: 4, lane: "frontstage", sentiment: 0.4 },
    { type: "opportunity", label: "Referral program", description: "Incentivize users to invite others", stage_index: 4, lane: "frontstage" },
    { type: "action", label: "Usage analytics", description: "Track engagement patterns for retention", stage_index: 4, lane: "support_processes" },
    { type: "emotion", label: "Confident", description: "Feels productive and in control", stage_index: 4, lane: "emotional_journey", sentiment: 0.6 },
  ],
  connections: [
    { from_index: 0, to_index: 1, type: "flow" },
    { from_index: 1, to_index: 4, type: "flow" },
    { from_index: 4, to_index: 9, type: "flow" },
    { from_index: 9, to_index: 10, type: "flow" },
    { from_index: 10, to_index: 15, type: "flow" },
    { from_index: 15, to_index: 16, type: "flow" },
    { from_index: 16, to_index: 19, type: "flow" },
  ],
};

export const MOCK_PROBLEM_STATEMENT: ProblemStatementResult = {
  statement: "New users experience excessive friction during onboarding, with a 12-step setup process causing 40% drop-off before they reach their first value moment — resulting in significant acquisition cost waste and stunted growth.",
  context: "The product has strong retention among users who complete onboarding, but the current setup flow was designed incrementally over 2 years without holistic review. Each team added their own configuration step, creating a fragmented experience.",
  impact: "40% of signups never complete onboarding. Users who do complete it take an average of 3 days to reach first value. This translates to approximately $180K in wasted acquisition spend per quarter and limits organic growth through referrals.",
  current_state: "Users must complete 12 sequential steps including profile setup, workspace configuration, integration connections, team invitations, and preference settings before they can use core features. There is no progress indicator, no ability to skip steps, and no guided path to quick wins.",
  desired_state: "Users can reach their first meaningful outcome within 15 minutes of signup through a streamlined 3-step wizard with smart defaults. Non-essential configuration is deferred to contextual moments when users actually need it.",
  constraints: [
    "Must maintain compliance with SOC 2 requirements for workspace setup",
    "Integration connections require OAuth flows that can't be simplified",
    "Existing users must not be disrupted by onboarding changes",
  ],
  assumptions: [
    "Users will accept smart defaults and configure later if needed",
    "A shorter onboarding will improve retention, not just completion rates",
    "The 'first value' moment is creating a project, not configuring settings",
    "Mobile onboarding is not a priority for the current user base",
  ],
};

export const MOCK_EXECUTIVE_SUMMARY = `Our research across multiple user interviews and behavioral data reveals a critical gap in the customer journey: the transition from signup to first value moment. While the product demonstrates strong retention among activated users, 40% of new signups abandon the onboarding process before experiencing core value — a 12-step setup flow that was never designed holistically.

The most significant finding is the direct correlation between time-to-first-value and long-term retention. Users who complete their first meaningful task within 24 hours show 3x higher 90-day retention rates. Yet the current onboarding flow takes an average of 3 days, creating a critical window where users are most likely to churn.

Three priority opportunities emerged: (1) streamlining onboarding from 12 steps to 3 with smart defaults, (2) implementing a guided quick-start experience with templates for common use cases, and (3) adding milestone celebrations and progress tracking to reinforce early wins. Together, these changes are projected to reduce onboarding drop-off by 50-60% and accelerate time-to-value from days to minutes.`;

export const MOCK_CHAT_RESPONSES = [
  "Great! Let's map out this journey together. To start, can you tell me what service or product we're mapping the experience for? What does it do, and who are the primary users?",
  "That's helpful context. Now, let's think about the very beginning of the customer's journey. How do users typically first discover or hear about this service? Is it through marketing, word of mouth, search, or something else?",
  "Interesting. So once they're aware of the service, what happens next? Walk me through the consideration phase — what do users evaluate before deciding to sign up or purchase?",
  "I can see some friction points already forming. Let's move to the onboarding phase. Once someone decides to use the service, what does their first experience look like? What steps do they go through to get started?",
  "Those are significant pain points in the onboarding. Now tell me about the moment when everything clicks — when does a user first experience the real value of the service? What does that look like?",
  "We're building a clear picture. Let's talk about what happens after that first value moment. How do users develop habits around the service? What keeps them coming back, and what might cause them to leave?",
  "This is excellent — I have a comprehensive view of the journey now. I can see five distinct stages: Awareness, Consideration, Onboarding, First Value, and Retention, with some clear pain points especially around the onboarding phase.\n\nWould you like me to generate a journey map from our conversation? I'll create stages, touchpoints, pain points, opportunities, and emotional states based on everything we've discussed.",
];
