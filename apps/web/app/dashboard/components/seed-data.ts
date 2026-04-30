export interface DemoDocument {
  id: string;
  name: string;
  type: "Lease" | "Employment" | "Service" | "NDA" | "Loan" | "SaaS";
  market: "South Africa" | "Kenya";
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  flags: number;
  status: "Reviewed" | "Awaiting payment" | "Processing";
  reviewedAt: string;
  shortReviewedAt: string;
  uploader: string;
}

export const demoDocuments: DemoDocument[] = [
  {
    id: "rev_8x21",
    name: "Hodari Realty - 12-month lease.pdf",
    type: "Lease",
    market: "Kenya",
    riskScore: 72,
    riskLevel: "high",
    flags: 5,
    status: "Reviewed",
    reviewedAt: "2026-04-28 14:22",
    shortReviewedAt: "Today, 14:22",
    uploader: "James Mwangi",
  },
  {
    id: "rev_8w99",
    name: "BrightPath services agreement.docx",
    type: "Service",
    market: "South Africa",
    riskScore: 41,
    riskLevel: "medium",
    flags: 3,
    status: "Reviewed",
    reviewedAt: "2026-04-28 11:08",
    shortReviewedAt: "Today, 11:08",
    uploader: "Amara Okeke",
  },
  {
    id: "rev_8w55",
    name: "Junior dev offer letter.pdf",
    type: "Employment",
    market: "South Africa",
    riskScore: 18,
    riskLevel: "low",
    flags: 1,
    status: "Reviewed",
    reviewedAt: "2026-04-27 16:45",
    shortReviewedAt: "Yesterday",
    uploader: "Amara Okeke",
  },
  {
    id: "rev_8v40",
    name: "Vendor NDA - Kibanda Foods.pdf",
    type: "NDA",
    market: "Kenya",
    riskScore: 24,
    riskLevel: "low",
    flags: 1,
    status: "Reviewed",
    reviewedAt: "2026-04-26 09:14",
    shortReviewedAt: "Apr 26",
    uploader: "James Mwangi",
  },
  {
    id: "rev_8u11",
    name: "SaaS subscription renewal.pdf",
    type: "SaaS",
    market: "South Africa",
    riskScore: 58,
    riskLevel: "medium",
    flags: 4,
    status: "Awaiting payment",
    reviewedAt: "2026-04-25 17:30",
    shortReviewedAt: "Apr 25",
    uploader: "Amara Okeke",
  },
  {
    id: "rev_8t02",
    name: "Personal loan terms.pdf",
    type: "Loan",
    market: "Kenya",
    riskScore: 81,
    riskLevel: "high",
    flags: 6,
    status: "Reviewed",
    reviewedAt: "2026-04-24 12:15",
    shortReviewedAt: "Apr 24",
    uploader: "James Mwangi",
  },
];

export interface ActivityEvent {
  id: string;
  kind: "review_completed" | "follow_up" | "high_risk" | "document_uploaded" | "credit_added";
  title: string;
  meta: string;
  when: string;
}

export const demoActivity: ActivityEvent[] = [
  {
    id: "act_1",
    kind: "high_risk",
    title: "High-risk contract flagged",
    meta: "Hodari Realty - 12-month lease.pdf / score 72",
    when: "2 hours ago",
  },
  {
    id: "act_2",
    kind: "follow_up",
    title: "Follow-up answered",
    meta: "Can the landlord raise rent mid-lease?",
    when: "2 hours ago",
  },
  {
    id: "act_3",
    kind: "review_completed",
    title: "Review completed",
    meta: "BrightPath services agreement.docx",
    when: "5 hours ago",
  },
  {
    id: "act_4",
    kind: "review_completed",
    title: "Review completed",
    meta: "Junior dev offer letter.pdf / score 18",
    when: "Yesterday, 16:45",
  },
  {
    id: "act_5",
    kind: "credit_added",
    title: "5 review credits granted",
    meta: "Welcome bonus / expires May 28",
    when: "Apr 24",
  },
];

export const riskDistribution = [
  { label: "Low", count: 2, total: 6, color: "#16a34a", soft: "#dcfce7" },
  { label: "Medium", count: 2, total: 6, color: "#d97706", soft: "#fef3c7" },
  { label: "High", count: 2, total: 6, color: "#dc2626", soft: "#fee2e2" },
];
