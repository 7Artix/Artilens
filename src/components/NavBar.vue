<template>
    <nav 
        class="navbar-container"
        ref="navbarRef"
        @mouseleave="handleMouseLeave"
    >
        <div class="navbar-wrapper">
            <div class="navbar-content">
                <ul class="nav-links">
                    <li 
                        v-for="item in menuItems" 
                        :key="item.path" 
                        @click="navigateTo(item.path)"
                        @mouseenter="isHovered = true; hoveredItem = item"
                        :class="{ 'active-title': hoveredItem === item }"
                    >
                        <div class="nav-item-top">
                            <!-- Case 1: Logo -->
                            <div v-if="item.label === 'logo'" class="nav-search-logo">
                                {{ item.name }}
                            </div>

                            <!-- Case 2: Has Icon -->
                            <template v-else-if="item.icon">
                                <img 
                                    v-if="item.label === 'account'" 
                                    :src="item.icon" 
                                    alt="Me"
                                    class="nav-avatar"
                                />
                                <img 
                                    v-else 
                                    :src="item.icon" 
                                    :alt="item.name"
                                    class="nav-icon"
                                />
                            </template>

                            <!-- Case 3: Normal Title -->
                            <span v-else class="nav-title">{{ item.name }}</span>
                        </div>
                    </li>
                </ul>
            </div>

            <!-- 动态下拉区 -->
            <Transition name="fade">
                <div v-if="isHovered && hoveredItem?.children?.length" class="navbar-dropdown">
                    <div class="dropdown-inner">
                        <div class="dropdown-column">
                            <span v-if="hoveredItem.label === 'object'" class="column-label">{{ `Explore ${hoveredItem.name}` }}</span>
                            <ul>
                                <li v-for="child in hoveredItem.children" :key="child.path" @click.stop="navigateTo(child.path)">
                                    {{ child.name }}
                                </li>
                            </ul>
                        </div>
                        <div class="dropdown-desc">
                            {{ hoveredItem.desc }}
                        </div>
                    </div>
                </div>
            </Transition>

        </div>
    </nav>

    <Teleport to="body">
        <div ref="backdropRef" class="nav-page-backdrop"></div>
    </Teleport>

</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import yaml from 'js-yaml'
import { NAV_HEIGHT } from '../config/constants'

const router = useRouter()
const isHovered = ref(false)
const hoveredItem = ref(null)
const navbarRef = ref(null)
const backdropRef = ref(null)

const menuItems = ref([])

const fetchNavData = async () => {
    try {
        const response = await fetch('/api/static/site/navbar.yaml')
        const text = await response.text()
        const data = yaml.load(text)

        const items = []
        
        // Items from YAML (including logo, avatar, search, and other menu items)
        if (data.items) {
            data.items.forEach(item => {
                items.push({
                    name: item.name,
                    path: item.path,
                    icon: item.icon || null,
                    label: item.label || null,
                    desc: item.desc || '',
                    children: item.subitems ? item.subitems.map(sub => ({
                        name: sub.name,
                        path: sub.path
                    })) : []
                })
            })
        }

        menuItems.value = items

    } catch (error) {
        console.error('Error fetching navbar configuration:', error)
    }
}

onMounted(() => {
    fetchNavData()
})

const navigateTo = (path) => {
    router.push(path)
    isHovered.value = false
    hoveredItem.value = null
}

const handleMouseLeave = () => {
    isHovered.value = false
    hoveredItem.value = null
}

watch([isHovered, hoveredItem], async () => {
    if (isHovered.value && hoveredItem.value?.children?.length > 0) {
        await nextTick()
        gsap.to(navbarRef.value, { height: 'auto', minHeight: 300, backgroundColor: 'rgba(255, 255, 255, 1)', duration: 0.4, ease: "expo.out", overwrite: true })
        gsap.to(backdropRef.value, { autoAlpha: 1, duration: 0.4, ease: "expo.out", overwrite: true })
    } else {
        gsap.to(navbarRef.value, { height: NAV_HEIGHT, minHeight: NAV_HEIGHT, backgroundColor: 'rgba(255, 255, 255, 0.6)', duration: 0.3, ease: "power2.inOut", overwrite: true })
        gsap.to(backdropRef.value, { autoAlpha: 0, duration: 0.3, ease: "power2.inOut", overwrite: true })
    }
})
</script>

<style scoped>
.navbar-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: v-bind(NAV_HEIGHT);
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px) saturate(160%);
    z-index: 9999;
    overflow: hidden;
    display: flex;
    justify-content: center;
}

.navbar-wrapper {
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    margin: 0 auto;
}

/* 主导航行 */
.navbar-content {
    padding: 0 30px; 
    width: 100%;
    height: v-bind(NAV_HEIGHT);
    display: flex;
    justify-content: center; 
    align-items: center;
    flex-shrink: 0;
    box-sizing: border-box;
}

/* 下拉区域样式 */
.navbar-dropdown {
    width: max-content;
    min-width: 100%;
    max-width: calc(50vw + 300px - 30px); 

    padding: 20px 30px 50px 30px;
    box-sizing: border-box;
}

/* 小屏幕适配，避免计算值在窄屏下失效 */
@media (max-width: 650px) {
    .navbar-dropdown {
        max-width: calc(100vw - 40px);
    }
}

.dropdown-inner {
    display: flex;
    gap: 80px;
    align-items: flex-start;
}

/* 确保左侧菜单项不被挤压 */
.dropdown-column {
    flex-shrink: 0;
}

.column-label {
    font-size: 10px;
    color: #8c8c8c;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 20px;
    display: block;
}

.dropdown-column ul { list-style: none; }
.dropdown-column li {
    color: #505050;
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 10px;
    cursor: pointer;
    transition: color 0.5s, text-shadow 0.5s;
}
.dropdown-column li:hover { color: #000000; text-shadow: 0 0 2px rgba(0, 0, 0, 0.2);}
.dropdown-desc { font-size: 12px; color: #86868b; line-height: 1.5; margin-top: -2px; text-align: justify; }

.nav-links { 
    display: flex; 
    list-style: none; 
    justify-content: space-between;
    width: 100%;
    padding: 0.;
    margin: 0;
}
.nav-links li { height: v-bind(NAV_HEIGHT); display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; }
.nav-item-top { height: v-bind(NAV_HEIGHT); display: flex; align-items: center; justify-content: center; white-space: nowrap; }
.nav-title { font-size: 12px; color: #333333; line-height: 1; transition: font-weight 0.2s; }

.active-title .nav-title {
    color: #000000;
}

.nav-icon {
    height: 12px;
    width: 12px;
    display: block;
}

.nav-search-logo { cursor: pointer; font-size: 12px; font-weight: 700; }

.nav-avatar {
    cursor: pointer;
    width: 1.8em;
    height: 1.8em;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.8);
    display: block;
    position: relative;
    filter: drop-shadow(0 0px 2px rgba(0, 0, 0, 0.2));
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.nav-page-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9998;
    background: rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(12px);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
}
</style>