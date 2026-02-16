<template>
  <div class="admin-modal" @click.self="$emit('close')">
    <div class="modal-window">
      <header class="modal-header">
        <div class="header-left">
          <h2>{{ localObj.id ? 'Edit Object' : 'New Object' }}</h2>
          <span class="obj-id">{{ localObj.id }}</span>
        </div>
        <div class="traffic-lights-modal">
          <button class="traffic-btn close" @click="$emit('close')"></button>
        </div>
      </header>

      <div class="modal-body">
        <div class="modal-layout">
          <!-- Left Column: Form -->
          <div class="column-form">
            <div class="form-group">
              <label>Title</label>
              <input v-model="localObj.name" class="modern-input large-text" />
            </div>

            <!-- Segments Row -->
            <div class="form-row">
              <div class="form-group half">
                <label>Type</label>
                <div class="segment-control">
                  <div 
                    class="segment-item" 
                    :class="{ active: localObj.type === 'project' }"
                    @click="localObj.type = 'project'"
                  >Project</div>
                  <div 
                    class="segment-item" 
                    :class="{ active: localObj.type === 'post' }"
                    @click="localObj.type = 'post'"
                  >Post</div>
                </div>
              </div>
              <div class="form-group half">
                <label>Visibility</label>
                <div class="segment-control">
                  <div 
                    class="segment-item" 
                    :class="{ active: localObj.visibility === 'public' }"
                    @click="localObj.visibility = 'public'"
                  >Public</div>
                  <div 
                    class="segment-item" 
                    :class="{ active: localObj.visibility === 'private' }"
                    @click="localObj.visibility = 'private'"
                  >Private</div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea v-model="localObj.description" rows="4" class="modern-textarea"></textarea>
            </div>

            <div class="form-group">
              <label>Tags</label>
              <div class="modern-tag-container">
                <div class="selected-zone">
                  <span v-for="tid in localObj.tags" :key="tid" class="pill-removable">
                    {{ getTagName(tid) }}
                    <span class="remove-icon" @click="removeTagFromEdit(tid)">×</span>
                  </span>
                </div>
                <div class="input-wrapper">
                  <input 
                    v-model="editTagInput" 
                    @input="showEditTagSuggestions = true"
                    @keydown.enter.prevent="handleEditTagConfirm" 
                    placeholder="+ Add tag..." 
                    class="tag-input"
                  />
                  <ul v-if="showEditTagSuggestions && editTagSuggestions.length > 0" class="tag-dropdown">
                    <li v-for="tag in editTagSuggestions" :key="tag.id" @click="addTagToEdit(tag)">
                      {{ tag.name }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Assets -->
          <div class="column-assets">
            <div class="assets-header">
              <label>Assets Management</label>
              <button 
                v-if="localObj.cardImages && localObj.cardImages.length > 0"
                class="text-btn warning" 
                @click="localObj.cardImages = []"
              >
                Clear Card Selection ({{ localObj.cardImages.length }})
              </button>
            </div>
            
            <!-- 修改：添加 @dragover.prevent 触发拖拽状态 -->
            <div class="assets-gallery" @dragover.prevent="isDragging = true">
              <!-- Asset Item -->
              <div 
                v-for="file in assets" 
                :key="file" 
                class="asset-thumbnail" 
                :class="{ 'is-cover': localObj.coverImage === file }"
              >
                <img :src="localObj.basePath + file" />
                
                <!-- Top Left: Card Checkbox -->
                <div 
                  class="corner-action top-left" 
                  :class="{ active: isCardSelected(file) }"
                  @click.stop="toggleCardImage(file)"
                  title="Show in Card Flow"
                >
                  <span class="check-icon">Card</span>
                </div>

                <!-- Top Right: Delete (Double Click Logic) -->
                <div 
                  class="corner-action top-right" 
                  :class="{ danger: confirmDeleteFile === file }"
                  @click.stop="handleDeleteClick(file)"
                >
                  <span v-if="confirmDeleteFile === file" class="del-text">Sure?</span>
                  <span v-else class="del-icon">×</span>
                </div>

                <!-- Bottom Bar: Cover Selection -->
                <div 
                  class="bottom-action" 
                  :class="{ active: localObj.coverImage === file }"
                  @click.stop="localObj.coverImage = file"
                >
                   {{ localObj.coverImage === file ? 'Main Cover' : 'Set as Cover' }}
                </div>
              </div>

              <!-- Upload Button -->
              <label class="upload-box">
                <input type="file" multiple @change="uploadFiles" hidden />
                <span class="plus">+</span>
                <span class="text">Upload</span>
              </label>

              <!-- 新增：拖拽遮罩层 -->
              <!-- 这个层只在 isDragging 为 true 时显示，并负责处理 drop 事件 -->
              <div 
                v-if="isDragging"
                class="drag-overlay"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
                @dragover.prevent
              >
                <span class="icon">☁️</span>
                <span class="text">Release to Upload</span>
              </div>
            </div>
            
            <p class="asset-hint">
              <strong>Bottom:</strong> Set 1 main cover. <br/>
              <strong>Top Left:</strong> Select multiple for homepage card flow.
            </p>
          </div>
        </div>
      </div>

      <footer class="modal-footer">
        <button @click="save" class="btn-primary">Save Changes</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  assets: { type: Array, default: () => [] },
  allTags: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'close', 'save', 'upload', 'create-tag', 'refresh-assets'])

// Initialize local object with default array for cardImages
const initObj = JSON.parse(JSON.stringify(props.modelValue))
if (!initObj.cardImages) initObj.cardImages = []
const localObj = ref(initObj)
const isDragging = ref(false) // 新增：拖拽状态

// Watch props change
watch(() => props.modelValue, (newVal) => {
  const copy = JSON.parse(JSON.stringify(newVal))
  if (!copy.cardImages) copy.cardImages = []
  localObj.value = copy
}, { deep: true })

// --- Logic: Card Images ---
const isCardSelected = (file) => localObj.value.cardImages.includes(file)

const toggleCardImage = (file) => {
  if (isCardSelected(file)) {
    localObj.value.cardImages = localObj.value.cardImages.filter(f => f !== file)
  } else {
    localObj.value.cardImages.push(file)
  }
}

// --- Logic: Delete Asset ---
const confirmDeleteFile = ref(null)

const handleDeleteClick = async (file) => {
  if (confirmDeleteFile.value === file) {
    // Second click: Do Delete
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/objects/${localObj.value.id}/assets/delete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ filename: file })
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Remove from local selections if deleted
        if (localObj.value.coverImage === file) localObj.value.coverImage = ''
        localObj.value.cardImages = localObj.value.cardImages.filter(f => f !== file)
        
        emit('refresh-assets') // Tell parent to reload assets
      } else {
        console.error('Delete failed:', data.message)
      }
    } catch (e) {
      console.error(e)
    } finally {
      confirmDeleteFile.value = null
    }
  } else {
    // First click: Request Confirmation
    confirmDeleteFile.value = file
    // Auto reset after 3 seconds
    setTimeout(() => {
      if (confirmDeleteFile.value === file) confirmDeleteFile.value = null
    }, 3000)
  }
}

// --- Logic: Tags ---
const editTagInput = ref('')
const showEditTagSuggestions = ref(false)
const getTagName = (id) => props.allTags.find(t => t.id === id)?.name || id

const editTagSuggestions = computed(() => {
  const q = editTagInput.value.trim().toLowerCase()
  if (!q) return []
  return props.allTags.filter(t => t.name.toLowerCase().includes(q) && !localObj.value.tags.includes(t.id))
})

const removeTagFromEdit = (id) => localObj.value.tags = localObj.value.tags.filter(tid => tid !== id)
const addTagToEdit = (tag) => {
  if (!localObj.value.tags.includes(tag.id)) localObj.value.tags.push(tag.id)
  editTagInput.value = ''; showEditTagSuggestions.value = false
}
const handleEditTagConfirm = () => {
  const name = editTagInput.value.trim()
  if (!name) return
  const existing = props.allTags.find(t => t.name.toLowerCase() === name.toLowerCase())
  if (existing) addTagToEdit(existing)
  else {
    emit('create-tag', name, (newTagId) => {
       if(!localObj.value.tags.includes(newTagId)) localObj.value.tags.push(newTagId)
       editTagInput.value = ''; showEditTagSuggestions.value = false
    })
  }
}

const uploadFiles = (e) => emit('upload', e.target.files)

// 新增：处理拖拽释放
const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files && files.length > 0) {
    emit('upload', files)
  }
}

const save = () => {
  emit('update:modelValue', localObj.value)
  emit('save', localObj.value)
}
</script>

<style scoped>
/* --- Modal Layout --- */
.admin-modal { position: fixed; inset: 0; z-index: 9999; background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; }
.modal-window { background: rgba(255, 255, 255, 1); backdrop-filter: blur(10px); width: 950px; max-height: 85vh; border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 0 40px 12px rgba(0, 0, 0, 0.2); overflow: hidden; animation: slideUp 0.3s ease-out; }
.modal-header { padding: 20px 30px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
.header-left h2 { font-size: 18px; font-weight: 700; margin: 0; display: inline-block; }
.obj-id { margin-left: 10px; font-family: monospace; background: #eee; padding: 2px 6px; border-radius: 4px; color: #666; font-size: 12px; }
.modal-body { flex: 1; overflow-y: auto; background: #fcfcfc; padding: 30px; }
.modal-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; }
.traffic-lights-modal { display: flex; gap: 6px; }
.traffic-btn { width: 16px; height: 16px; border-radius: 50%; border: none; cursor: pointer; padding: 0; }
.traffic-btn.close { background: #ff453a; transition: transform 0.2s; } .traffic-btn.close:hover { transform: scale(1.1); }

/* --- Form Styles --- */
.form-group { margin-bottom: 24px; }
.form-group label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #888; margin-bottom: 10px; letter-spacing: 0.5px; }
.modern-input, .modern-textarea { width: 100%; padding: 12px 16px; border: 1px solid #e0e0e0; border-radius: 12px; outline: none; transition: 0.2s; background: #fff; }
.modern-input:focus, .modern-textarea:focus { border-color: #007aff; box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1); }
.form-row { display: flex; gap: 20px; } .form-group.half { flex: 1; }

/* Segment Control */
.segment-control { display: flex; background: #f0f0f5; padding: 4px; border-radius: 10px; width: 100%; }
.segment-item { 
  flex: 1; text-align: center; padding: 8px 0; font-size: 13px; font-weight: 600; color: #666; 
  border-radius: 8px; cursor: pointer; transition: all 0.2s; user-select: none;
}
.segment-item.active { background: white; color: #000; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

/* Tags */
.modern-tag-container { background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 8px; min-height: 50px; }
.selected-zone { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 5px; }
.pill-removable { background: #eef2ff; color: #4f46e5; border: 1px solid #c7d2fe; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; }
.remove-icon { cursor: pointer; opacity: 0.6; } .remove-icon:hover { opacity: 1; }
.tag-input { width: 100%; border: none; outline: none; padding: 5px; }
.tag-dropdown { position: absolute; background: white; border: 1px solid #eee; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 200px; max-height: 200px; overflow-y: auto; list-style: none; padding: 5px; z-index: 10; margin-top: 5px; }
.tag-dropdown li { padding: 8px 12px; font-size: 13px; cursor: pointer; border-radius: 6px; }
.tag-dropdown li:hover { background: #f5f5f7; color: #007aff; }

/* --- Assets Gallery (New) --- */
.column-assets { display: flex; flex-direction: column; }
.assets-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.text-btn { background: none; border: none; font-size: 11px; cursor: pointer; font-weight: 600; }
.text-btn.warning { color: #ff3b30; } .text-btn.warning:hover { text-decoration: underline; }

/* 修改：添加 position: relative 以便定位遮罩层 */
.assets-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; position: relative; }
.asset-thumbnail { 
  aspect-ratio: 1; border-radius: 12px; overflow: hidden; position: relative; 
  border: 1px solid rgba(0,0,0,0.05); background: #eee;
  transition: transform 0.2s;
}
.asset-thumbnail img { width: 100%; height: 100%; object-fit: cover; transition: 0.3s; }
.asset-thumbnail:hover img { transform: scale(1.05); }

/* Overlays */
.corner-action {
  position: absolute; width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 2; backdrop-filter: blur(4px);
  transition: all 0.2s;
}
.top-left { top: 6px; left: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.3); color: white; width: auto; padding: 0 8px; font-size: 10px; font-weight: 600; }
.top-left.active { background: #007aff; border-color: #007aff; }

.top-right { top: 6px; right: 6px; background: rgba(255,255,255,0.8); color: #666; font-size: 16px; font-weight: 300; }
.top-right:hover { background: #fff; color: #000; }
.top-right.danger { background: #ff3b30; color: white; width: auto; padding: 0 8px; font-size: 10px; font-weight: 600; }

.bottom-action {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 28px; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
  color: rgba(255,255,255,0.8); font-size: 11px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: 0.2s;
}
.bottom-action:hover { background: rgba(0,0,0,0.7); color: white; }
.bottom-action.active { background: #32d74b; color: white; }

/* Upload Box */
.upload-box { 
  aspect-ratio: 1; border: 2px dashed #ddd; border-radius: 12px; 
  display: flex; flex-direction: column; align-items: center; justify-content: center; 
  color: #999; cursor: pointer; transition: 0.2s; background: white;
}
.upload-box:hover { border-color: #007aff; color: #007aff; background: #f8fbff; }
.upload-box .plus { font-size: 24px; margin-bottom: 4px; }
.upload-box .text { font-size: 12px; font-weight: 600; }

/* 新增：拖拽遮罩层样式 */
.drag-overlay {
  position: absolute; inset: 0; z-index: 50;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  border: 2px dashed #007aff;
  border-radius: 12px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #007aff;
  transition: all 0.2s;
}
.drag-overlay .text { font-weight: 600; margin-top: 10px; font-size: 14px; }
.drag-overlay .icon { font-size: 32px; }

.asset-hint { margin-top: 15px; font-size: 11px; color: #999; line-height: 1.5; }

/* Footer */
.modal-footer { padding: 20px 30px; border-top: 1px solid #f0f0f0; background: #fff; display: flex; justify-content: flex-end; gap: 15px; }
.btn-primary { background: #1d1d1f; color: white; border: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 13px; transition: opacity 0.2s; }
.btn-primary:hover { opacity: 0.8; }

@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; }}
</style>