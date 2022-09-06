// eslint-disable-next-line no-unused-vars
// eslint-disable-next-line no-unused-vars
import cookie from 'js-cookie'
import { getParameterByName } from './utils'
import axios from 'axios'

export class bilibili {
  static htmlDecode(value) {
    const parser = new DOMParser()
    return parser.parseFromString(value, 'text/html').body.textContent
  }

  static bi_convert_song(song_info) {
    const track = {
      id: `bitrack_${song_info.id}`,
      title: song_info.title,
      artist: song_info.uname,
      artist_id: `biartist_${song_info.uid}`,
      source: 'bilibili',
      source_url: `https://www.bilibili.com/audio/au${song_info.id}`,
      img_url: song_info.cover,
      // url: song_info.id,
      lyric_url: song_info.lyric
    }
    return track
  }

  static bi_convert_song2(song_info) {
    let imgUrl = song_info.pic
    if (imgUrl.startsWith('//')) {
      imgUrl = `https:${imgUrl}`
    }
    const track = {
      id: `bitrack_v_${song_info.bvid}`,
      title: this.htmlDecode(song_info.title),
      artist: this.htmlDecode(song_info.author),
      artist_id: `biartist_v_${song_info.mid}`,
      source: 'bilibili',
      source_url: `https://www.bilibili.com/${song_info.bvid}`,
      img_url: imgUrl
    }
    return track
  }

  static show_playlist(url) {
    let offset = getParameterByName('offset', url)
    if (offset === undefined) {
      offset = 0
    }
    const page = offset / 20 + 1
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/menu/hit?ps=20&pn=${page}`
    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const { data } = response.data.data
          const result = data.map((item) => ({
            cover_img_url: item.cover,
            title: item.title,
            id: `biplaylist_${item.menuId}`,
            source_url: `https://www.bilibili.com/audio/am${item.menuId}`
          }))
          return fn({
            result
          })
        })
      }
    }
  }

  static bi_get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_').pop()
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/menu/info?sid=${list_id}`
    return {
      success: (fn) => {
        axios.get(target_url).then((response) => {
          const { data } = response.data
          const info = {
            cover_img_url: data.cover,
            title: data.title,
            id: `biplaylist_${list_id}`,
            source_url: `https://www.bilibili.com/audio/am${list_id}`
          }
          const target = `https://www.bilibili.com/audio/music-service-c/web/song/of-menu?pn=1&ps=100&sid=${list_id}`
          axios.get(target).then((res) => {
            const tracks = res.data.data.data.map((item) => this.bi_convert_song(item))
            return fn({
              info,
              tracks
            })
          })
        })
      }
    }
  }

  // eslint-disable-next-line no-unused-vars
  static bi_album(url) {
    return {
      success: (fn) =>
        fn({
          tracks: [],
          info: {}
        })
      // bilibili havn't album
      // const album_id = getParameterByName('list_id', url).split('_').pop();
      // const target_url = '';
      // axios.get(target_url).then((response) => {
      //   const data = response.data;
      //   const info = {};
      //   const tracks = [];
      //   return fn({
      //     tracks,
      //     info,
      //   });
      // });
    }
  }

  static bi_artist(url) {
    const artist_id = getParameterByName('list_id', url).split('_').pop()

    return {
      success: (fn) => {
        let target_url = `/api/apibilibili/x/space/acc/info?mid=${artist_id}&jsonp=jsonp`
        axios.get(target_url).then((response) => {
          const info = {
            cover_img_url: response.data.data.face,
            title: response.data.data.name,
            id: `biartist_${artist_id}`,
            source_url: `https://space.bilibili.com/${artist_id}/#/audio`
          }
          if (getParameterByName('list_id', url).split('_').length === 3) {
            target_url = `/api/apibilibili/x/space/arc/search?mid=${artist_id}&pn=1&ps=25&order=click&index=1&jsonp=jsonp`
            return axios.get(target_url).then((res) => {
              const tracks = res.data.data.list.vlist.map((item) => this.bi_convert_song2(item))
              return fn({
                tracks,
                info
              })
            })
          }
          target_url = `/api/apibilibili/audio/music-service-c/web/song/upper?pn=1&ps=0&order=2&uid=${artist_id}`
          return axios.get(target_url).then((res) => {
            const tracks = res.data.data.data.map((item) => this.bi_convert_song(item))
            return fn({
              tracks,
              info
            })
          })
        })
      }
    }
  }

  static parse_url(url) {
    let result
    const match = /\/\/www.bilibili.com\/audio\/am([0-9]+)/.exec(url)
    if (match != null) {
      const playlist_id = match[1]
      result = {
        type: 'playlist',
        id: `biplaylist_${playlist_id}`
      }
    }
    return {
      success: (fn) => {
        fn(result)
      }
    }
  }

  static bootstrap_track(track, success, failure) {
    const trackId = track.id
    if (trackId.startsWith('bitrack_v_')) {
      const sound = {}
      const bvid = track.id.slice('bitrack_v_'.length)
      const target_url = `/api/apibilibili/x/web-interface/view?bvid=${bvid}`

      return axios.get(target_url).then((response) => {
        const { cid } = response.data.data.pages[0]
        const target_url2 = `http://api.bilibili.com/x/player/playurl?fnval=16&bvid=${bvid}&cid=${cid}`
        axios.get(target_url2).then((response2) => {
          if (response2.data.data.dash.audio.length > 0) {
            const url = response2.data.data.dash.audio[0].baseUrl
            sound.url = url
            sound.platform = 'bilibili'
            success(sound)
          } else {
            failure(sound)
          }
        })
      })
    }
    const sound = {}
    const song_id = track.id.slice('bitrack_'.length)
    const target_url = `https://www.bilibili.com/audio/music-service-c/web/url?sid=${song_id}`
    return axios.get(target_url).then((response) => {
      const { data } = response
      if (data.code === 0) {
        ;[sound.url] = data.data.cdns
        sound.platform = 'bilibili'

        success(sound)
      } else {
        failure(sound)
      }
    })
  }

  static search(url) {
    return {
      success: (fn) => {
        const keyword = getParameterByName('keywords', url)
        const curpage = getParameterByName('curpage', url)

        const target_url = `/api/apibilibili/x/web-interface/search/type?__refresh__=true&_extra=&context=&page=${curpage}&page_size=42&platform=pc&highlight=1&single_column=0&keyword=${encodeURIComponent(
          keyword
        )}&category_id=&search_type=video&dynamic_offset=0&preload=true&com2co=true`

        const domain = `/api/apibilibili`
        const cookieName = 'buvid3'
        const expire = (new Date().getTime() + 1e3 * 60 * 60 * 24 * 365 * 100) / 1000

        // COOKIE
        axios.get(target_url).then((response) => {
          const result = response.data.data.result.map((song) => this.bi_convert_song2(song))
          const total = response.data.data.numResults
          return fn({
            result,
            total
          })
        })
      }
    }
  }

  static lyric() {
    return {
      success: (fn) => {
        fn({
          lyric: ''
        })
      }
    }
  }

  static get_playlist(url) {
    const list_id = getParameterByName('list_id', url).split('_')[0]
    switch (list_id) {
      case 'biplaylist':
        return this.bi_get_playlist(url)
      case 'bialbum':
        return this.bi_album(url)
      case 'biartist':
        return this.bi_artist(url)
      default:
        return null
    }
  }

  static get_playlist_filters() {
    return {
      success: (fn) => fn({ recommend: [], all: [] })
    }
  }

  static get_user() {
    return {
      success: (fn) => fn({ status: 'fail', data: {} })
    }
  }

  static get_login_url() {
    return `https://www.bilibili.com`
  }

  static logout() {}

  // return {
  //   show_playlist: bi_show_playlist,
  //   get_playlist_filters,
  //   get_playlist,
  //   parse_url: bi_parse_url,
  //   bootstrap_track: bi_bootstrap_track,
  //   search: bi_search,
  //   lyric: bi_lyric,
  //   get_user: bi_get_user,
  //   get_login_url: bi_get_login_url,
  //   logout: bi_logout,
  // };
}
