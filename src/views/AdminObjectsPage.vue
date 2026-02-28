<template>
  <div class="admin-objects-page">
    <div class="admin-toolbar">
      <div class="search-box">
        <input v-model="searchQuery" placeholder="Search objects..." class="modern-input" />
      </div>
      <button class="btn-create" @click="handleCreate">
        <svg viewBox="0 0 24 24" class="plus-svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        New Object
      </button>
    </div>

    <div class="objects-grid">
      <ObjectProfile
        v-for="obj in filteredObjects" 
        :key="obj.id" 
        :obj="obj"
        mode="admin"
        :is-pinned="isPinned(obj.id)"
        :all-tags="allTags"
        @toggle-pin="togglePin"
        @edit="openEditor"
        @delete="handleDelete"
      />
    </div>

    <!-- Object Edit Pop-up -->
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
import { ref, computed, onMounted } from 'vue'
import ObjectProfile from '../components/ObjectProfile.vue' 
import ObjectEdit from '../components/ObjectEdit.vue'

const allObjects = ref([])
const allTags = ref([])
const pinnedIds = ref([])
const searchQuery = ref('')
const editingObj = ref(null)
const projectAssets = ref([])

const filteredObjects = computed(() => {
  return allObjects.value.filter(obj => {
    const q = searchQuery.value.toLowerCase()
    return obj.name.toLowerCase().includes(q) || (obj.description && obj.description.toLowerCase().includes(q))
  }).sort((a, b) => new Date(b.dateModified) - new Date(a.dateModified))
})

const init = async () => {
  const token = localStorage.getItem('authToken')
  const headers = { 'Authorization': `Bearer ${token}` }
  
  const [oRes, tRes, pRes] = await Promise.all([
    fetch('/api/objects/list', { headers }), 
    fetch('/api/tags/list'),
    fetch('/api/pinned/list')
  ])
  allObjects.value = await oRes.json()
  allTags.value = await tRes.json()
  pinnedIds.value = await pRes.json()
}

onMounted(init)

const isPinned = (id) => pinnedIds.value.includes(id)

const togglePin = async (id) => {
  const token = localStorage.getItem('authToken')
  let newPinned = [...pinnedIds.value]
  if (newPinned.includes(id)) newPinned = newPinned.filter(pid => pid !== id)
  else newPinned.push(id)
  
  const res = await fetch('/api/pinned/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(newPinned)
  })
  if ((await res.json()).success) pinnedIds.value = newPinned
}

const fetchAssets = async () => {
  if (!editingObj.value) return
  const res = await fetch(`/api/objects/${editingObj.value.id}/assets`)
  projectAssets.value = await res.json()
}

const handleCreate = async () => {
  const token = localStorage.getItem('authToken')
  const res = await fetch('/api/objects/create', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
    body: JSON.stringify({}) 
  })
  const result = await res.json()
  if (result.success) {
    await init()
    openEditor(result.data)
  }
}

const openEditor = async (obj) => {
  projectAssets.value = [] 
  editingObj.value = JSON.parse(JSON.stringify(obj))
  await fetchAssets()
}

const saveConfig = async (objData) => {
  const token = localStorage.getItem('authToken')
  await fetch('/api/objects/update', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
    body: JSON.stringify(objData) 
  })
  editingObj.value = null
  init()
}

const handleDelete = async (id) => {
  if (!confirm("Are you sure?")) return
  const token = localStorage.getItem('authToken')
  const res = await fetch('/api/objects/delete', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
    body: JSON.stringify({ id }) 
  })
  if ((await res.json()).success) init()
}

const handleCreateNewTag = async (name, callback) => {
  const token = localStorage.getItem('authToken')
  const res = await fetch('/api/tags/create', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
    body: JSON.stringify({ name }) 
  })
  const result = await res.json()
  if (result.success) { 
    allTags.value.push(result.data)
    callback(result.data.id)
  }
}

const handleUploadFiles = async (files) => {
  const token = localStorage.getItem('authToken')
  const formData = new FormData()
  for (let file of files) formData.append('files', file)
  await fetch(`/api/objects/${editingObj.value.id}/upload`, { 
    method: 'POST', 
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData 
  })
  await fetchAssets()
}
</script>

<style scoped>
.admin-objects-page {
  padding: 20px;
}

.admin-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  gap: 20px;
}

.search-box {
  flex: 1;
}

.modern-input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #333;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.btn-create:hover {
  background: #000;
}

.plus-svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.objects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
</style>
