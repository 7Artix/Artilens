<template>
    <div class="page-container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
        </div>

        <div v-else-if="obj" class="content-wrapper">
            <div 
                class="header-banner"
                :style="{ backgroundImage: `url(${obj.assetBase + obj.coverImage})` }"
            ></div>

            <!-- 内容主体区域 -->
            <main class="page-body">
                
                <!-- 标题信息区域 -->
                <section class="project-header">
                    <h1 class="project-title">{{ obj.name }}</h1>
                    <div class="project-meta-row">
                        <span class="meta-item">Created Date: {{ formatDate(obj.dateCreated) }}</span>
                        <span class="meta-item">Author: {{ obj.author }}</span>
                    </div>
                </section>

                <!-- 标签展示 -->
                <section class="tag-list scroll-fade">
                    <MiniTag 
                        v-for="tid in obj.tags" 
                        :key="tid" 
                        :id="tid" 
                        :name="getTagName(tid)" 
                    />
                </section>

                <!-- 
                    Markdown 渲染区 
                    说明：这里使用 :content 属性直接传入 API 返回的文本。
                    MarkdownRenderer 组件检测到 content 有值时，会自动跳过内部的 fetch 逻辑，
                    所以这里不会产生重复的网络请求。
                -->
                <MarkdownRenderer 
                    :content="obj.markdown" 
                    :asset-base="obj.assetBase" 
                />
            </main>
            <PageFooter/>
        </div>

        <!-- Floating tools at the corner -->
        <div class="corner-stack"><BackTop/></div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageFooter from '../components/PageFooter.vue'
import MiniTag from '../components/MiniTag.vue'
import BackTop from '../components/BackTop.vue'
import MarkdownRenderer from '../components/MarkdownRenderer.vue'
import { NAV_HEIGHT } from '../config/constants' // 修复：补充引入常量，否则 CSS 中的 v-bind 会失效

const route = useRoute()
const obj = ref(null)
const tagsDict = ref([])
const loading = ref(true)

const getTagName = (id) => tagsDict.value.find(t => t.id === id)?.name || id
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString() : 'Unknown'

const fetchData = async () => {
    try {
        const id = route.params.id
        // 这里的 fetch 是获取对象的完整 JSON 数据（包含 Header 所需的元数据和 Markdown 内容）
        const [objRes, tagRes] = await Promise.all([
            fetch(`/api/objects/${id}`),
            fetch('/api/tags/list')
        ])
        obj.value = await objRes.json()
        tagsDict.value = await tagRes.json()
    } finally {
        loading.value = false
    }
}

onMounted(fetchData)
</script>

<style scoped>
.page-container { 
    /* 使用 v-bind 绑定 JS 变量 */
    min-height: calc(100vh - v-bind(NAV_HEIGHT));
    display: flex;
    flex-direction: column;
    background: #f9f9f9;
    padding-top: 0;
    box-sizing: border-box;
}

.header-banner {
    width: 100%;
    height: 300px;
    background-color: #f9f9f9;
    
    background-size: cover; 
    background-position: center center;
    background-repeat: no-repeat;
}

.project-header {
    margin-top: 30px;
    margin-bottom: 15px;
    text-align: left;
}

.project-title {
    font-size: 2.5rem;
    font-weight: 800;
    max-width: 800px;
    margin: 0 0 12px 0;
    line-height: 1.2;
    color: #24292f;
}

.project-meta-row {
    display: flex;
    align-items: center;
    font-size: 0.95rem;
    color: #666;
}

.meta-item {
    display: inline-flex;
    align-items: center;
    position: relative;
}

.meta-item:not(:last-child) {
    margin-right: 16px;
}

.meta-item:not(:last-child)::after {
    content: '';
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 0.95rem;
    background-color: #ddd;
    pointer-events: none;
}

/* 内容排版 */
.page-body {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px 40px;
}

.scroll-fade { 
    white-space: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    mask-image: linear-gradient(to right, black 95%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, black 95%, transparent 100%);
}
.scroll-fade::-webkit-scrollbar { display: none; }

.tag-list { 
    display: flex;
    align-items: center;
    flex: 1;
    padding: 5px;
    margin-bottom: 20px;
}

.loading-state { height: 100vh; display: flex; align-items: center; justify-content: center; }
.spinner { width: 30px; height: 30px; border: 3px solid #ffffff; border-top-color: #000000; border-radius: 50%; animation: s 1s linear infinite; }
@keyframes s { to { transform: rotate(360deg); } }

.corner-stack { position: fixed; bottom: 40px; right: 40px; z-index: 1000; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; pointer-events: none; }
.corner-stack > * { pointer-events: auto; }
</style>