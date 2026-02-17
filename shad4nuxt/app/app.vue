<script setup lang="ts">
import { ref, watch } from "vue"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sun, Moon } from "lucide-vue-next"

const dark = ref(false)
const notifications = ref(true)
const marketing = ref(false)
const lastClicked = ref<string | null>(null)

watch(dark, (val) => {
  document.documentElement.classList.toggle("dark", val)
})

const prefsLabel = computed(() => {
  const parts = []
  if (notifications.value) parts.push("Notifications")
  if (marketing.value) parts.push("Marketing")
  return parts.length ? parts.join(", ") : "None selected"
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background text-foreground transition-colors p-8">
    <div class="flex flex-col items-center gap-8">
      <h1 class="text-4xl font-bold">Hello, shadcn-vue</h1>

      <div class="flex gap-6">
        <Card class="w-64">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col items-center gap-3">
            <Button variant="outline" size="icon" @click="dark = !dark">
              <Moon v-if="dark" class="size-4" />
              <Sun v-else class="size-4" />
            </Button>
            <p class="text-sm text-muted-foreground">
              {{ dark ? "Dark mode" : "Light mode" }}
            </p>
          </CardContent>
        </Card>

        <Card class="w-64">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <label class="flex items-center justify-between">
              <span class="text-sm">Notifications</span>
              <Switch v-model="notifications" />
            </label>
            <label class="flex items-center justify-between">
              <span class="text-sm">Marketing</span>
              <Switch v-model="marketing" />
            </label>
            <p class="text-sm text-muted-foreground text-center">
              {{ prefsLabel }}
            </p>
          </CardContent>
        </Card>

        <Card class="w-64">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col items-center gap-3">
            <div class="flex flex-wrap justify-center gap-2">
              <Button @click="lastClicked = 'Default'">Default</Button>
              <Button variant="secondary" @click="lastClicked = 'Secondary'">Secondary</Button>
              <Button variant="outline" @click="lastClicked = 'Outline'">Outline</Button>
              <Button variant="destructive" @click="lastClicked = 'Destructive'">Destructive</Button>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ lastClicked ? `Clicked: ${lastClicked}` : "No button clicked yet" }}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
