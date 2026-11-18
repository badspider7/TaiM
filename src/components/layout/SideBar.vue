<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DEFAULT_DISPLAY_SIDEBAR } from '@/const'

const sideBarList = DEFAULT_DISPLAY_SIDEBAR
const route = useRoute()
const activeMenuName = computed(() => route.name)
</script>

<template>
  <div class="sidebar-wrap ">
    <div class="sidebar-top">
      <ul class="sidebar-list">
        <li
          v-for="item in sideBarList" :key="item.path" class="sidebar-item  hover:bg-shallow-gray rounded" :class="[activeMenuName === item.name ? 'is-active' : '']"
        >
          <router-link :to="item.path">
            <svg-icon :name="item.icon" class="sidebar-icon " />
            <span class="sidebar-title">
              {{ item.title }}
            </span>
          </router-link>
        </li>
      </ul>
    </div>
    <div class="sidebar-bottom">
      <div class="sidebar-item hover:bg-shallow-gray rounded" :class="[activeMenuName === 'setting' ? 'is-active' : '']">
        <router-link to="/setting">
          <svg-icon name="setting" class="sidebar-icon " />
          <span class="sidebar-title">设置</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-wrap{
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    .sidebar-list{
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .sidebar-item{
        width: 55px;
        height: 55px;
        a{
            width: 100%;
            height:100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
        }
        .sidebar-icon{
            width: 20px;
            height: 20px;
        }
        .sidebar-title{
            font-size: 12px;
            font-weight: 100;
            margin-top:5px;
         }
    }
}

.is-active{
     background: linear-gradient(45deg, #cca2a2, transparent) !important;
     color:#fff;
  svg{
    fill: red
  }
}
</style>
