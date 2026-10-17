import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { FloatingTabBar } from "@/components/employee/FloatingTabBar";
import { QuickActionModal } from "@/components/employee/QuickActionModal";
import { AddCustomerRemarkModal } from "@/components/employee/AddCustomerRemarkModal";
import { ScheduleFollowUpModal } from "@/components/employee/ScheduleFollowUpModal";
import { AddLeadModal } from "@/components/employee/AddLeadModal";
import { addCustomerRemarkApi, scheduleCustomerFollowUpApi } from "@/services/customerService";
import { createLeadApi } from "@/services/leadService";
import { scheduleFollowUpNotifications } from "@/services/followUpNotificationService";

export default function EmployeeLayout() {
  const { colors } = useTheme();

  // Quick Action Modal states
  const [quickActionVisible, setQuickActionVisible] = useState(false);
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [leadModalVisible, setLeadModalVisible] = useState(false);

  const handleSyncCalls = async () => {
    // Simulate quiet sync
    await new Promise((res) => setTimeout(res, 800));
  };

  const handleSaveRemark = async (text: string) => {
    try {
      await addCustomerRemarkApi("1", text);
    } catch {
      // Ignored
    }
  };

  const handleScheduleFollowUp = async (data: any) => {
    try {
      await scheduleCustomerFollowUpApi("1", data);
      await scheduleFollowUpNotifications({
        customerName: "3 D Align",
        customerId: "1",
        followUpDate: data.date,
        followUpTime: data.time,
        purpose: data.purpose,
        notes: data.notes,
      });
    } catch {
      // Ignored
    }
  };

  const handleCreateLead = async (data: any) => {
    try {
      const created = await createLeadApi(data);
      router.push(`/(employee)/leads/${created.id}` as any);
    } catch {
      // Ignored
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "none",
        }}
      >
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Screen name="profile" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="customers/index" options={{ animation: "none" }} />
        <Stack.Screen name="customers/[customerId]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="leads/index" options={{ animation: "none" }} />
        <Stack.Screen name="leads/[leadId]" options={{ animation: "slide_from_right" }} />
      </Stack>

      {/* Persistent Floating Bottom Navigation */}
      <FloatingTabBar
        onQuickActionPress={() => setQuickActionVisible(true)}
      />

      {/* Global Quick Actions Modal */}
      <QuickActionModal
        visible={quickActionVisible}
        onClose={() => setQuickActionVisible(false)}
        onAddRemark={() => setRemarkModalVisible(true)}
        onScheduleFollowUp={() => setFollowUpModalVisible(true)}
        onAddLead={() => setLeadModalVisible(true)}
        onSyncCalls={handleSyncCalls}
      />

      {/* Action Sub-Modals */}
      <AddCustomerRemarkModal
        visible={remarkModalVisible}
        onClose={() => setRemarkModalVisible(false)}
        onSave={handleSaveRemark}
        customerName="Orion Systems"
      />

      <ScheduleFollowUpModal
        visible={followUpModalVisible}
        onClose={() => setFollowUpModalVisible(false)}
        onSchedule={handleScheduleFollowUp}
        targetName="Orion Systems"
      />

      <AddLeadModal
        visible={leadModalVisible}
        onClose={() => setLeadModalVisible(false)}
        onCreate={handleCreateLead}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
