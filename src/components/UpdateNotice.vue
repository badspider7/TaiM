<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUpdates } from '@/store/updates'
import { Button } from '@/components/ui/button'

const updates = useUpdates()
const dismissed = ref('')
const installFailed = computed(() => updates.state.phase === 'error' && updates.state.failedStage === 'install')
const visible = computed(() => (updates.state.phase === 'downloaded' || installFailed.value)
  && dismissed.value !== updates.state.availableVersion)
</script>

<template>
  <aside class="update-notice" :class="{ 'notice-visible': visible }" aria-label="软件更新">
    <div role="status">
      <template v-if="visible">
        <strong>{{ installFailed ? '安装更新失败' : '更新已准备就绪' }}</strong>
        <p class="text-sm text-muted-foreground">
          {{ installFailed ? updates.state.message : `TaiM ${updates.state.availableVersion} 已下载。安装时会保存统计数据并重启。` }}
        </p>
      </template>
    </div>
    <div v-if="visible" class="flex flex-wrap justify-end gap-2">
      <Button variant="outline" @click="dismissed = updates.state.availableVersion">
        稍后
      </Button>
      <Button @click="updates.command('updater:install')">
        {{ installFailed ? '重试安装' : '重启并安装' }}
      </Button>
    </div>
  </aside>
</template>

<style scoped>
.update-notice {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 50;
  max-width: min(26rem, calc(100% - 48px));
}
.notice-visible {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  background: hsl(var(--card));
  box-shadow: 0 8px 32px #0002;
}
</style>
