// app / (tabs) / _layout.tsx

import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        /*
         * You're using Tabs only
         * as a navigator.
         *
         * The actual bottom tab
         * bar remains hidden.
         */
        tabBarStyle: {
          display: "none",
        },
      }}
    >
      <Tabs.Screen name="index" />

      <Tabs.Screen name="sales" />

      <Tabs.Screen name="orderregister-entered" />

      <Tabs.Screen name="orderregister-booked" />

      <Tabs.Screen name="orderIntake" />

      <Tabs.Screen name="salesoverview-product" />

      <Tabs.Screen name="salesoverview-abp" />

      <Tabs.Screen name="inventory" />

      <Tabs.Screen name="InventoryMonthSelectionScreen" />

      <Tabs.Screen name="debtorsaging" />

      <Tabs.Screen name="budgetmis" />

      <Tabs.Screen name="commissioning" />

      <Tabs.Screen name="creditLimit" />

      <Tabs.Screen name="pricelist" />

      <Tabs.Screen name="passwordRetriever" />
    </Tabs>
  );
}
