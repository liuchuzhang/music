<template>
  <div class="audio">
    <audio controls :src="src" loop="loop" @timeupdate="onTimeupdate" @play="onPlay" @pause="onPause">
      Your browser does not support the
      <code>audio</code> element.
    </audio>
  </div>
  <section class="lyric">
    <ul class="list" ref="listRef" :style="{ marginTop: `-${marginTop}px` }">
      <li v-for="(item, index) in lrcLines" :class="{ active: index === line }" :key="item.time">
        {{ item.text }}
      </li>
    </ul>
  </section>
</template>

<script setup>
import provider from '../../provider'
import { ref, watch } from 'vue'
import Lyric from 'lrc-file-parser'
import { useRoute } from 'vue-router'

const src = ref('')
const line = ref(1)
const lrcLines = ref([])
const route = useRoute()
const marginTop = ref(0)

const listRef = ref(null)

watch(line, () => {
  const lineNo = line.value
  const parentOffsetTop = document.querySelector('ul').offsetTop
  const currentOffsetTop = listRef.value.children[Math.max(lineNo - 1, 0)].offsetTop
  marginTop.value = currentOffsetTop - 280 - parentOffsetTop
})

const lrc = new Lyric({
  onPlay: function (lineNo, text) {
    line.value = lineNo === 1 ? 0 : lineNo
  },
  onSetLyric: function (lines) {
    lrcLines.value = lines
  }
})

const run = async () => {
  provider.bootstrapTrack(route.query, (r) => {
    src.value = r.url
    console.log(src.value)
    provider.getLyric(route.query.id, route.query.album_id, '', '').success((res) => {
      lrc.setLyric(res.lyric)
    })
  })
}

run()

const onTimeupdate = (e) => {
  lrc.play(e.target.currentTime * 1000)
}
const onPlay = function (e) {
  lrc.play(e.target.currentTime * 1000)
}
const onPause = function () {
  lrc.pause()
}
</script>

<style lang="scss" scoped>
.audio {
  display: flex;
  justify-content: center;
  margin: 20px;
}

.lyric {
  height: 500px;
  overflow: scroll;
}

.list {
  transition: all linear 1s;

  li {
    color: rgba($color: #000000, $alpha: 0.4);
    font-size: 15px;
    text-align: center;
    line-height: 25px;

    &.active {
      color: rgba($color: #000000, $alpha: 0.6);
      font-size: 18px;
    }
  }
}
</style>
