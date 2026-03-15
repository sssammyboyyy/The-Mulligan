'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LiveViewTab } from '@/components/admin/live-view-tab';
import { HealthTab } from '@/components/admin/health-tab';

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <Tabs defaultValue="live-view" className="w-full">
        <TabsList>
          <TabsTrigger value="live-view">Live View</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          {/* Other tabs can be added here */}
        </TabsList>
        <TabsContent value="live-view">
          <LiveViewTab />
        </TabsContent>
        <TabsContent value="health">
          <HealthTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}