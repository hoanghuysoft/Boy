import { CustomSurface } from "@/components/CustomSurface";
import { FlexText } from "@/components/FlexText";
import { globalTrueSheet, GlobalTrueSheetHelpers } from "@/components/global core/truesheet";
import { useThemeContext } from "@/context/ThemeContext";
import {
  ReportCategory,
  ReportSubReason,
  ReportTargetType,
  useReportCatalog,
  useSubmitReport,
} from "@/services/report";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface OpenReportFlowOptions {
  targetType: ReportTargetType;
  targetId: string;
  reportedUserId?: string | null;
  targetTitle?: string;
  contextSnapshot?: Record<string, any>;
  onSuccess?: () => void;
}

interface ReportFlowContentProps {
  helpers: GlobalTrueSheetHelpers;
  options: OpenReportFlowOptions;
}

type FlowStep = "category" | "sub_reason" | "details" | "success";

export const ReportFlowContent = ({ helpers, options }: ReportFlowContentProps) => {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const { data: categories = [] } = useReportCatalog(options.targetType);
  const { mutate: executeSubmitReport, isPending: isSubmitting } = useSubmitReport();

  const [step, setStep] = useState<FlowStep>("category");
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [selectedSubReason, setSelectedSubReason] = useState<ReportSubReason | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSelectCategory = (category: ReportCategory) => {
    setSelectedCategory(category);
    setErrorMessage(null);
    if (!category.subReasons || category.subReasons.length === 0) {
      setSelectedSubReason({
        id: category.id,
        title: category.title,
        description: category.description,
        severity: "medium",
      });
      setStep("details");
    } else {
      setStep("sub_reason");
    }
  };

  const handleSelectSubReason = (subReason: ReportSubReason) => {
    setSelectedSubReason(subReason);
    setErrorMessage(null);
    setStep("details");
  };

  const handleBackToCategories = () => {
    setStep("category");
    setErrorMessage(null);
  };

  const handleBackToSubReasons = () => {
    setStep("sub_reason");
    setErrorMessage(null);
  };

  const handleSubmit = () => {
    if (!selectedSubReason) return;

    if (selectedSubReason.requiresAdditionalDetails && additionalNotes.trim().length < 5) {
      setErrorMessage(
        t("report.details.minCharError", {
          defaultValue: "Please provide a brief explanation (minimum 5 characters).",
        })
      );
      return;
    }

    setErrorMessage(null);
    Keyboard.dismiss();

    executeSubmitReport(
      {
        targetType: options.targetType,
        targetId: options.targetId,
        reportedUserId: options.reportedUserId,
        reasonId: selectedSubReason.id,
        additionalNotes: additionalNotes.trim() || undefined,
        contextSnapshot: options.contextSnapshot,
      },
      {
        onSuccess: (result) => {
          Keyboard.dismiss();
          if (result.alreadyReported) {
            setSuccessInfo(
              result.message ||
                t("report.success.alreadyReportedMessage", {
                  defaultValue: "You have already reported this content. It is under review.",
                })
            );
            setStep("success");
            options.onSuccess?.();
          } else if (result.success) {
            setSuccessInfo(
              result.message ||
                t("report.success.defaultMessage", {
                  defaultValue: "Thank you. Your report has been received and will be reviewed.",
                })
            );
            setStep("success");
            options.onSuccess?.();
          } else {
            setErrorMessage(
              result.error ||
                t("report.success.submitFailed", {
                  defaultValue: "Failed to submit report. Please try again.",
                })
            );
          }
        },
        onError: (err: any) => {
          setErrorMessage(
            err?.message ||
              t("report.success.submitFailed", {
                defaultValue: "Failed to submit report. Please try again.",
              })
          );
        },
      }
    );
  };

  const targetKey = options.targetType || "content";
  const targetLabel = t(`report.target.${targetKey}`, {
    defaultValue:
      options.targetType === "post"
        ? "Post"
        : options.targetType === "comment"
          ? "Comment"
          : options.targetType === "profile"
            ? "Profile"
            : options.targetType === "message"
              ? "Message"
              : "Content",
  });

  // ─── STEP 1: SELECT CATEGORY ──────────────────────────────────────────────
  if (step === "category") {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <FlexText style={[styles.title, { color: colors.onSurface }]}>
              {t("report.title", { target: targetLabel, defaultValue: `Report ${targetLabel}` })}
            </FlexText>
            <FlexText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {t("report.subtitle", {
                defaultValue: "Select a category that best describes the issue. Your report is confidential.",
              })}
            </FlexText>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {categories.map((cat, idx) => {
            const catTitle = t(`report.categories.${cat.id}.title`, { defaultValue: cat.title });
            const catDesc = t(`report.categories.${cat.id}.description`, { defaultValue: cat.description });
            return (
              <CustomSurface
                key={cat.id}
                index={idx}
                total={categories.length}
                borderRadiusLarge={18}
                borderRadiusSmall={4}
                onPress={() => handleSelectCategory(cat)}
                style={[styles.itemSurface, { backgroundColor: colors.surfaceContainerHighest }]}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name={(cat.icon as any) || "flag-outline"}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <FlexText style={[styles.itemTitle, { color: colors.onSurface }]}>
                    {catTitle}
                  </FlexText>
                  <FlexText style={[styles.itemDesc, { color: colors.onSurfaceVariant }]}>
                    {catDesc}
                  </FlexText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
              </CustomSurface>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ─── STEP 2: SELECT SUB-REASON ────────────────────────────────────────────
  if (step === "sub_reason" && selectedCategory) {
    const subReasonsList = selectedCategory.subReasons || [];
    const categoryTitle = t(`report.categories.${selectedCategory.id}.title`, {
      defaultValue: selectedCategory.title,
    });
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBackToCategories}
            style={[styles.actionButton, { backgroundColor: colors.surfaceContainerHigh }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <FlexText style={[styles.title, { color: colors.onSurface }]}>
              {categoryTitle}
            </FlexText>
            <FlexText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {t("report.subReasonTitle", { defaultValue: "Choose the specific violation:" })}
            </FlexText>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {subReasonsList.map((sub, idx) => {
            const subTitle = t(`report.subReasons.${sub.id}.title`, { defaultValue: sub.title });
            const subDesc = t(`report.subReasons.${sub.id}.description`, { defaultValue: sub.description });
            return (
              <CustomSurface
                key={sub.id}
                index={idx}
                total={subReasonsList.length}
                borderRadiusLarge={18}
                borderRadiusSmall={4}
                onPress={() => handleSelectSubReason(sub)}
                style={[styles.itemSurface, { backgroundColor: colors.surfaceContainerHighest }]}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={styles.subReasonTitleRow}>
                    <FlexText style={[styles.itemTitle, { color: colors.onSurface, flex: 1 }]}>
                      {subTitle}
                    </FlexText>
                  </View>
                  <FlexText style={[styles.itemDesc, { color: colors.onSurfaceVariant }]}>
                    {subDesc}
                  </FlexText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
              </CustomSurface>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ─── STEP 3: DETAILS & SUBMIT ─────────────────────────────────────────────
  if (step === "details" && selectedCategory && selectedSubReason) {
    const categoryTitle = t(`report.categories.${selectedCategory.id}.title`, {
      defaultValue: selectedCategory.title,
    });
    const subReasonTitle = t(`report.subReasons.${selectedSubReason.id}.title`, {
      defaultValue: selectedSubReason.title,
    });
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBackToSubReasons}
            style={[styles.actionButton, { backgroundColor: colors.surfaceContainerHigh }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <FlexText style={[styles.title, { color: colors.onSurface }]}>
              {t("report.details.title", { defaultValue: "Additional Details" })}
            </FlexText>
            <FlexText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {t("report.details.subtitle", { defaultValue: "Help us understand the issue" })}
            </FlexText>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.detailsBody}>
            <CustomSurface
              position="single"
              borderRadiusLarge={16}
              style={[
                styles.selectedReasonBadge,
                { backgroundColor: (colors.primaryContainer || colors.primary) + "1E" },
              ]}
            >
              <Ionicons name="flag-outline" size={16} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <FlexText style={[styles.badgeCategory, { color: colors.onSurfaceVariant }]}>
                  {categoryTitle}
                </FlexText>
                <FlexText style={[styles.badgeTitle, { color: colors.onSurface }]}>
                  {subReasonTitle}
                </FlexText>
              </View>
            </CustomSurface>

            <FlexText style={[styles.inputLabel, { color: colors.onSurface }]}>
              {selectedSubReason.requiresAdditionalDetails
                ? t("report.details.inputRequired", { defaultValue: "Provide details (required):" })
                : t("report.details.inputOptional", { defaultValue: "Add additional context (optional):" })}
            </FlexText>

            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface || colors.surfaceContainerLowest,
                  color: colors.onSurface,
                  borderColor: errorMessage
                    ? colors.error || "#EF4444"
                    : colors.outlineVariant || "rgba(150, 150, 150, 0.3)",
                },
              ]}
              placeholder={t("report.details.placeholder", {
                defaultValue: "Please share any relevant context that will help our safety team investigate...",
              })}
              placeholderTextColor={colors.onSurfaceVariant || "#888"}
              multiline
              numberOfLines={4}
              maxLength={500}
              value={additionalNotes}
              onChangeText={(t) => {
                setAdditionalNotes(t);
                if (errorMessage) setErrorMessage(null);
              }}
            />

            <View style={styles.charCountRow}>
              {errorMessage ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.error || "#EF4444"} />
                  <FlexText style={[styles.errorText, { color: colors.error || "#EF4444" }]}>
                    {errorMessage}
                  </FlexText>
                </View>
              ) : <View style={{ flex: 1 }} />}
              <FlexText style={[styles.charCountText, { color: colors.onSurfaceVariant }]}>
                {additionalNotes.length}/500
              </FlexText>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isSubmitting ? 0.7 : 1,
                },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary || "#FFF"} size="small" />
              ) : (
                <FlexText style={[styles.submitButtonText, { color: colors.onPrimary || "#FFF" }]}>
                  {t("report.details.submit", { defaultValue: "Submit Report" })}
                </FlexText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── STEP 4: SUCCESS ──────────────────────────────────────────────────────
  return (
    <View style={[styles.container, styles.successContainer, { backgroundColor: colors.surfaceContainerLow }]}>
      <View style={[styles.successIconCircle, { backgroundColor: "#10B98122" }]}>
        <Ionicons name="checkmark-circle" size={52} color="#10B981" />
      </View>

      <FlexText style={[styles.successTitle, { color: colors.onSurface }]}>
        {t("report.success.title", { defaultValue: "Thank You for Reporting" })}
      </FlexText>

      <FlexText style={[styles.successSubtitle, { color: colors.onSurfaceVariant }]}>
        {successInfo ||
          t("report.success.defaultMessage", {
            defaultValue: "Your report has been submitted. Our safety team will review it to ensure our community remains safe.",
          })}
      </FlexText>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          Keyboard.dismiss();
          helpers.dismiss();
        }}
        style={[styles.doneButton, { backgroundColor: colors.primary }]}
      >
        <FlexText style={[styles.doneButtonText, { color: colors.onPrimary || "#FFF" }]}>
          {t("report.success.done", { defaultValue: "Done" })}
        </FlexText>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Open the standardized Report Flow using GlobalTrueSheet
 */
export function openReportFlow(options: OpenReportFlowOptions) {
  globalTrueSheet.open({
    detents: [1],
    scrollable: true,
    content: (helpers) => <ReportFlowContent helpers={helpers} options={options} />,
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 32,
    paddingBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  itemSurface: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 3,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  subReasonTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailsBody: {
    paddingTop: 4,
  },
  selectedReasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    columnGap: 10,
  },
  badgeCategory: {
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 100,
    marginBottom: 8,
  },
  charCountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  charCountText: {
    fontSize: 12,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 5,
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
  },
  submitButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 28,
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  doneButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
    alignItems: "center",
    width: "100%",
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
