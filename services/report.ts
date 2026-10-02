/**
 * Report service for user-generated content moderation
 * 2-Tier Hierarchical Catalog (Category -> Sub-Reasons)
 * Endpoints:
 *   - GET /api/reports/catalog - Fetch reasons catalog
 *   - POST /api/reports - Submit report
 *   - GET /api/reports - Fetch user submitted reports
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "./client";
import { reportKeys } from "./queryKeys";

// ============================================================================
// Types
// ============================================================================

export type ReportTargetType = "post" | "profile" | "comment" | "message" | "media";

export type ReportSeverity = "critical" | "high" | "medium" | "low";

export interface ReportSubReason {
  id: string;
  title: string;
  description: string;
  severity: ReportSeverity;
  requiresAdditionalDetails?: boolean;
  autoHideThreshold?: number;
}

export interface ReportCategory {
  id: string;
  title: string;
  description: string;
  icon?: string;
  applicableTargets: ReportTargetType[];
  subReasons: ReportSubReason[];
}

export interface CreateReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  reasonId: string;
  additionalNotes?: string;
  reportedUserId?: string | null;
  contextSnapshot?: Record<string, any>;
}

export interface SubmitReportResponse {
  success?: boolean;
  message?: string;
  reportId?: string;
  alreadyReported?: boolean;
  error?: string;
}

export interface UserReportSummary {
  id: string;
  target_type: ReportTargetType;
  target_id: string;
  category?: string;
  reason_title: string;
  status: "pending" | "under_review" | "action_taken" | "dismissed" | "escalated";
  created_at: string;
  resolved_at: string | null;
}

// ============================================================================
// Fallback Static 2-Tier Catalog (Instant offline / cold-start fallback)
// ============================================================================

export const DEFAULT_REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: "harassment_hate",
    title: "Harassment & Hate Speech",
    description: "Bullying, insults, discrimination, or personal attacks.",
    icon: "chatbubble-ellipses-outline",
    applicableTargets: ["post", "profile", "comment", "message"],
    subReasons: [
      {
        id: "harassment.targeted",
        title: "Targeted Harassment or Bullying",
        description: "Persistent attacks, intimidation, stalking, or targeted insults.",
        severity: "high",
        autoHideThreshold: 3,
      },
      {
        id: "harassment.hate_speech",
        title: "Hate Speech or Discrimination",
        description: "Attacking protected groups based on identity, race, religion, or gender.",
        severity: "high",
        autoHideThreshold: 3,
      },
      {
        id: "harassment.doxxing",
        title: "Doxxing / Private Info",
        description: "Sharing private contact info, addresses, or non-public photos.",
        severity: "critical",
        autoHideThreshold: 2,
      },
    ],
  },
  {
    id: "violence_threats",
    title: "Violence & Physical Threats",
    description: "Violent threats, physical harm, graphic gore, or extremism.",
    icon: "warning-outline",
    applicableTargets: ["post", "profile", "comment", "message", "media"],
    subReasons: [
      {
        id: "violence.physical_threats",
        title: "Direct Violent Threats",
        description: "Threats to kill, assault, or physically harm someone.",
        severity: "critical",
        autoHideThreshold: 2,
      },
      {
        id: "violence.gore_graphic",
        title: "Graphic Violence or Cruelty",
        description: "Extremely graphic depictions of death, severe injury, or animal abuse.",
        severity: "high",
        autoHideThreshold: 3,
      },
      {
        id: "violence.terrorism_extremism",
        title: "Terrorism or Violent Extremism",
        description: "Promoting terrorist groups, mass violence, or extremist manifestos.",
        severity: "critical",
        autoHideThreshold: 2,
      },
    ],
  },
  {
    id: "nudity_sexual",
    title: "Nudity & Sexual Content",
    description: "Pornography, explicit sexual acts, or non-consensual imagery.",
    icon: "eye-off-outline",
    applicableTargets: ["post", "profile", "comment", "media"],
    subReasons: [
      {
        id: "sexual.explicit_nudity",
        title: "Explicit Nudity or Sexual Acts",
        description: "Pornography, explicit sexual acts, or unsolicited sexual media.",
        severity: "medium",
        autoHideThreshold: 4,
      },
      {
        id: "sexual.non_consensual",
        title: "Non-Consensual Sexual Imagery",
        description: "Private intimate photos or sextortion material shared without consent.",
        severity: "critical",
        autoHideThreshold: 1,
      },
      {
        id: "sexual.solicitation",
        title: "Commercial Sexual Solicitation",
        description: "Promoting commercial sexual services or prostitution.",
        severity: "medium",
        autoHideThreshold: 4,
      },
    ],
  },
  {
    id: "illegal_harmful",
    title: "Severe Harm & Illegal Content",
    description: "Child safety exploitation, suicide promotion, or illicit trade.",
    icon: "shield-outline",
    applicableTargets: ["post", "profile", "comment", "message", "media"],
    subReasons: [
      {
        id: "illegal.csam",
        title: "Child Sexual Exploitation & Abuse (CSAM)",
        description: "Content depicting, promoting, or facilitating abuse involving minors.",
        severity: "critical",
        autoHideThreshold: 1,
      },
      {
        id: "illegal.self_harm",
        title: "Suicide or Self-Harm Encouragement",
        description: "Encouraging, instructing, or glorifying suicide or severe self-injury.",
        severity: "critical",
        autoHideThreshold: 2,
      },
      {
        id: "illegal.illicit_trade",
        title: "Selling Regulated or Illegal Goods",
        description: "Promoting illegal drugs, firearms, stolen accounts, or counterfeit medicine.",
        severity: "high",
        autoHideThreshold: 3,
      },
    ],
  },
  {
    id: "impersonation_fraud",
    title: "Impersonation & Fraud",
    description: "Identity theft, deceptive accounts, scams, or phishing.",
    icon: "person-outline",
    applicableTargets: ["profile", "post", "message"],
    subReasons: [
      {
        id: "impersonation.user_or_entity",
        title: "Impersonating Me or Someone Else",
        description: "Pretending to be me, a celebrity, or an official brand.",
        severity: "high",
        requiresAdditionalDetails: true,
      },
      {
        id: "fraud.scams_phishing",
        title: "Scams, Phishing or Fraud",
        description: "Crypto scams, fake giveaways, credential theft, or pyramid schemes.",
        severity: "high",
        autoHideThreshold: 3,
      },
      {
        id: "fraud.fake_account",
        title: "Fake or Deceptive Account",
        description: "Account created solely to deceive, manipulate, or mislead users.",
        severity: "medium",
      },
    ],
  },
  {
    id: "spam_deception",
    title: "Spam & Manipulation",
    description: "Automated bot activity, repetitive comments, or artificial engagement.",
    icon: "repeat-outline",
    applicableTargets: ["post", "profile", "comment", "message"],
    subReasons: [
      {
        id: "spam.automated_commercial",
        title: "Spam, Bots or Unsolicited Ads",
        description: "Repetitive spam posts, bot traffic, automated replies, or unsolicited marketing.",
        severity: "low",
        autoHideThreshold: 5,
      },
      {
        id: "spam.fake_engagement",
        title: "Engagement Farming & Misleading Links",
        description: "Hashtag stuffing, artificial like loops, or misleading links.",
        severity: "low",
      },
    ],
  },
  {
    id: "copyright_ip",
    title: "Copyright & Intellectual Property",
    description: "Unauthorized publication of copyrighted video, music, art, or trademarks.",
    icon: "document-text-outline",
    applicableTargets: ["post", "profile", "media"],
    subReasons: [
      {
        id: "ip.copyright_infringement",
        title: "Copyright or Trademark Infringement",
        description: "Using your copyrighted audio, video, photos, or registered trademark without permission.",
        severity: "medium",
        requiresAdditionalDetails: true,
      },
    ],
  },
  {
    id: "other",
    title: "Something Else",
    description: "A community safety violation not covered in the categories above.",
    icon: "ellipsis-horizontal-circle-outline",
    applicableTargets: ["post", "profile", "comment", "message", "media"],
    subReasons: [
      {
        id: "other.general_violation",
        title: "Community Guidelines Violation",
        description: "Other behavior or content that makes the platform unsafe.",
        severity: "low",
        requiresAdditionalDetails: true,
      },
    ],
  },
];

export function getCategoriesForTarget(targetType: ReportTargetType): ReportCategory[] {
  return DEFAULT_REPORT_CATEGORIES.filter((c) => c.applicableTargets.includes(targetType));
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch dynamic report catalog categories from server
 */
export const getReportCatalog = async (targetType?: ReportTargetType): Promise<ReportCategory[]> => {
  try {
    const res = await client.get<{ categories: ReportCategory[] }>(
      "/api/reports/catalog",
      { params: targetType ? { targetType } : undefined }
    );
    return res.data.categories || getCategoriesForTarget(targetType || "post");
  } catch {
    return getCategoriesForTarget(targetType || "post");
  }
};

/**
 * Submit a user report to the server
 */
export const submitReport = async (payload: CreateReportPayload): Promise<SubmitReportResponse> => {
  try {
    const res = await client.post<SubmitReportResponse>("/api/reports", payload);
    return res.data;
  } catch (error: any) {
    if (error?.responseBody) {
      try {
        const parsed = JSON.parse(error.responseBody);
        if (parsed.alreadyReported) {
          return { alreadyReported: true, message: parsed.message };
        }
        return { error: parsed.error || parsed.message || "Failed to submit report" };
      } catch {}
    }
    return { error: error?.message || "Failed to submit report. Please try again." };
  }
};

/**
 * Fetch reports submitted by the logged-in user
 */
export const getUserReports = async (): Promise<UserReportSummary[]> => {
  const res = await client.get<{ reports: UserReportSummary[] }>("/api/reports");
  return res.data.reports || [];
};

// ============================================================================
// TanStack Query Hooks
// ============================================================================

/**
 * Hook to fetch report catalog categories for a target type (cached for 1 hour)
 */
export const useReportCatalog = (targetType?: ReportTargetType) => {
  return useQuery({
    queryKey: reportKeys.catalog(targetType),
    queryFn: () => getReportCatalog(targetType),
    initialData: () => getCategoriesForTarget(targetType || "post"),
    staleTime: 1000 * 60 * 60, // 1 hour cache
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

/**
 * Hook to submit a report with automatic cache invalidation
 */
export const useSubmitReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReportPayload) => submitReport(payload),
    onSuccess: (data) => {
      if (data.success || data.alreadyReported) {
        queryClient.invalidateQueries({ queryKey: reportKeys.userReports });
      }
    },
  });
};

/**
 * Hook to fetch all reports submitted by the current user
 */
export const useUserReports = () => {
  return useQuery({
    queryKey: reportKeys.userReports,
    queryFn: () => getUserReports(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
