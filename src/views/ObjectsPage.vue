<template>
  <div class="objects-page">
    <transition name="bg-fade">
      <DynamicWave v-if="filteredObjects.length === 0"></DynamicWave>
    </transition>
    <!-- Profile List -->
    <section class="cards-container">
      <ObjectProfile
        v-for="obj in filteredObjects" 
        :key="obj.id" 
        :obj="obj"
        :mode="mode"
        :is-pinned="isPinned(obj.id)"
        :all-tags="allTags"
        @view="viewDetail"
        @toggle-pin="togglePin"
        @edit="openEditor"
        @delete="handleDelete"
      />
    </section>

    <!-- footer -->
    <PageFooter/>

    <!-- Floating tools at the corner -->
    <div class="corner-stack">

      <!-- Back to Top -->
      <BackTop/>

      <!-- fixed tags -->
      <div v-if="selectedTags.length > 0" class="selected-tags-stack">
        <transition-group name="list-vertical">
          <span v-for="tid in selectedTags" :key="tid" class="tag-pill active" @click="toggleTag(tid)">
            {{ getTagName(tid) }} <span class="close-icon">×</span>
          </span>
        </transition-group>

        <!-- Limit Toast Notification -->
        <transition name="fade">
          <div v-if="showLimitToast" class="limit-toast">
            <span>Maximum 7 tags allowed</span>
          </div>
        </transition>
      </div>

      <!-- All tags box -->
      <div 
        class="tags-drawer-wrapper"
        @mouseenter="showAllTags = true"
        @mouseleave="showAllTags = false"
      >
        <div class="blur-glow-bg tags-glow" :class="{ visible: showAllTags }"></div>

        <div class="tags-drawer-content" :class="{ open: showAllTags }">
          <!-- 收缩状态: # 图标 -->
          <div class="hash-icon-wrapper" :class="{ hidden: showAllTags }">
            <svg class="hash-icon" viewBox="0 0 24 24">
              <line x1="10" y1="3" x2="8" y2="21" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
              <line x1="16" y1="3" x2="14" y2="21" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
              <line x1="4.4" y1="9" x2="20.4" y2="9" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
              <line x1="3.6" y1="15" x2="19.6" y2="15" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
            </svg>
          </div>

          <!-- 展开状态: 列表内容 -->
          <div class="drawer-inner" :class="{ visible: showAllTags }">
            <div class="drawer-scroll-area">
              <div class="tags-flex-grid">
                <div v-for="tag in unselectedTags" :key="tag.id" class="tag-pill normal" @click="toggleTag(tag.id)">
                  {{ tag.name }} <span class="count">{{ tag.count }}</span>
                  <div v-if="mode === 'admin'" class="tag-mini-actions" @click.stop>
                    <span @click.stop="renameTag(tag)" class="mini-btn">✎</span>
                    <span @click.stop="deleteTag(tag.id)" class="mini-btn danger">×</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="drawer-bottom-bar">
              <span v-if="selectedTags.length === 0">All Tags ({{ unselectedTags.length }})</span>
              <span v-else class="clear-btn" @click.stop="selectedTags = []">
                Clear Selection
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="mode === 'admin'" class="create-wrapper">
          <div class="blur-glow-bg create-glow"></div>
          <button class="create-add" @click="handleCreate" title="New Object">
            <svg viewBox="0 0 24 24" class="plus-svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </button>
      </div>

      <!-- Search -->
      <div class="search-wrapper" 
           @mouseenter="isHoveringSearch = true"
           @mouseleave="isHoveringSearch = false">
        
        <div class="blur-glow-bg search-glow" :class="{ visible: isSearchExpanded }"></div>
        
        <!-- Main Interactive Box -->
        <div class="search-interactive-box" 
             :class="{ 
               'expanded-width': isSearchExpanded, 
               'expanded-list': showSearchResults 
             }">
          
          <!-- Input Area (Bottom) -->
          <div class="search-input-area">
            <input 
              v-model="searchQuery" 
              placeholder="Search..." 
              ref="searchInput"
              :class="{ visible: isSearchExpanded }"
            />
            <div class="search-icon-wrapper" @click="clearSearch">
              <span v-if="searchQuery" class="clear-x">×</span>
              <svg v-else viewBox="-1 12 16 18" class="mag-glass"><path d="M14.298,27.202l-3.87-3.87c0.701-0.929,1.122-2.081,1.122-3.332c0-3.06-2.489-5.55-5.55-5.55c-3.06,0-5.55,2.49-5.55,5.55 c0,3.061,2.49,5.55,5.55,5.55c1.251,0,2.403-0.421,3.332-1.122l3.87,3.87c0.151,0.151,0.35,0.228,0.548,0.228 s0.396-0.076,0.548-0.228C14.601,27.995,14.601,27.505,14.298,27.202z M1.55,20c0-2.454,1.997-4.45,4.45-4.45 c2.454,0,4.45,1.997,4.45,4.45S8.454,24.45,6,24.45C3.546,24.45,1.55,22.454,1.55,20z"/></svg>
            </div>
          </div>

          <!-- Matching Tags List (Top - Expands Upwards) -->
          <div class="search-results-list">
            <div class="results-inner-padding">
              <div v-if="tagSuggestions.length > 0" class="tags-flex-grid">
                <div v-for="tag in tagSuggestions" :key="tag.id" class="tag-pill normal" @click="toggleTag(tag.id)">
                  {{ tag.name }}
                </div>
              </div>
              <div v-else class="no-results">No matching tags</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Object Edit Pop-up -->
    <!-- [FIX] Added @refresh-assets handler -->
    <ObjectEdit
      v-if="editingObj"
      v-model="editingObj"
      :assets="projectAssets"
      :all-tags="allTags"
      @close="editingObj = null"
      @save="saveConfig"
      @upload="handleUploadFiles"
      @create-tag="handleCreateNewTag"
      @refresh-assets="fetchAssets" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue' // 修改: 添加 watch
import { useRouter, useRoute } from 'vue-router'     // 修改: 添加 useRoute
import ObjectProfile from '../components/ObjectProfile.vue' 
import ObjectEdit from '../components/ObjectEdit.vue'
import PageFooter from '../components/PageFooter.vue'
import { NAV_HEIGHT } from '../config/constants'
import BackTop from '../components/BackTop.vue'
import DynamicWave from '../components/DynamicWave.vue' // 修改: 补充导入组件

const props = defineProps(['type', 'mode'])
const router = useRouter()
const route = useRoute() // 新增: 获取当前路由对象

const allObjects = ref([])
const allTags = ref([])
const pinnedIds = ref([])
const searchQuery = ref('')
const selectedTags = ref([])
const showAllTags = ref(false)
const editingObj = ref(null)
const projectAssets = ref([])
const showLimitToast = ref(false)

// Search state
const isHoveringSearch = ref(false)
const searchInput = ref(null)

// --- Auth Helper ---
const authFetch = (url, options = {}) => {
  const token = localStorage.getItem('authToken')
  const headers = { 
    ...options.headers,
    'Authorization': `Bearer ${token}` 
  }
  return fetch(url, { ...options, headers })
}

// 1. Is Capsule? (Width expansion)
// Triggered if user types anything OR hovers
const isSearchExpanded = computed(() => {
  return isHoveringSearch.value || searchQuery.value.length > 0
})

// 2. Is List? (Height expansion)
// Triggered ONLY if there is a query AND hover AND matches found
const showSearchResults = computed(() => {
  return isHoveringSearch.value && searchQuery.value.length > 0 && tagSuggestions.value.length > 0
})

// --- Filter Logic ---
const filteredObjects = computed(() => {
  let list = allObjects.value.filter(obj => {
    if (props.type !== 'all' && obj.type !== props.type) return false
    const q = searchQuery.value.toLowerCase()
    const matchText = obj.name.toLowerCase().includes(q) || obj.description.toLowerCase().includes(q)
    const matchTags = selectedTags.value.every(tid => obj.tags.includes(tid))
    return matchText && matchTags
  })

  return list.sort((a, b) => {
    const isAPinned = pinnedIds.value.includes(a.id)
    const isBPinned = pinnedIds.value.includes(b.id)
    if (isAPinned && !isBPinned) return -1
    if (!isAPinned && isBPinned) return 1
    return new Date(b.dateModified) - new Date(a.dateModified)
  })
})

const unselectedTags = computed(() => allTags.value.filter(t => !selectedTags.value.includes(t.id)))

const tagSuggestions = computed(() => {
  if (!searchQuery.value) return []
  return allTags.value.filter(t => t.name.toLowerCase().includes(searchQuery.value.toLowerCase()) && !selectedTags.value.includes(t.id))
})

// --- Methods ---
const init = async () => {
  const [oRes, tRes, pRes] = await Promise.all([
    fetch('/api/objects/list'), 
    fetch('/api/tags/list'),
    fetch('/api/pinned/list')
  ])
  allObjects.value = await oRes.json()
  allTags.value = await tRes.json()
  pinnedIds.value = await pRes.json()

  // 数据加载完成后，应用 URL 中的 tag 参数
  applyUrlParams()
}

// 新增: 根据 URL 参数应用筛选
const applyUrlParams = () => {
  const tagParam = route.query.tag
  if (tagParam && allTags.value.length > 0) {
    // 查找对应名称的 Tag (忽略大小写)
    const targetTag = allTags.value.find(t => t.name.toLowerCase() === tagParam.toLowerCase())
    if (targetTag) {
      selectedTags.value = [targetTag.id]
    }
  } else {
    // 如果 URL 中没有 tag 参数 (例如点击了 'Explore All Projects')，则清空筛选
    selectedTags.value = []
  }
}

// 新增: 监听路由参数变化 (处理导航栏点击跳转)
watch(() => route.query.tag, () => {
  applyUrlParams()
})

onMounted(init)

const clearSearch = () => {
  if (searchQuery.value) {
    searchQuery.value = ''
    searchInput.value?.focus()
  }
}

const toggleTag = (id) => {
  const index = selectedTags.value.indexOf(id)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    // Limit to 7 tags
    if (selectedTags.value.length >= 7) {
      showLimitToast.value = true
      setTimeout(() => showLimitToast.value = false, 2500)
      return
    }
    selectedTags.value.unshift(id)
  }
  searchQuery.value = ''
}

const getTagName = (id) => allTags.value.find(t => t.id === id)?.name || id
const isPinned = (id) => pinnedIds.value.includes(id)

const togglePin = async (id) => {
  let newPinned = [...pinnedIds.value]
  if (newPinned.includes(id)) newPinned = newPinned.filter(pid => pid !== id)
  else newPinned.push(id)
  
  // 使用 authFetch
  const res = await authFetch('/api/pinned/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPinned)
  })
  if ((await res.json()).success) pinnedIds.value = newPinned
}

// [FIX] Extract fetch logic to reusable function
const fetchAssets = async () => {
  if (!editingObj.value) return
  const res = await fetch(`/api/objects/${editingObj.value.id}/assets`)
  projectAssets.value = await res.json()
}

// CRUD
const handleCreate = async () => {
  // 使用 authFetch
  const res = await authFetch('/api/objects/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
  const result = await res.json()
  if (result.success) {
    await init()
    openEditor(result.data)
  }
}

const openEditor = async (obj) => {
  // [FIX] Prevent 404: Clear assets before showing the modal
  projectAssets.value = [] 
  
  editingObj.value = JSON.parse(JSON.stringify(obj))
  if (!editingObj.value.tags) editingObj.value.tags = []
  
  // Now fetch the correct assets
  await fetchAssets()
}

const saveConfig = async (objData) => {
  // 使用 authFetch
  await authFetch('/api/objects/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(objData) })
  editingObj.value = null
  init()
}

const handleDelete = async (id) => {
  if (!confirm("Are you sure?")) return
  // 使用 authFetch
  const res = await authFetch('/api/objects/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  if ((await res.json()).success) init()
}

const renameTag = async (tag) => {
  const newName = prompt("Rename:", tag.name)
  if (newName && newName !== tag.name) {
    // 使用 authFetch
    await authFetch('/api/tags/modify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tag.id, newName }) })
    init()
  }
}
const deleteTag = async (id) => {
  if (!confirm("Delete tag?")) return
  // 使用 authFetch
  await authFetch('/api/tags/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  init()
}

const handleCreateNewTag = async (name, callback) => {
  // 使用 authFetch
  const res = await authFetch('/api/tags/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
  const result = await res.json()
  if (result.success) { 
    allTags.value.push(result.data)
    callback(result.data.id) // Call callback to update local state in child
  }
}

const handleUploadFiles = async (files) => {
  const formData = new FormData()
  for (let file of files) formData.append('files', file)
  // 使用 authFetch
  await authFetch(`/api/objects/${editingObj.value.id}/upload`, { method: 'POST', body: formData })
  
  // [FIX] Use the shared fetch function
  await fetchAssets()
}

const viewDetail = (id) => router.push(`/object/${id}`)
</script>

<style scoped>
.bg-fade-enter-active,
.bg-fade-leave-active {
    transition: opacity 1s ease;
}

.bg-fade-enter-from,
.bg-fade-leave-to {
    opacity: 0;
}
/* --- Layout --- */
.objects-page {
  display: flex;
  flex-direction: column;
  padding-top: 0;
  min-height: calc(100vh - v-bind(NAV_HEIGHT));
  background: #f9f9f9;
  padding-bottom: 0;
}
.cards-container { 
  flex: 1; 
  display: grid; 
  /* 修改: 减小最小宽度 (350px -> 260px)，让电脑端排列更密 */
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); 
  gap: 30px; 
  padding: 40px; 
  align-content: flex-start; 
}

/* 新增: 针对手机屏幕的优化 (两列显示) */
@media (max-width: 768px) {
  .cards-container {
    padding: 12px; /* 减小外边距 */
    gap: 12px;     /* 减小卡片间距 */
    /* 允许卡片更窄，以在手机上放下两列 (例如 iPhone 宽度约 375px-390px) */
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

/* --- Corner Stack --- */
.corner-stack { position: fixed; bottom: 40px; right: 40px; z-index: 1000; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; pointer-events: none; }
.corner-stack > * { pointer-events: auto; }

.blur-glow-bg {
  position: absolute; pointer-events: none; z-index: -1;
  background: rgba(255, 255, 255, 0.4); 
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  mask-image: radial-gradient(closest-side, black 40%, transparent 100%);
  -webkit-mask-image: radial-gradient(closest-side, black 40%, transparent 100%);
  opacity: 0; transition: opacity 0.4s;
}
.blur-glow-bg.visible { opacity: 1; }
.search-glow { top: 50%; left: 50%; width: 350px; height: 100px; transform: translate(-50%, -50%); }
.tags-glow { top: auto; bottom: 0; right: 0; width: 350px; height: 350px; }
.create-glow { top: 50%; left: 50%; width: 80px; height: 80px; transform: translate(-50%, -50%); mask-image: radial-gradient(circle, black 30%, transparent 70%); }

/* Limit Toast */
.limit-toast {
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  color: white; padding: 8px 16px; border-radius: 20px;
  font-size: 12px; font-weight: 500;
  pointer-events: none; margin-bottom: 5px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.2);
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Selected Tags */
.selected-tags-stack {
  display: flex; flex-direction: column-reverse;
  gap: 8px; align-items: flex-end;
  padding: 20px; margin-right: -20px; margin-bottom: -20px;
}

.tag-pill { cursor: pointer; font-size: 12px; padding: 6px 14px; border-radius: 20px; transition: 0.2s; white-space: nowrap; user-select: none; }
.tag-pill.active { 
  background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  color: #1d1d1f; border: 1px solid rgba(255,255,255,0.4);
  display: flex; align-items: center; gap: 8px;
}
.tag-pill.active:hover { background: rgba(255, 255, 255, 0.6); }

.close-icon { font-style: normal; font-size: 16px; line-height: 1; color: #888; transition: color 0.2s; }
.tag-pill.active:hover .close-icon { color: #000; }

/* --- All Tags Drawer --- */
.tags-drawer-wrapper { position: relative; display: flex; flex-direction: column; align-items: flex-end; }
.tags-drawer-content {
  width: 50px; height: 50px; border-radius: 25px;
  background: rgba(255, 255, 255, 0.4); 
  backdrop-filter: blur(16px);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255,255,255,0.4);
  display: flex; flex-direction: column; position: relative; overflow: hidden;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); transform-origin: bottom right;
}
.tags-drawer-content.open { width: 320px; height: 320px; }
.hash-icon-wrapper { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; }
.hash-icon { width: 22px; height: 22px; color: #555; }
.hash-icon-wrapper.hidden { opacity: 0; pointer-events: none; }
.drawer-inner { display: flex; flex-direction: column; height: 100%; width: 100%; opacity: 0; transition: opacity 0.2s; }
.drawer-inner.visible { opacity: 1; transition-delay: 0.1s; }
.drawer-bottom-bar { padding: 10px 16px; font-size: 11px; color: #888; border-top: 1px solid rgba(0,0,0,0.04); text-transform: uppercase; letter-spacing: 0.5px; margin-top: auto; flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; }
.clear-btn { color: #ff3b30; cursor: pointer; transition: 0.2s; }
.clear-btn:hover { opacity: 0.7; }
.drawer-scroll-area { flex: 1; overflow-y: auto; padding: 12px; min-height: 0; }
.tags-flex-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-pill.normal { background: rgba(0, 0, 0, 0.05); color: #333; display: inline-flex; align-items: center; padding: 5px 12px; }
.tag-pill.normal:hover { background: #fff; border-color: rgba(0,0,0,0.1); box-shadow: 0 0 20px rgba(0, 0, 0, 0.1); }
.tag-pill .count { font-size: 9px; opacity: 0.4; margin-left: 4px; vertical-align: top; }
.tag-mini-actions { margin-left: 6px; display: flex; gap: 4px; opacity: 0.4; transition: 0.2s; }
.tag-pill.normal:hover .tag-mini-actions { opacity: 1; }
.mini-btn { cursor: pointer; padding: 0 2px; }
.mini-btn.danger:hover { color: red; }

/* --- Search Bar (Refactored) --- */
.search-wrapper { position: relative; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end; }

.search-interactive-box {
  background: rgba(255, 255, 255, 0.4); 
  backdrop-filter: blur(16px);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 25px; /* Circle State */
  width: 50px; /* Circle State */
  height: auto; /* Allow growth */
  max-height: 50px; /* Circle State limit */
  display: flex; flex-direction: column-reverse; /* Key to expanding upwards */
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), 
              max-height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), 
              background 0.2s, 
              border-radius 0.4s;
  position: relative; z-index: 2;
}

/* State 2: Capsule (Expanded Width) */
.search-interactive-box.expanded-width {
  width: 280px;
}

/* State 3: Square/List (Expanded Height) */
.search-interactive-box.expanded-list {
  max-height: 300px; /* Allow height to grow */
}

/* Input Area (Always at bottom) */
.search-input-area {
  height: 50px; flex-shrink: 0; /* Fixed height footer */
  display: flex; align-items: center;
  position: relative; width: 100%;
}

.search-input-area input {
  flex: 1; height: 100%; border: none; background: transparent; outline: none;
  padding-left: 20px; padding-right: 50px; font-size: 15px; width: 100%;
  opacity: 0; transition: opacity 0.3s; pointer-events: none; 
}
.search-input-area input.visible { opacity: 1; pointer-events: auto; }

.search-icon-wrapper {
  width: 50px; height: 50px; position: absolute; right: 0; bottom: 0; 
  display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 3;
}
.mag-glass { width: 20px; height: 20px; fill: #555; }
.clear-x { font-size: 22px; color: #666; font-weight: 300; line-height: 1; }

/* Results List (Top part) */
.search-results-list {
  width: 100%;
  overflow-y: auto;
  /* Scrollbar hidden */
  scrollbar-width: none; -ms-overflow-style: none;
}
.search-results-list::-webkit-scrollbar { display: none; }

.results-inner-padding { padding: 12px; padding-bottom: 0; }
.no-results { font-size: 12px; color: #888; text-align: center; padding: 10px; }

/* --- Create --- */
.create-wrapper { position: relative; }
.create-add {
  width: 50px; height: 50px; border-radius: 50%; border: none;
  background: rgba(0, 255, 0, 0.5); 
  backdrop-filter: blur(16px);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255,255,255,0.4);
  color: white; 
  position: relative; z-index: 2;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: 0.2s ease; padding: 0;
}
.plus-svg { width: 24px; height: 24px; fill: white; }
.create-add:hover { transform: scale(1.05); background: #00cc55; }

</style>