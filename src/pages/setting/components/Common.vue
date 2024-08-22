<script setup lang='ts'>
import { reactive } from 'vue'
import defaultConfig from '@@/const/defaultConfig'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const config = reactive(defaultConfig)
</script>

<template>
  <div class="common-wrap">
    <div class="common-option">
      <div class="title mb-2  font-semibold">
        常规设置
      </div>
      <div class="  border p-2 rounded">
        <div class="language flex  justify-between items-center">
          <div class="label ">
            语言
          </div>
          <Select
            v-model="config.common.lang"
          >
            <SelectTrigger class="w-[100px]">
              <SelectValue placeholder="选择语言" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh-CN">
                中文
              </SelectItem>
              <SelectItem value="en-US">
                English
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="auto-launch flex  justify-between mt-2">
          <div class="label ">
            开机自启动
          </div>
          <div class="right flex items-center">
            <Switch
              class="mr-2"
              :checked="config.common.autoLaunch"
              @update:checked="config.common.autoLaunch = !config.common.autoLaunch"
            />
            <span>{{ config.common.autoLaunch ? '开' : '关' }}</span>
          </div>
        </div>
        <div class="auto-launch flex  justify-between mt-2">
          <div class="label ">
            保留当前窗口大小
          </div>
          <div class="right flex items-center">
            <Switch
              class="mr-2"
              :checked="config.common.keepWindowSize"
              @update:checked="config.common.keepWindowSize = !config.common.keepWindowSize"
            />
            <span>{{ config.common.keepWindowSize ? '开' : '关' }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="custom-option mt-4">
      <div class="title mb-2  font-semibold">
        外观设置
      </div>
      <div class=" border p-2 rounded ">
        <div class="theme flex  justify-between  items-center">
          <div class="label">
            主题配色样式
          </div>
          <Select
            v-model="config.common.theme"
          >
            <SelectTrigger class="w-[100px]">
              <SelectValue placeholder="选择主题" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                浅色
              </SelectItem>
              <SelectItem value="dark">
                深色
              </SelectItem>
              <SelectItem value="system">
                跟随系统
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.common-wrap{
  // border: 1px solid #ccc;
  // border-radius: 4px;
  // padding: 10px 20px;
  font-size: 14px;
}
</style>
