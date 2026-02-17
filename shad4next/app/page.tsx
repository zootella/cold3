"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Moon } from "lucide-react";

export default function Home() {
  const [dark, setDark] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground transition-colors p-8">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold">Hello, shadcn</h1>

        <div className="flex gap-6">
          <Card className="w-64">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDark(!dark)}
              >
                {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </Button>
              <p className="text-sm text-muted-foreground">
                {dark ? "Dark mode" : "Light mode"}
              </p>
            </CardContent>
          </Card>

          <Card className="w-64">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <label className="flex items-center justify-between">
                <span className="text-sm">Notifications</span>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm">Marketing</span>
                <Switch checked={marketing} onCheckedChange={setMarketing} />
              </label>
              <p className="text-sm text-muted-foreground text-center">
                {[notifications && "Notifications", marketing && "Marketing"]
                  .filter(Boolean)
                  .join(", ") || "None selected"}
              </p>
            </CardContent>
          </Card>

          <Card className="w-64">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setLastClicked("Default")}>Default</Button>
                <Button variant="secondary" onClick={() => setLastClicked("Secondary")}>Secondary</Button>
                <Button variant="outline" onClick={() => setLastClicked("Outline")}>Outline</Button>
                <Button variant="destructive" onClick={() => setLastClicked("Destructive")}>Destructive</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {lastClicked ? `Clicked: ${lastClicked}` : "No button clicked yet"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
