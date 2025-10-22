"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Trophy, Plus, Users } from "lucide-react"

export function CompetitionsManager() {
  const competitions = [
    {
      id: "1",
      name: "Monthly Longest Drive Challenge",
      type: "longest_drive",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      prize: "R2000 Pro Shop Voucher",
      entries: 45,
      isActive: true,
    },
    {
      id: "2",
      name: "Closest to the Pin Competition",
      type: "closest_to_pin",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      prize: "Free 2-Hour Session",
      entries: 38,
      isActive: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Competitions</h2>
          <p className="text-muted-foreground">Manage monthly competitions and view entries</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Create Competition
        </Button>
      </div>

      {/* Active Competitions */}
      <div className="grid md:grid-cols-2 gap-6">
        {competitions.map((competition) => (
          <Card key={competition.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{competition.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(competition.startDate).toLocaleDateString()} -{" "}
                      {new Date(competition.endDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <Switch checked={competition.isActive} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{competition.entries} entries</span>
                </div>
                <Badge className="bg-secondary/20 text-secondary border-0">{competition.type.replace("_", " ")}</Badge>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-1">Prize</p>
                <p className="text-sm text-muted-foreground">{competition.prize}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  View Entries
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leaderboard Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Current Leaderboard</CardTitle>
          <CardDescription>Top performers in active competitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { rank: 1, name: "John Smith", score: 342, competition: "Longest Drive" },
              { rank: 2, name: "Sarah Johnson", score: 338, competition: "Longest Drive" },
              { rank: 3, name: "Mike Williams", score: 325, competition: "Longest Drive" },
              { rank: 1, name: "Emma Davis", score: 1.2, competition: "Closest to Pin" },
              { rank: 2, name: "David Brown", score: 1.8, competition: "Closest to Pin" },
            ].map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      entry.rank === 1 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {entry.rank}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.competition}</p>
                  </div>
                </div>
                <p className="font-bold text-foreground">
                  {entry.score}
                  {entry.competition === "Closest to Pin" ? "m" : "yds"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
