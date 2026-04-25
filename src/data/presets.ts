export type FailureTag =
  | "Retrieval failure"
  | "Wrong tool selection"
  | "Wrong tool arguments"
  | "Stale memory"
  | "Missing context"
  | "Dead-end reasoning"
  | "Incomplete execution"
  | "Failed recovery"
  | "Hallucinated assumption";

export const TAXONOMY: FailureTag[] = [
  "Retrieval failure",
  "Wrong tool selection",
  "Wrong tool arguments",
  "Stale memory",
  "Missing context",
  "Dead-end reasoning",
  "Incomplete execution",
  "Failed recovery",
  "Hallucinated assumption",
];

export type StepKind = "thought" | "tool_call" | "observation" | "output";
export type TraceStep = { kind: StepKind; label: string; content: string };

export type FailedRun = {
  id: string;
  title: string;
  input: string;
  expected: string;
  actual: string;
  trace: TraceStep[];
  suggestedTags: FailureTag[];
  explanation: string;
};

export type Preset = {
  id: string;
  name: string;
  shortDescription: string;
  task: string;
  successCriteria: string;
  dataset: string;
  examplePrompts: string[];
  runs: FailedRun[];
  recommendedFix: { category: FailureTag; why: string; action: string };
};

const make = (
  id: string,
  title: string,
  input: string,
  expected: string,
  actual: string,
  trace: TraceStep[],
  suggestedTags: FailureTag[],
  explanation: string,
): FailedRun => ({ id, title, input, expected, actual, trace, suggestedTags, explanation });

export const PRESETS: Preset[] = [
  {
    id: "rag",
    name: "RAG Agent Retrieval Failure",
    shortDescription: "QA over a product docs corpus where the retriever often misses the right chunks.",
    task: "Answer customer questions using a vector store of product documentation.",
    successCriteria: "Answer is grounded in retrieved chunks and matches the reference answer.",
    dataset: "120 customer questions sampled from support tickets.",
    examplePrompts: [
      "Why did retrieval miss the changelog page?",
      "Which questions failed because of missing context?",
      "Suggest a chunking strategy to fix the top issue.",
      "Compare hallucination vs retrieval failure rates.",
    ],
    runs: [
      make(
        "rag-1",
        "Pricing question returns outdated tier",
        "What is the current price of the Pro plan?",
        "Pro plan is $29/month as of the latest pricing page.",
        "Pro plan is $19/month.",
        [
          { kind: "thought", label: "Plan", content: "I should search the docs for 'Pro plan price'." },
          { kind: "tool_call", label: "vector_search", content: "query: 'Pro plan price', k: 4" },
          { kind: "observation", label: "Retrieved", content: "3 chunks from /pricing-archive-2022.md, 1 chunk from /faq.md" },
          { kind: "thought", label: "Reason", content: "The archive chunk says $19, I'll trust the most relevant hit." },
          { kind: "output", label: "Answer", content: "Pro plan is $19/month." },
        ],
        ["Retrieval failure", "Stale memory"],
        "The retriever surfaced an archived pricing page. The current /pricing.md was never indexed, so the agent confidently used outdated content.",
      ),
      make(
        "rag-2",
        "Multi-hop question loses context",
        "Does the Enterprise plan include SSO and what identity providers are supported?",
        "Yes, SSO is included. Supported: Okta, Azure AD, Google Workspace.",
        "Yes, SSO is included.",
        [
          { kind: "tool_call", label: "vector_search", content: "query: 'Enterprise SSO', k: 3" },
          { kind: "observation", label: "Retrieved", content: "2 chunks confirming SSO is included; no provider list." },
          { kind: "output", label: "Answer", content: "Yes, SSO is included." },
        ],
        ["Missing context", "Incomplete execution"],
        "The agent answered the first half of the question and stopped. It never re-queried for 'identity providers'.",
      ),
      make(
        "rag-3",
        "Hallucinated API endpoint",
        "What endpoint do I call to delete a workspace?",
        "DELETE /v2/workspaces/:id",
        "DELETE /v1/workspace/remove",
        [
          { kind: "tool_call", label: "vector_search", content: "query: 'delete workspace endpoint', k: 4" },
          { kind: "observation", label: "Retrieved", content: "0 relevant chunks (similarity < 0.4)" },
          { kind: "thought", label: "Reason", content: "I'll guess based on REST conventions." },
          { kind: "output", label: "Answer", content: "DELETE /v1/workspace/remove" },
        ],
        ["Retrieval failure", "Hallucinated assumption"],
        "Retrieval returned nothing useful. Instead of saying 'I don't know', the agent fabricated a plausible endpoint.",
      ),
      make(
        "rag-4",
        "Right chunk, wrong synthesis",
        "How long does the free trial last?",
        "14 days.",
        "30 days.",
        [
          { kind: "tool_call", label: "vector_search", content: "query: 'free trial length', k: 3" },
          { kind: "observation", label: "Retrieved", content: "Top chunk: '...the 14-day free trial...'; older blog mentions 30 days." },
          { kind: "output", label: "Answer", content: "30 days." },
        ],
        ["Missing context", "Hallucinated assumption"],
        "Both old and new chunks were retrieved; the agent picked the wrong one because there was no recency signal.",
      ),
      make(
        "rag-5",
        "Wrong language chunk retrieved",
        "Comment puis-je exporter mes données ?",
        "Réponse en français citant la page d'export.",
        "Answer in English about a different feature.",
        [
          { kind: "tool_call", label: "vector_search", content: "query: 'export data', k: 4" },
          { kind: "observation", label: "Retrieved", content: "English chunks only; French docs not indexed." },
          { kind: "output", label: "Answer", content: "You can export from Settings > Billing." },
        ],
        ["Retrieval failure", "Missing context"],
        "French docs were never embedded; the agent fell back to unrelated English content.",
      ),
      make(
        "rag-6",
        "Stale changelog",
        "What changed in version 4.2?",
        "Summary of v4.2 changelog.",
        "Summary of v3.9 changelog.",
        [
          { kind: "tool_call", label: "vector_search", content: "query: 'version 4.2 changelog', k: 3" },
          { kind: "observation", label: "Retrieved", content: "Only v3.x changelogs present in index." },
          { kind: "output", label: "Answer", content: "v3.9 introduced..." },
        ],
        ["Stale memory", "Retrieval failure"],
        "The index is 6 months old; v4.x was never embedded.",
      ),
      make(
        "rag-7",
        "Acronym mismatch",
        "Does the API support RBAC?",
        "Yes, role-based access control is supported on Enterprise.",
        "I don't have information about RBAC.",
        [
          { kind: "tool_call", label: "vector_search", content: "query: 'RBAC', k: 3" },
          { kind: "observation", label: "Retrieved", content: "No matches for 'RBAC'. Docs use 'role-based access control'." },
          { kind: "output", label: "Answer", content: "I don't have information about RBAC." },
        ],
        ["Retrieval failure", "Missing context"],
        "Embedding similarity didn't bridge the acronym to the spelled-out form.",
      ),
    ],
    recommendedFix: {
      category: "Retrieval failure",
      why: "Roughly 60% of failed runs trace back to retrieval missing or returning stale chunks.",
      action: "Re-index the corpus on a weekly schedule and add hybrid (BM25 + vector) search to handle acronyms.",
    },
  },
  {
    id: "browser",
    name: "Browser Agent Tool Misuse",
    shortDescription: "Web automation agent that frequently picks the wrong action or wrong selector.",
    task: "Complete a list of web tasks: book flights, fill forms, scrape prices.",
    successCriteria: "Task completes end-to-end with the correct outcome.",
    dataset: "60 web automation tasks across 12 sites.",
    examplePrompts: [
      "Which tasks failed because of selector mistakes?",
      "Show runs where the agent clicked before the page loaded.",
      "How often did it pick scroll instead of click?",
      "Recommend a guard for stale selectors.",
    ],
    runs: [
      make(
        "br-1",
        "Clicked the wrong button",
        "Subscribe to the newsletter on example.com.",
        "Email submitted successfully.",
        "Triggered a 'Contact sales' modal.",
        [
          { kind: "thought", label: "Plan", content: "Find a subscribe button." },
          { kind: "tool_call", label: "click", content: "selector: 'button.cta-primary'" },
          { kind: "observation", label: "Result", content: "Modal opened: 'Talk to sales'." },
          { kind: "output", label: "Done", content: "Reported success." },
        ],
        ["Wrong tool selection", "Hallucinated assumption"],
        "Two CTAs share the .cta-primary class. The agent picked the first one without checking its label.",
      ),
      make(
        "br-2",
        "Fill before page loaded",
        "Search for 'wireless headphones' on shop.example.com.",
        "Search results page shown.",
        "TypeError: element is null.",
        [
          { kind: "tool_call", label: "type", content: "selector: '#search', text: 'wireless headphones'" },
          { kind: "observation", label: "Error", content: "element is null" },
          { kind: "output", label: "Done", content: "Failed without retry." },
        ],
        ["Wrong tool arguments", "Failed recovery"],
        "The agent didn't wait for #search to be visible and gave up on the first error.",
      ),
      make(
        "br-3",
        "Scrolled instead of clicking 'Next'",
        "Go to page 3 of the results.",
        "Page 3 displayed.",
        "Stayed on page 1 after scrolling 8 times.",
        [
          { kind: "thought", label: "Plan", content: "Pagination is at the bottom; I'll scroll." },
          { kind: "tool_call", label: "scroll", content: "y: 800" },
          { kind: "tool_call", label: "scroll", content: "y: 800" },
          { kind: "output", label: "Done", content: "Stuck." },
        ],
        ["Wrong tool selection", "Dead-end reasoning"],
        "The agent kept scrolling rather than identifying and clicking the 'Next' link.",
      ),
      make(
        "br-4",
        "Stale selector after re-render",
        "Add the second item to cart.",
        "Item added.",
        "Element detached from DOM.",
        [
          { kind: "tool_call", label: "click", content: "selector: '.product:nth-child(2) .add'" },
          { kind: "observation", label: "Error", content: "Stale element reference." },
          { kind: "output", label: "Done", content: "No retry attempted." },
        ],
        ["Wrong tool arguments", "Failed recovery"],
        "The list re-rendered between locating and clicking. A re-query would have fixed it.",
      ),
      make(
        "br-5",
        "Filled wrong form field",
        "Enter address on checkout page.",
        "Address saved.",
        "Address typed into 'Company name' field.",
        [
          { kind: "tool_call", label: "type", content: "selector: 'input[name=line1]', text: '...'" },
          { kind: "observation", label: "Result", content: "Wrong input — selector matched a hidden field with same name." },
          { kind: "output", label: "Done", content: "Form rejected." },
        ],
        ["Wrong tool arguments", "Missing context"],
        "Two inputs shared the same name attribute; the agent didn't disambiguate.",
      ),
      make(
        "br-6",
        "Captcha not handled",
        "Submit the form.",
        "Submission accepted.",
        "Loop submitting the same form 5 times.",
        [
          { kind: "tool_call", label: "click", content: "selector: 'button[type=submit]'" },
          { kind: "observation", label: "Result", content: "Captcha appeared." },
          { kind: "tool_call", label: "click", content: "selector: 'button[type=submit]'" },
        ],
        ["Dead-end reasoning", "Failed recovery"],
        "The agent never recognized the captcha and looped on the same action.",
      ),
    ],
    recommendedFix: {
      category: "Wrong tool selection",
      why: "Most failures stem from picking the wrong action or selector before reading the page state.",
      action: "Add a mandatory 'observe' step before every action and require the agent to justify selector choice.",
    },
  },
  {
    id: "support",
    name: "Support Agent Stale Memory",
    shortDescription: "Multi-turn support agent that often answers based on outdated session memory.",
    task: "Help customers across multi-turn conversations using a memory store of prior interactions.",
    successCriteria: "Reply uses the latest known state of the customer's account.",
    dataset: "80 conversations replayed from production transcripts.",
    examplePrompts: [
      "Which replies used stale plan information?",
      "Where did the agent invent a refund policy?",
      "How often did it forget the customer's name?",
      "Suggest a memory TTL strategy.",
    ],
    runs: [
      make(
        "sup-1",
        "Recommended an upgrade the user already has",
        "Customer asks about Pro features.",
        "Acknowledge they're on Pro and answer their question.",
        "'You should upgrade to Pro to get this!'",
        [
          { kind: "tool_call", label: "memory.get", content: "key: 'plan'" },
          { kind: "observation", label: "Memory", content: "plan: 'Free' (cached 14 days ago)" },
          { kind: "output", label: "Reply", content: "You should upgrade to Pro to get this!" },
        ],
        ["Stale memory", "Missing context"],
        "Memory was 2 weeks old; the user upgraded last week. No freshness check before using it.",
      ),
      make(
        "sup-2",
        "Hallucinated refund window",
        "How long do I have to request a refund?",
        "Refund window is 30 days per policy.",
        "Refunds are accepted up to 90 days.",
        [
          { kind: "thought", label: "Reason", content: "I recall most SaaS use 90 days." },
          { kind: "output", label: "Reply", content: "Refunds are accepted up to 90 days." },
        ],
        ["Hallucinated assumption", "Missing context"],
        "The agent didn't query the policy document and made up a number.",
      ),
      make(
        "sup-3",
        "Forgot prior turn",
        "Customer: 'My order ID is 123.' (turn 1) 'When will it arrive?' (turn 2)",
        "Look up order 123 and answer.",
        "'Can you share your order ID?'",
        [
          { kind: "tool_call", label: "memory.get", content: "key: 'order_id'" },
          { kind: "observation", label: "Memory", content: "null (window only included last 1 turn)" },
          { kind: "output", label: "Reply", content: "Can you share your order ID?" },
        ],
        ["Stale memory", "Incomplete execution"],
        "Conversation memory window was too small; turn 1 was already evicted.",
      ),
      make(
        "sup-4",
        "Used old contact email",
        "Send confirmation to my email.",
        "Sent to the latest verified email.",
        "Sent to a deleted address.",
        [
          { kind: "tool_call", label: "memory.get", content: "key: 'email'" },
          { kind: "observation", label: "Memory", content: "old@example.com (cached)" },
          { kind: "tool_call", label: "send_email", content: "to: 'old@example.com'" },
          { kind: "output", label: "Reply", content: "Confirmation sent." },
        ],
        ["Stale memory", "Wrong tool arguments"],
        "Cached email was never invalidated when the user updated it.",
      ),
      make(
        "sup-5",
        "Forgot escalation flag",
        "Customer was already escalated yesterday.",
        "Acknowledge escalation and provide ETA.",
        "Started troubleshooting from scratch.",
        [
          { kind: "tool_call", label: "memory.get", content: "key: 'escalation'" },
          { kind: "observation", label: "Memory", content: "null" },
          { kind: "output", label: "Reply", content: "Let's start by restarting the app..." },
        ],
        ["Stale memory", "Dead-end reasoning"],
        "Escalation status lived in a different store the agent didn't read.",
      ),
      make(
        "sup-6",
        "Apologized for an issue that was fixed",
        "Status of incident #44.",
        "Incident resolved 2h ago.",
        "Issue is ongoing, we're investigating.",
        [
          { kind: "tool_call", label: "memory.get", content: "key: 'incident_44'" },
          { kind: "observation", label: "Memory", content: "status: 'open' (cached 4h ago)" },
          { kind: "output", label: "Reply", content: "Issue is ongoing." },
        ],
        ["Stale memory", "Hallucinated assumption"],
        "Status changed but cache wasn't refreshed.",
      ),
    ],
    recommendedFix: {
      category: "Stale memory",
      why: "Most replies fail because cached facts are used without checking freshness.",
      action: "Add a TTL to memory entries and re-fetch any value older than 1 hour for account-state queries.",
    },
  },
  {
    id: "planning",
    name: "Planning Agent Dead-End Reasoning",
    shortDescription: "Multi-step planner that frequently runs into loops or gives up after one failed branch.",
    task: "Plan and execute multi-step tasks like 'organize a trip' or 'set up a project'.",
    successCriteria: "Goal achieved within step budget without loops.",
    dataset: "40 multi-step planning tasks.",
    examplePrompts: [
      "Where did the planner loop on the same subgoal?",
      "Which runs failed because the plan had no fallback?",
      "Show runs where it ignored an obvious shortcut.",
      "Suggest a budget-aware planning strategy.",
    ],
    runs: [
      make(
        "pl-1",
        "Loop on same subgoal",
        "Book a meeting room next Tuesday.",
        "Room booked.",
        "Tried 'check availability' 7 times in a row.",
        [
          { kind: "tool_call", label: "check_availability", content: "date: 'Tue'" },
          { kind: "observation", label: "Result", content: "No rooms." },
          { kind: "tool_call", label: "check_availability", content: "date: 'Tue'" },
          { kind: "observation", label: "Result", content: "No rooms." },
          { kind: "output", label: "Done", content: "Gave up." },
        ],
        ["Dead-end reasoning", "Failed recovery"],
        "The planner kept retrying the same query instead of widening the search to other days.",
      ),
      make(
        "pl-2",
        "Abandoned after first failure",
        "Find a flight under $300.",
        "Returns at least one option or 'no options'.",
        "'I cannot help.'",
        [
          { kind: "tool_call", label: "search_flights", content: "max_price: 300" },
          { kind: "observation", label: "Result", content: "0 results." },
          { kind: "output", label: "Done", content: "I cannot help." },
        ],
        ["Failed recovery", "Incomplete execution"],
        "No fallback to widen dates or relax constraints.",
      ),
      make(
        "pl-3",
        "Plan ignored a known shortcut",
        "Convert and email this PDF.",
        "Use the built-in 'send_pdf' tool.",
        "Manually exported, re-uploaded, then emailed.",
        [
          { kind: "thought", label: "Plan", content: "Step 1: download. Step 2: upload. Step 3: send." },
          { kind: "output", label: "Done", content: "Took 6 steps instead of 1." },
        ],
        ["Wrong tool selection", "Dead-end reasoning"],
        "The agent didn't notice a single-step tool was available.",
      ),
      make(
        "pl-4",
        "Sub-plan never executed",
        "Set up a new project: create repo, invite team, schedule kickoff.",
        "All three sub-tasks done.",
        "Only created the repo.",
        [
          { kind: "tool_call", label: "create_repo", content: "name: 'proj'" },
          { kind: "output", label: "Done", content: "Done." },
        ],
        ["Incomplete execution", "Dead-end reasoning"],
        "After step 1 the agent declared success and skipped the rest.",
      ),
      make(
        "pl-5",
        "Wrong tool for math",
        "How many people fit in 3 rooms of 12?",
        "36",
        "I'll need to think about this.",
        [
          { kind: "thought", label: "Reason", content: "This needs a calculator." },
          { kind: "tool_call", label: "search_web", content: "query: 'people 3 rooms 12'" },
          { kind: "output", label: "Done", content: "I'll need to think about this." },
        ],
        ["Wrong tool selection", "Hallucinated assumption"],
        "Picked web search instead of the calculator tool.",
      ),
      make(
        "pl-6",
        "No budget tracking",
        "Plan a 5-step task within 8 actions.",
        "Finish under budget.",
        "Used 22 actions and ran out.",
        [
          { kind: "tool_call", label: "various", content: "many redundant calls" },
          { kind: "output", label: "Done", content: "Budget exceeded." },
        ],
        ["Dead-end reasoning", "Incomplete execution"],
        "No internal counter; the agent kept exploring without checking remaining steps.",
      ),
    ],
    recommendedFix: {
      category: "Dead-end reasoning",
      why: "Half of failures come from loops or single-branch plans with no fallback.",
      action: "Add a 'replan' trigger after 2 consecutive identical actions and require an explicit fallback for each subgoal.",
    },
  },
];

export const SEVERITY: Record<FailureTag, number> = {
  "Retrieval failure": 0.9,
  "Wrong tool selection": 0.7,
  "Wrong tool arguments": 0.6,
  "Stale memory": 0.8,
  "Missing context": 0.6,
  "Dead-end reasoning": 0.85,
  "Incomplete execution": 0.75,
  "Failed recovery": 0.65,
  "Hallucinated assumption": 0.95,
};
