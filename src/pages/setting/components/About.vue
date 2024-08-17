<script setup lang='ts'>
import { ref } from 'vue'
import { Loader2, MonitorUp, Terminal } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const isChecking = ref(false)

function goto(url: string) {
  // TODO: debounce
  setTimeout(() => {
    window.open(url)
  }, 200)
}

function checkUpdate() {
  isChecking.value = true
  setTimeout(() => {
    isChecking.value = false
  }, 1000)
}
</script>

<template>
  <div class="about-form">
    <div class="logo">
      <img src="/logo.ico">
      <span>Taim!</span>
    </div>
    <div class="notice">
      <Alert class="mt-4 mb-4">
        <Terminal class="h-4 w-4" />
        <AlertTitle>注意！</AlertTitle>
        <AlertDescription>
          此项目还在开发中，会有很多问题，请谅解！欢迎
          <span class="link" @click="goto('https://github.com/badspider7/TaiM')">star</span> 和
          <span class="link" @click="goto('https://github.com/badspider7/TaiM/issues')">issue</span>。
        </AlertDescription>
      </Alert>
    </div>
    <div class="version">
      <span>版本号:</span><span>0.0.1-alpha</span>
      <Button variant="outline" class="ml-4 update-btn" :disabled="isChecking" @click="checkUpdate">
        <Loader2 v-if="isChecking" class="w-4 h-4 mr-2 animate-spin" />
        <MonitorUp v-else class="w-4 h-4" />
        <span class="ml-2">{{ isChecking ? '正在检查更新...' : '检查更新' }}</span>
      </Button>
    </div>
    <div class="project-link">
      项目地址:
      <Button variant="link" class="h-8" @click="goto('https://github.com/badspider7/TaiM')">
        https://github.com/badspider7/TaiM
      </Button>
    </div>
    <div class="connect-me">
      联系我：
      <Button variant="link" class="h-8">
        1742969779@qq.com
      </Button>
    </div>
    <div class="thanks">
      特别鸣谢:
      <Button variant="link" class="h-8" @click="goto('https://github.com/Planshit/Tai')">
        Tai
      </Button>
      <span>&</span>
      <Button variant="link" class="h-8" @click="goto('https://github.com/sindresorhus/get-windows')">
        get-windows
      </Button>
      <span>&</span>
      <Button variant="link" class="h-8" @click="goto('https://www.shadcn-vue.com/')">
        shadcn-ui
      </Button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.about-form{
  height: fit-content;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 14px;
  .logo{
    display: flex;
    align-items: center;
    justify-content: center;
    img{
    width: 30px;
    height: 30px;
    }
  }

  .update-btn{
    height: 35px;
    font-size: 12px;
     vertical-align: middle;
    align-items: flex-start;
  }

  .link:hover{
    text-decoration: underline;
    cursor: pointer;
  }
}
</style>
