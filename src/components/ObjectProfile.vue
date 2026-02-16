<template>
  <div class="object-card">
    <div class="card-hero" @click="$emit('view', obj.id)">
      <div class="hero-img" :style="{ backgroundImage: `url(${obj.basePath + obj.coverImage})` }"></div>
      <div class="hero-overlay">
        <p class="description">{{ obj.description }}</p>
      </div>
      
      <!-- Tags Container (Top Left) -->
      <div class="hero-badges">
        <!-- [NEW] Type Badge -->
        <div class="badge-capsule type" :class="getTypeClass(obj.type)">
          <span>{{ obj.type }}</span>
        </div>
      </div>

      <!-- Pinned Badge (Top Right) -->
      <div v-if="isPinned" class="badge-capsule pinned" :class="{ 'admin-offset': mode === 'admin' }">
        <span>Pinned</span>
      </div>

      <div v-if="mode === 'admin'" class="admin-traffic-lights" @click.stop>
        <button class="traffic-btn pin" :class="{ active: isPinned }" @click="$emit('toggle-pin', obj.id)"></button>
        <button class="traffic-btn edit" @click="$emit('edit', obj)"></button>
        <button class="traffic-btn close" @click="$emit('delete', obj.id)">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
    </div>

    <div class="card-footer">
      <h3 class="title scroll-fade">{{ obj.name }}</h3>
      <div class="meta-bottom">
        <div class="tag-list scroll-fade">
          <!-- 修改部分: 使用 MiniTag 组件 -->
          <MiniTag 
            v-for="tid in obj.tags" 
            :key="tid" 
            :id="tid" 
            :name="getTagName(tid)" 
          />
        </div>
        <span class="date">{{ formatDate(obj.dateCreated) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import MiniTag from './MiniTag.vue' // 引入组件

const props = defineProps({
  obj: { type: Object, required: true },
  mode: { type: String, default: '' },
  isPinned: { type: Boolean, default: false },
  allTags: { type: Array, default: () => [] }
})

const emit = defineEmits(['view', 'toggle-pin', 'edit', 'delete'])

const getTagName = (id) => props.allTags.find(t => t.id === id)?.name || id
const formatDate = (iso) => new Date(iso).toLocaleDateString()

const getTypeClass = (type) => {
  if (type === 'post') return 'blue-bg'
  if (type === 'project') return 'orange-bg'
  return ''
}
</script>

<style scoped>
.object-card { background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.05); transition: box-shadow 0.4s; position: relative; z-index: 1000;}
.card-hero { position: relative; aspect-ratio: 1 / 1; cursor: pointer; overflow: hidden; }
.hero-img { width: 100%; height: 100%; background-size: cover; background-position: center; transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1); }
.hero-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; padding: 30px; opacity: 0; transition: 0.4s; backdrop-filter: blur(8px); }
.object-card:hover .hero-img { transform: scale(1.05); }
.object-card:hover .hero-overlay { opacity: 1; }
.description { color: white; text-align: start; font-size: 18px; line-height: 1.5; }

/* Badges Container */
.hero-badges { position: absolute; top: 15px; left: 15px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }

.badge-capsule {
  backdrop-filter: blur(10px);
  padding: 4px 12px; border-radius: 20px;
  color: white; font-size: 12px; font-weight: 600; text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.badge-capsule.pinned { 
  background: rgba(50, 215, 75, 0.6); 
  position: absolute;
  top: 15px;
  right: 15px;
  transition: top 0.3s ease;
  z-index: 5;
}
.badge-capsule.pinned.admin-offset {
  top: 55px;
}
.badge-capsule.type { background: rgba(0, 0, 0, 0.4); }
.badge-capsule.type.blue-bg { background: rgba(0, 122, 255, 0.6); }
.badge-capsule.type.orange-bg { background: rgba(255, 149, 0, 0.6); }

.admin-traffic-lights {
  position: absolute; top: 15px; right: 15px;
  display: flex; gap: 8px; z-index: 10;
  background: rgba(0,0,0,0.15); backdrop-filter: blur(8px);
  padding: 6px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);
}
.traffic-btn { width: 14px; height: 14px; border-radius: 50%; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; transition: 0.2s; position: relative; }
.traffic-btn svg { width: 8px; height: 8px; fill: rgba(0,0,0,0.5); display: none; }
.traffic-btn:hover { transform: scale(1.1); }
.traffic-btn:hover svg { display: block; }
.traffic-btn.pin { background: #32d74b; }
.traffic-btn.pin.active { box-shadow: inset 0 0 0 2px rgba(0,0,0,0.3); }
.traffic-btn.edit { background: #ffcc00; }
.traffic-btn.close { background: #ff453a; }
.traffic-btn.close svg { fill: rgba(50,0,0,0.6); }

.card-footer { padding: 16px; }
.title { font-weight: 600; font-size: 22px; margin-bottom: 12px; margin-top: 0px; color: #1d1d1f; }
.meta-bottom { display: flex; align-items: center; justify-content: space-between; overflow: hidden; }
.scroll-fade { white-space: nowrap; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; mask-image: linear-gradient(to right, black 95%, transparent 100%); -webkit-mask-image: linear-gradient(to right, black 95%, transparent 100%); }
.scroll-fade::-webkit-scrollbar { display: none; }
.tag-list { display: flex;
  align-items: center;
  flex: 1;
  margin-right: 15px;
  padding: 5px;
}

.date { font-size: 12px; color: #86868b; flex-shrink: 0; }
</style>