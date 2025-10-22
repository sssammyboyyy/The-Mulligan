"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, TrendingUp, DollarSign, Users, Calendar } from "lucide-react"

export function RevenueReports() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Revenue (This Month)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">R186,450</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +18% from last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">342</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Booking Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">R545</p>
                <p className="text-xs text-muted-foreground">+12% with upsells</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Detailed revenue analysis by period</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily">
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="space-y-4 mt-6">
              <div className="space-y-3">
                {[
                  { date: "Today", revenue: 8450, bookings: 12, avgValue: 704 },
                  { date: "Yesterday", revenue: 7320, bookings: 10, avgValue: 732 },
                  { date: "2 days ago", revenue: 9180, bookings: 14, avgValue: 656 },
                  { date: "3 days ago", revenue: 6890, bookings: 9, avgValue: 766 },
                  { date: "4 days ago", revenue: 10240, bookings: 16, avgValue: 640 },
                ].map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold text-foreground">{day.date}</p>
                      <p className="text-sm text-muted-foreground">{day.bookings} bookings</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">R{day.revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Avg: R{day.avgValue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="weekly" className="mt-6">
              <p className="text-muted-foreground text-center py-8">Weekly revenue data will be displayed here</p>
            </TabsContent>
            <TabsContent value="monthly" className="mt-6">
              <p className="text-muted-foreground text-center py-8">Monthly revenue data will be displayed here</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Revenue by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
          <CardDescription>Breakdown of revenue sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { category: "Session Bookings", amount: 142300, percentage: 76 },
              { category: "Food & Beverage", amount: 28450, percentage: 15 },
              { category: "Equipment Rental", amount: 10200, percentage: 5 },
              { category: "Lessons", amount: 5500, percentage: 3 },
            ].map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{item.category}</span>
                  <span className="text-sm font-semibold text-foreground">R{item.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
