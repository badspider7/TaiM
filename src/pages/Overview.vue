<script setup lang='ts'>
import { ref } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
</script>

<template>
  <div class="overview-wrap">
    <div class="title font-middle text-lg">
      概览
    </div>
    <div class="choose-time mt-5">
      <Tabs default-value="today" class="w-[400px]">
        <TabsList>
          <TabsTrigger value="today">
            今日
          </TabsTrigger>
          <TabsTrigger value="week">
            本周
          </TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          Make changes to your account here.
        </TabsContent>
        <TabsContent value="week">
          Change your password here.
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>
