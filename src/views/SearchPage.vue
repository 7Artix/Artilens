<template>
    <div class="search-page">
        <transition name="bg-fade">
            <DynamicWave v-if="!hasActiveFilter"></DynamicWave>
        </transition>
        
        <div class="fixed-header-wrapper">
            
            <!-- Top Row -->
            <div class="header-top-row">
                
                <!-- SEARCH COMPONENT -->
                <div 
                    class="search-component-wrapper"
                    :class="{ 
                        'faded-out': showAllTags,
                        'expanded': showSearchResults 
                    }"
                    @mouseenter="isHoveringSearch = true"
                    @mouseleave="isHoveringSearch = false"
                >
                    <!-- Main Content -->
                    <div class="search-content-box">
                        <div class="search-input-capsule">
                            <div class="search-icon-mask"
                                :style="{ maskImage: `url(/api/static/site/magnifyingglass.svg)`, WebkitMaskImage: `url(/api/static/site/magnifyingglass.svg)` }">
                            </div>
                            <input 
                                v-model="searchQuery" 
                                placeholder="Search for title, description and tags..." 
                                ref="searchInput"
                                @focus="isInputFocused = true"
                                @blur="handleInputBlur"
                            />
                            
                            <transition name="fade">
                                <div v-if="searchQuery" class="clear-icon-wrapper" @click="searchQuery = ''">
                                    <div class="x-icon-mask"
                                        :style="{ maskImage: `url(/api/static/site/xmark.svg)`, WebkitMaskImage: `url(/api/static/site/xmark.svg)` }">
                                    </div>
                                </div>
                            </transition>
                        </div>

                        <!-- List Container (Animated Height) -->
                        <div class="search-list-container">
                             <div class="dropdown-inner">
                                <div v-if="tagSuggestions.length > 0" class="tags-flex-grid">
                                    <div v-for="tag in tagSuggestions" :key="tag.id" class="tag-pill normal" @mousedown.prevent="toggleTag(tag.id)">
                                        {{ tag.name }}
                                    </div>
                                </div>
                                <div v-else class="no-results">No matching tags</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAG DRAWER COMPONENT -->
                <div 
                    class="tag-drawer-wrapper"
                    :class="{ 'expanded': showAllTags }"
                    @mouseenter="showAllTags = true"
                    @mouseleave="showAllTags = false"
                >
                    <div class="tag-content-box">
                         <!-- Closed Icon -->
                        <div class="hash-icon-wrapper" :class="{ hidden: showAllTags }">
                            <!-- <svg class="hash-icon" viewBox="0 0 24 24">
                                <line x1="10" y1="3" x2="8" y2="21" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                                <line x1="16" y1="3" x2="14" y2="21" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                                <line x1="4.4" y1="9" x2="20.4" y2="9" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                                <line x1="3.6" y1="15" x2="19.6" y2="15" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                            </svg> -->
                            <div class="hash-icon-mask"
                                :style="{ maskImage: `url(/api/static/site/number.svg)`, WebkitMaskImage: `url(/api/static/site/number.svg)` }">
                            </div>
                        </div>

                        <!-- Open Panel -->
                        <div class="tag-panel-content" :class="{ visible: showAllTags }">
                            <div class="panel-scroll">
                                <div class="tags-flex-grid">
                                    <div v-for="tag in unselectedTags" :key="tag.id" class="tag-pill normal" @click="toggleTag(tag.id)">
                                        {{ tag.name }} <span class="count">{{ tag.count }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="panel-footer">
                                <span v-if="selectedTags.length > 0" class="clear-btn" @click.stop="selectedTags = []">Clear Selection</span>
                                <span v-else>All Tags</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Bottom Row: Selected Tags -->
            <div v-if="selectedTags.length > 0" class="header-bottom-row">
                <transition-group name="list-fade">
                    <span v-for="tid in selectedTags" :key="tid" class="tag-pill active fixed-item" @click="toggleTag(tid)">
                        {{ getTagName(tid) }} <span class="close-icon">×</span>
                    </span>
                </transition-group>
            </div>

        </div>

        <!-- Results Body -->
        <div class="results-body">
            <div v-if="!hasActiveFilter" class="empty-state">
            </div>
            <div v-else-if="filteredObjects.length === 0" class="empty-state">
                <h2>No results found</h2>
            </div>

            <section v-else class="cards-container">
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
        </div>

        <div class="corner-stack"><BackTop/></div>
        
        <!-- Edit Modal -->
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

        <PageFooter/>

    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ObjectProfile from '../components/ObjectProfile.vue' 
import ObjectEdit from '../components/ObjectEdit.vue'
import PageFooter from '../components/PageFooter.vue'
import { NAV_HEIGHT } from '../config/constants'
import BackTop from '../components/BackTop.vue'
import DynamicWave from '../components/DynamicWave.vue'

const props = defineProps(['mode']) 
const router = useRouter()
const route = useRoute()

// Data
const allObjects = ref([])
const allTags = ref([])
const pinnedIds = ref([])
const searchQuery = ref('')
const selectedTags = ref([])
const showAllTags = ref(false)
const isInputFocused = ref(false)
const isHoveringSearch = ref(false)
const editingObj = ref(null)
const projectAssets = ref([])

// Logic
const showSearchResults = computed(() => {
    const hasQuery = searchQuery.value.length > 0
    const hasMatches = tagSuggestions.value.length > 0
    const isActive = isHoveringSearch.value
    return hasQuery && hasMatches && isActive
})

const tagSuggestions = computed(() => {
    if (!searchQuery.value) return []
    return allTags.value.filter(t => t.name.toLowerCase().includes(searchQuery.value.toLowerCase()) && !selectedTags.value.includes(t.id))
})

const unselectedTags = computed(() => allTags.value.filter(t => !selectedTags.value.includes(t.id)))
const getTagName = (id) => allTags.value.find(t => t.id === id)?.name || id
const isPinned = (id) => pinnedIds.value.includes(id)

const hasActiveFilter = computed(() => searchQuery.value.length > 0 || selectedTags.value.length > 0)

const filteredObjects = computed(() => {
    if (!hasActiveFilter.value) return []
    return allObjects.value.filter(obj => {
        const q = searchQuery.value.toLowerCase()
        const matchText = !q || obj.name.toLowerCase().includes(q) || obj.description.toLowerCase().includes(q)
        const matchTags = selectedTags.value.every(tid => obj.tags.includes(tid))
        return matchText && matchTags
    }).sort((a, b) => new Date(b.dateModified) - new Date(a.dateModified))
})

const init = async () => {
    const [oRes, tRes, pRes] = await Promise.all([
        fetch('/api/objects/list'), 
        fetch('/api/tags/list'),
        fetch('/api/pinned/list')
    ])
    allObjects.value = await oRes.json()
    allTags.value = await tRes.json()
    pinnedIds.value = await pRes.json()

    applyUrlParams()
}

const applyUrlParams = () => {
    const tagParam = route.query.tag
    if (tagParam && allTags.value.length > 0) {
        const targetTag = allTags.value.find(t => 
            t.name.toLowerCase() === tagParam.toLowerCase() || 
            t.id === tagParam
        )
        if (targetTag) {
            selectedTags.value = [targetTag.id]
        }
    } else if (!tagParam) {
        selectedTags.value = []
    }

    if (route.query.q) {
        searchQuery.value = route.query.q
    } else {
        searchQuery.value = ''
    }
}

watch(() => route.query, () => {
    applyUrlParams()
})

onMounted(init)

const handleInputBlur = () => { setTimeout(() => isInputFocused.value = false, 200) }

const toggleTag = (id) => {
    const index = selectedTags.value.indexOf(id)
    if (index > -1) selectedTags.value.splice(index, 1)
    else selectedTags.value.unshift(id)
    searchQuery.value = ''
}

// CRUD
const fetchAssets = async () => {
    if (!editingObj.value) return
    const res = await fetch(`/api/objects/${editingObj.value.id}/assets`)
    projectAssets.value = await res.json()
}
const openEditor = async (obj) => {
    projectAssets.value = []
    editingObj.value = JSON.parse(JSON.stringify(obj))
    if (!editingObj.value.tags) editingObj.value.tags = []
    await fetchAssets()
}
const saveConfig = async (objData) => {
    await fetch('/api/objects/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(objData) })
    editingObj.value = null; init()
}
const handleUploadFiles = async (files) => {
    const formData = new FormData()
    for (let file of files) formData.append('files', file)
    await fetch(`/api/objects/${editingObj.value.id}/upload`, { method: 'POST', body: formData })
    await fetchAssets()
}
const handleCreateNewTag = async (name, cb) => {
    const res = await fetch('/api/tags/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    const result = await res.json()
    if (result.success) { allTags.value.push(result.data); cb(result.data.id); }
}
const togglePin = async (id) => {}
const handleDelete = async (id) => {}
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

.search-page { 
    min-height: calc(100vh - v-bind(NAV_HEIGHT));
    display: flex;
    flex-direction: column;
    background: #f9f9f9;
    padding-top: 80px;
    box-sizing: border-box;
}

/* --- Fixed Header --- */
.fixed-header-wrapper {
    position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
    width: 600px; z-index: 1000;
    display: flex; flex-direction: column; gap: 15px;
}

.header-top-row { position: relative; height: 50px; width: 100%; }

/* --- 1. SEARCH COMPONENT --- */
.search-component-wrapper {
    position: absolute; left: 0; right: 60px;
    /* Base state */
    height: 50px;
    border-radius: 25px;
    /* Visuals: Glassmorphism (ObjectsPage style) */
    background: rgba(255, 255, 255, 0.4); 
    backdrop-filter: blur(16px);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255,255,255,0.4);
    /* Animation Config */
    transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1), 
                            border-radius 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                            opacity 0.2s ease, transform 0.2s ease;
    z-index: 10;
    overflow: hidden;
}

.search-component-wrapper.expanded {
    height: 300px;
}
.search-component-wrapper.faded-out {
    opacity: 0; pointer-events: none; transform: scale(0.98);
}

.search-content-box {
    width: 100%; height: 100%; display: flex; flex-direction: column;
}

.search-input-capsule {
    height: 50px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 0 15px;
}
.search-list-container {
    flex: 1; overflow-y: auto; 
    opacity: 0; transition: opacity 0.3s ease 0.1s;
}
.search-component-wrapper.expanded .search-list-container { opacity: 1; }

/* 修改: 优化 input 样式 */
.search-input-capsule input { 
    flex: 1; 
    border: none; 
    outline: none; 
    font-size: 16px; 
    background: transparent; 
    color: #1d1d1f; 
    height: 100%; /* 撑满高度 */
    line-height: normal; /* 让浏览器自动处理垂直对齐 */
    transform: translateY(-2px); /* 微调：向上移动 1px 以修正视觉重心 */
}

.dropdown-inner { padding: 15px; border-top: 1px solid rgba(0,0,0,0.05); }

/* --- 2. TAG DRAWER --- */
.tag-drawer-wrapper {
    position: absolute; right: 0; top: 0;
    width: 50px; height: 50px; border-radius: 25px;
    /* Visuals */
    background: rgba(255, 255, 255, 0.4); 
    backdrop-filter: blur(16px);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255,255,255,0.4);
    /* Animation */
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 20;
    overflow: hidden;
}
.tag-drawer-wrapper.expanded {
    width: 100%; height: 320px; border-radius: 20px;
}

.tag-content-box {
    width: 100%; height: 100%; position: relative;
}

.hash-icon-wrapper {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    transition: opacity 0.1s;
    overflow: visible;
}
.hash-icon-wrapper.hidden { opacity: 0; pointer-events: none; }


.tag-panel-content {
    opacity: 0; transition: opacity 0.3s ease 0.1s;
    height: 100%; display: flex; flex-direction: column;
}
.tag-panel-content.visible { opacity: 1; }
.panel-scroll { flex: 1; overflow-y: auto; padding: 20px; }
.panel-footer { padding: 10px 20px; border-top: 1px solid rgba(0,0,0,0.05); text-align: right; color: #999; font-size: 11px; text-transform: uppercase; }

/* --- Shared --- */
.header-bottom-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; width: 100%; }
.fixed-item { 
    background: rgba(255,255,255,0.8); 
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.4); 
    box-shadow: 0 4px 10px rgba(0,0,0,0.08); 
}

.tags-flex-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-pill { font-size: 12px; padding: 6px 14px; border-radius: 20px; cursor: pointer; user-select: none; transition: 0.2s; }
.tag-pill.normal { background: rgba(0, 0, 0, 0.05); color: #333; }
.tag-pill.normal:hover { background: rgba(0,0,0,0.1); }
.tag-pill.active {
    background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    color: #1d1d1f; border: 1px solid rgba(255,255,255,0.4);
    display: flex; align-items: center; gap: 8px;
}

.close-icon { font-style: normal; font-size: 16px; line-height: 1; color: #888; transition: color 0.2s; }
.tag-pill.active:hover .close-icon { color: #000; }

.results-body { 
    flex: 1;
    width: 100%;
    margin: 0 auto;
    padding: 80px 40px 40px 40px;
    box-sizing: border-box;
}
.empty-state {
    padding: 20vh 0 0 0;
    text-align: center;
    color: #cccccc;
}
.cards-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 30px; }
.list-fade-enter-active, .list-fade-leave-active { transition: all 0.3s; }
.list-fade-enter-from, .list-fade-leave-to { opacity: 0; transform: translateY(-10px); }

.clear-btn { color: #ff3b30; cursor: pointer; transition: 0.2s; }
.clear-btn:hover { opacity: 0.7; }

.corner-stack { position: fixed; bottom: 40px; right: 40px; z-index: 1000; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; pointer-events: none; }
.corner-stack > * { pointer-events: auto; }

.search-icon-mask {
  width: 16px;
  height: 16px;
  background-color: #333333;
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  margin: 0px 15px 1px 2px;
  flex-shrink: 0;
}

.x-icon-mask {
  width: 12px;
  height: 12px;
  background-color: #333333;
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  margin: 0px 2px 2px 0px;
  flex-shrink: 0;
  transition: background-color 0.2s;
}
.x-icon-mask:hover {
    background-color: #000000;
}

.hash-icon-mask {
  width: 20px;
  height: 20px;
  background-color: #333333;
  -webkit-mask-size: 18px 18px;
  mask-size: 18px 18px;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  margin: 0px 0px 0px 0px;
  flex-shrink: 0;
  overflow: visible
}
</style>