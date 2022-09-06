<template>
  <Search v-model="searchValue" placeholder="请输入歌曲名" @change="search" />
  <ul class="list">
    <li v-for="item in list" :key="item.id" @click="handleItemClick(item)">
      <div class="item">
        <div class="title">{{ item.title }}</div>
        <div class="artist">
          <span :style="{ color: getColor(item.source), borderColor: getColor(item.source) }" class="source">{{
            getSource(item.source)
          }}</span>
          {{ item.artist }}
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup>
import provider from '../../provider'
import { ref } from 'vue'
import Lyric from 'lrc-file-parser'
import { Search, Toast } from 'vant'
import { useRouter } from 'vue-router'
import qs from 'query-string'

const router = useRouter()
const searchValue = ref('')
const loading = ref(false)
const list = ref([])

const getColor = (source) => {
  return (
    {
      netease: '#d43c33',
      qq: '#31c27c',
      kuwo: '#ffe443',
      migu: '#e40077'
    }[source] || 'gray'
  )
}
const getSource = (source) => {
  return (
    {
      netease: '网易云',
      qq: 'qq',
      kuwo: '酷我',
      migu: '咪咕'
    }[source] || source
  )
}

const search = (e) => {
  const keywords = e.target.value
  console.log(keywords)
  if (!keywords) {
    return Toast('请输入内容')
  }
  loading.value = true
  provider
    .search('allmusic', {
      keywords,
      curpage: 1,
      type: 0
    })
    .success((res) => {
      console.log(res)
      loading.value = false
      list.value = res.result
    })
}

const handleItemClick = (item) => {
  router.push({
    name: 'detail',
    query: item
  })
}
</script>

<style lang="scss" scoped>
@mixin ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: normal;
}
.list {
  li {
    padding: 0 10px;
  }

  .item {
    border-bottom: 0px solid rgba($color: #000000, $alpha: 0.1);
    padding: 6px 0;

    .title {
      @include ellipsis;
      color: #333;
      font-size: 17px;
      line-height: 30px;
    }

    .source {
      color: gray;
      border: solid 1px gray;
      height: 15px;
      padding: 0 2px;
      display: flex;
      align-items: center;
      justify-items: center;
      margin-right: 6px;
    }

    .artist {
      font-size: 12px;
      color: #888;
      display: flex;
    }
  }
}
</style>
